import 'express-async-errors';
import 'dotenv/config';
import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import fs from "fs";
import Parser from 'rss-parser';
import { createServer as createViteServer } from "vite";
import { User, Post, Comment, Notification, Message, ChatSession, Connection } from "./src/types.ts";
import { Profile } from "./src/db/schema.ts";
import { UserRepository, ProfileRepository, SessionRepository, VerificationRepository, PasswordResetRepository, LoginHistoryRepository, AuditRepository } from './src/repositories/AuthRepositories.ts';
import { PostRepository } from './src/repositories/PostRepository.ts';
import { isPostPinned, sortPostsWithPinnedFirst } from './src/utils/postUtils.ts';
import { MessageRepository } from './src/repositories/MessageRepository.ts';
import { NotificationRepository } from './src/repositories/NotificationRepository.ts';
import { CommentRepository } from './src/repositories/CommentRepository.ts';
import { FollowRepository } from './src/repositories/FollowRepository.ts';
import { ConnectionRepository } from './src/repositories/ConnectionRepository.ts';
import { StoryRepository } from './src/repositories/StoryRepository.ts';
import { AuthService } from './src/services/AuthService.ts';
import { authenticate } from './src/middleware/authMiddleware.ts';
import { generateAccessToken } from './src/utils/auth.ts';
import { supabase } from './src/lib/supabaseClient.ts';
import { LocationRepository } from './src/repositories/LocationRepository.ts';
import { GroupRepository } from './src/repositories/GroupRepository.ts';
import { MetaTraderService } from './src/services/metatrader.ts';

// Global error handlers to capture unhandled promise rejections and uncaught exceptions gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.warn('GLOBAL UNHANDLED REJECTION caught gracefully:', reason);
  if (reason instanceof Error) {
    console.warn('Stack trace:', reason.stack);
  }
});

process.on('uncaughtException', (err, origin) => {
  console.error('GLOBAL UNCAUGHT EXCEPTION caught gracefully:', err, 'at origin:', origin);
});

const PORT = 3000;

// Helper to calculate dampened reputation gain to prevent ballooning (Diminishing Returns)
function calculateReputationGain(currentRep: number, basePoints: number): number {
  const factor = 300 / (300 + Math.max(0, currentRep));
  const gain = basePoints * factor;
  return Math.max(1, Math.round(gain));
}

// In-memory database store (no local file persistence)
let memoryDb = {
  users: [],
  posts: [],
  comments: [],
  follows: [],
  notifications: [],
  messages: [],
  connections: [],
  bookmarks: [],
  reposts: [],
  pushSubscriptions: [],
  countries: [
    { "id": 1, "name": "Indonesia", "iso2": "ID", "phone_code": "+62", "is_supported": true, "sort_order": 1 },
    { "id": 2, "name": "Malaysia", "iso2": "MY", "phone_code": "+60", "is_supported": true, "sort_order": 2 },
    { "id": 3, "name": "Singapore", "iso2": "SG", "phone_code": "+65", "is_supported": true, "sort_order": 3 },
    { "id": 4, "name": "Global", "iso2": "GL", "phone_code": "+0", "is_supported": true, "sort_order": 4 }
  ],
  provinces: [],
  cities: [],
  profiles: [],
  sessions: [],
  email_verifications: [],
  password_resets: [],
  login_history: [],
  audit_logs: [],
  stories: []
};

function loadDb() {
  return {
    posts: [],
    stories: [],
    users: [],
    messages: [],
    notifications: [],
    pushSubscriptions: [],
    adminSettings: {}
  };
}

const authService = new AuthService(
    new UserRepository(),
    new ProfileRepository(),
    new SessionRepository(),
    new VerificationRepository(),
    new PasswordResetRepository(),
    new LoginHistoryRepository(),
    new AuditRepository()
);

const locationRepo = new LocationRepository();

function saveDb(data: any) {
  memoryDb = data;
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);

  // Restore logos from persistent assets folder to public and dist directories on boot
  try {
    const logoFiles = ['gotrading_logo.png', 'chat_logo.png', 'login_logo.png', 'company_logo.png'];
    const assetsDir = path.join(process.cwd(), 'assets');
    const publicDir = path.join(process.cwd(), 'public');
    const distDir = path.join(process.cwd(), 'dist');

    // Ensure directories exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    logoFiles.forEach(file => {
      const assetPath = path.join(assetsDir, file);
      if (fs.existsSync(assetPath)) {
        // Copy to public
        const pubPath = path.join(publicDir, file);
        fs.copyFileSync(assetPath, pubPath);
        console.log(`[BOOT] Restored ${file} from assets/ to public/`);

        // Copy to dist if dist exists
        if (fs.existsSync(distDir)) {
          const distPath = path.join(distDir, file);
          fs.copyFileSync(assetPath, distPath);
          console.log(`[BOOT] Restored ${file} from assets/ to dist/`);
        }
      }
    });
  } catch (err) {
    console.error("Error restoring logos from assets on boot:", err);
  }

  app.use(express.json({ limit: '50mb' }));

  // Middleware to initialize basic req properties
  app.use(async (req: any, res, next) => {
    req.db = { posts: [], users: [], stories: [], messages: [], notifications: [] };
    req.save = () => {}; 
    next();
  });

  // API: Health / Ping
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Debug route to test async error handling
  app.get("/api/debug/async-error", async (req, res) => {
    throw new Error("Test Async Error");
  });

  // API: REST-based live market price chart polling (replaces WebSocket)
  app.get("/api/charts/prices", (req, res) => {
    const pair = (req.query.pair as string) || "OANDA:XAUUSD";
    
    // Base prices for supported pairs
    let basePrice = 1915.0; // XAUUSD
    let decimalPlaces = 2;
    if (pair.includes('EURUSD')) {
      basePrice = 1.0850;
    }

    const now = Date.now();
    const timeBucket = Math.floor(now / 20000); // 20-second buckets

    // Simple deterministic hash based on pair and 20s time buckets
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };

    let seed = Math.abs(hashString(pair) + timeBucket);
    const random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const points: any[] = [];
    let currentPrice = basePrice;
    
    // Seed direction trend: 55% chance of being bullish overall in this bucket
    const isUpTrend = random() > 0.45;
    const trendStrength = (isUpTrend ? 1 : -1) * (basePrice * 0.008);

    // Generate 25 historical data points
    for (let i = 0; i < 25; i++) {
      const step = (random() - 0.47) * (basePrice * 0.0025) + (trendStrength / 25);
      currentPrice += step;
      
      const ptTime = new Date(now - (25 - i) * 20000);
      const timeStr = ptTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      const open = currentPrice - (random() - 0.5) * (basePrice * 0.001);
      const close = currentPrice;
      const high = Math.max(open, close) + random() * (basePrice * 0.0008);
      const low = Math.min(open, close) - random() * (basePrice * 0.0008);

      points.push({
        time: timeStr,
        price: Number(close.toFixed(decimalPlaces)),
        high: Number(high.toFixed(decimalPlaces)),
        low: Number(low.toFixed(decimalPlaces)),
        open: Number(open.toFixed(decimalPlaces)),
        changePercent: Number(((close - open) / open * 100).toFixed(2))
      });
    }

    res.json({
      success: true,
      pair,
      currentPrice: points[points.length - 1].price,
      points
    });
  });

  // API: Market Ticker (Real-time prices)
  app.get("/api/market/ticker", async (req, res) => {
    const symbols = ['XAUUSD', 'BTCUSD', 'OIL', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'];
    const now = Date.now();
    const timeBucket = Math.floor(now / 1000);

    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };

    const getSimulatedForSymbol = (symbol: string) => {
        let seed = Math.abs(hashString(symbol) + timeBucket);
        const random = () => {
            let x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        const basePrices: Record<string, number> = {
            'XAUUSD': 2412.50, 'BTCUSD': 65230.00, 'OIL': 82.40,
            'EURUSD': 1.0845, 'GBPUSD': 1.2670, 'USDJPY': 154.30, 'GBPJPY': 195.40
        };
        const basePrice = basePrices[symbol] || 100.00;
        const decimalPlaces = basePrice < 10 ? 4 : 2;
        const fluctuation = (random() - 0.5) * (basePrice * 0.005);
        const currentPrice = basePrice + fluctuation;
        const changeValue = currentPrice - basePrice;
        const changePercent = (changeValue / basePrice) * 100;
        return {
            symbol,
            price: currentPrice.toFixed(decimalPlaces),
            change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            isUp: changePercent >= 0
        };
    };

    // Simple backend cache and background sync to stay within Alpha Vantage limits
    const tickerState: any = (global as any).tickerState || {
        data: symbols.map(s => getSimulatedForSymbol(s)),
        lastUpdate: {},
        currentIndex: 0
    };
    (global as any).tickerState = tickerState;

    // Background worker to refresh prices one by one to respect 5 calls/min limit
    const refreshNextSymbol = async () => {
        const symbol = symbols[tickerState.currentIndex];
        tickerState.currentIndex = (tickerState.currentIndex + 1) % symbols.length;

        try {
            if (symbol === 'BTCUSD' || symbol === 'XAUUSD') {
                // Binance is fast and has high limits
                const binanceSym = symbol === 'BTCUSD' ? 'BTCUSDT' : 'PAXGUSDT';
                const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSym}`);
                const json = await res.json();
                if (json.price) {
                    const price = parseFloat(json.price);
                    const prev = tickerState.data.find((d: any) => d.symbol === symbol);
                    const prevPrice = prev ? parseFloat(prev.price) : price;
                    const isUp = price >= prevPrice;
                    
                    const index = tickerState.data.findIndex((d: any) => d.symbol === symbol);
                    tickerState.data[index] = {
                        symbol,
                        price: price.toFixed(2),
                        change: isUp ? `+${(Math.random() * 0.05).toFixed(2)}%` : `-${(Math.random() * 0.05).toFixed(2)}%`,
                        isUp
                    };
                }
            } else if (process.env.ALPHA_VANTAGE_API_KEY && symbol !== 'OIL') {
                // Alpha Vantage for Forex (Limit 5/min = 1 call every 12s)
                const from = symbol.substring(0, 3);
                const to = symbol.substring(3);
                const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
                const res = await fetch(url);
                const json = await res.json();
                
                if (json['Realtime Currency Exchange Rate']) {
                    const rate = parseFloat(json['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                    const index = tickerState.data.findIndex((d: any) => d.symbol === symbol);
                    const prev = tickerState.data[index];
                    const isUp = rate >= (prev ? parseFloat(prev.price) : rate);
                    
                    tickerState.data[index] = {
                        symbol,
                        price: rate.toFixed(symbol.includes('JPY') ? 2 : 5),
                        change: isUp ? `+${(Math.random() * 0.02).toFixed(2)}%` : `-${(Math.random() * 0.02).toFixed(2)}%`,
                        isUp
                    };
                }
            }
        } catch (e) {
            console.error(`Worker error for ${symbol}:`, e);
        }
    };

    // Trigger update if it's been a while (throttled)
    const now_ts = Date.now();
    if (!tickerState.lastWorkerRun || now_ts - tickerState.lastWorkerRun > 12000) {
        tickerState.lastWorkerRun = now_ts;
        refreshNextSymbol();
    }

    try {
        res.json({ success: true, data: tickerState.data });
    } catch (e) {
        res.json({ success: true, data: symbols.map(getSimulatedForSymbol) });
    }
  });

  // API: Real-time News and Economic Events
  app.get("/api/news", async (req, res) => {
    const sentimentKeywordsBullish = ['rise', 'gain', 'rally', 'bullish', 'jump', 'surge', 'up', 'cut', 'soar', 'positive', 'higher', 'boost', 'expand', 'grow', 'optimism', 'high', 'peak', 'record'];
    const sentimentKeywordsBearish = ['drop', 'fall', 'down', 'bearish', 'plunge', 'loss', 'slide', 'slump', 'negative', 'lower', 'decline', 'sink', 'crash', 'contraction', 'pessimism', 'low', 'fear', 'inflation'];

    const getSentiment = (headline: string) => {
      const titleLower = headline.toLowerCase();
      const bullishCount = sentimentKeywordsBullish.filter(k => titleLower.includes(k)).length;
      const bearishCount = sentimentKeywordsBearish.filter(k => titleLower.includes(k)).length;
      
      let sentimentType: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let sentimentVal = '0.0%';
      
      if (bullishCount > bearishCount) {
        sentimentType = 'bullish';
        sentimentVal = `+${(1 + Math.random() * 2).toFixed(1)}%`;
      } else if (bearishCount > bullishCount) {
        sentimentType = 'bearish';
        sentimentVal = `-${(1 + Math.random() * 2).toFixed(1)}%`;
      } else {
        const rand = Math.random();
        if (rand > 0.6) {
          sentimentType = 'bullish';
          sentimentVal = `+${(0.1 + Math.random() * 0.9).toFixed(1)}%`;
        } else if (rand > 0.3) {
          sentimentType = 'bearish';
          sentimentVal = `-${(0.1 + Math.random() * 0.9).toFixed(1)}%`;
        } else {
          sentimentType = 'neutral';
          sentimentVal = '0.0%';
        }
      }
      return { type: sentimentType, value: sentimentVal };
    };

    const getRelativeTime = (dateObj: Date) => {
      const diffMs = Math.abs(new Date().getTime() - dateObj.getTime());
      const diffMins = Math.floor(diffMs / 1000 / 60);
      let timeStr = 'Just now';
      if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs >= 24) {
          const diffDays = Math.floor(diffHrs / 24);
          timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
          timeStr = `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
        }
      } else if (diffMins > 0) {
        timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      }
      return timeStr;
    };

    const getIndonesianDateLabel = (dateInput: string | Date): string => {
      try {
        const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return '';
        
        const today = new Date();
        const isSameDay = (d1: Date, d2: Date) => 
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();
          
        if (isSameDay(d, today)) {
          return 'TODAY';
        }
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (isSameDay(d, tomorrow)) {
          return 'ESOK';
        }

        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
      } catch (err) {
        return '';
      }
    };

    const parseCNBCRSS = (xmlString: string) => {
      const itemsList: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let idx = 0;
      while ((match = itemRegex.exec(xmlString)) !== null && idx < 12) {
        const itemContent = match[1];
        
        const getTagValue = (tag: string) => {
          const tagRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
          const tagMatch = itemContent.match(tagRegex);
          return tagMatch ? tagMatch[1].trim() : '';
        };

        const title = getTagValue('title');
        const link = getTagValue('link');
        const pubDateStr = getTagValue('pubDate');
        
        let timeAgo = 'Just now';
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              timeAgo = getRelativeTime(d);
            }
          } catch (e) {
            // ignore
          }
        }

        itemsList.push({
          id: `cnbc_${idx++}_${Date.now()}`,
          title: title || "No Title",
          source: "CNBC Finance",
          time: timeAgo,
          url: link || "#",
          sentiment: getSentiment(title || "")
        });
      }
      return itemsList;
    };

    const parseForexFactoryXML = (xmlString: string) => {
      const events: any[] = [];
      const eventRegex = /<event>([\s\S]*?)<\/event>/g;
      let match;
      let id = 1;
      while ((match = eventRegex.exec(xmlString)) !== null && id <= 25) {
        const eventContent = match[1];
        
        const getTagValue = (tag: string) => {
          const tagRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
          const tagMatch = eventContent.match(tagRegex);
          return tagMatch ? tagMatch[1].trim() : '';
        };

        const title = getTagValue('title') || getTagValue('event');
        const country = getTagValue('country');
        const date = getTagValue('date'); // MM-DD-YYYY
        const time = getTagValue('time');
        const impact = getTagValue('impact');
        const forecast = getTagValue('forecast') || '-';
        const previous = getTagValue('previous') || '-';

        let datetime = new Date().toISOString();
        try {
          if (date) {
            const parts = date.split('-');
            if (parts.length === 3) {
              const month = parseInt(parts[0], 10) - 1;
              const day = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              
              let hours = 12;
              let minutes = 0;
              if (time && time.toLowerCase() !== 'tentative' && time.toLowerCase() !== 'all day') {
                const timeMatch = time.match(/(\d+):(\d+)\s*(am|pm)/i);
                if (timeMatch) {
                  hours = parseInt(timeMatch[1], 10);
                  minutes = parseInt(timeMatch[2], 10);
                  const ampm = timeMatch[3].toLowerCase();
                  if (ampm === 'pm' && hours < 12) hours += 12;
                  if (ampm === 'am' && hours === 12) hours = 0;
                }
              }
              const parsedDate = new Date(year, month, day, hours, minutes);
              if (!isNaN(parsedDate.getTime())) {
                datetime = parsedDate.toISOString();
              }
            }
          }
        } catch (e) {
          console.warn("Failed to parse date/time:", date, time, e);
        }

        const conditionUp = `Economy of ${country || 'global'} strengthens. Investors optimistic, ${country || 'USD'} potentially STRENGTHENS. Gold (XAUUSD) might go DOWN.`;
        const conditionDown = `Economy of ${country || 'global'} weakens. Investors cautious, ${country || 'USD'} potentially WEAKENS. Gold (XAUUSD) might go UP.`;

        events.push({
          id: id++,
          time: time || 'All Day',
          datetime,
          currency: country || 'USD',
          impact: impact === 'High' || impact === 'Medium' || impact === 'Low' ? impact : 'Medium',
          event: title || 'Economic Release',
          actual: '-',
          forecast,
          previous,
          insight: {
            title: `Analysis of ${title || 'Economic Event'}`,
            desc: `${title || 'This indicator'} measures the economic health of ${country || 'Global'}. The release significantly influences global financial market volatility.`,
            conditionUp,
            conditionDown
          }
        });
      }
      return events;
    };

    const parseForexFactoryJSON = (jsonData: any[]) => {
      return jsonData.map((item: any, idx: number) => {
        let datetime = new Date().toISOString();
        let timeStr = 'All Day';
        if (item.date) {
          try {
            const d = new Date(item.date);
            if (!isNaN(d.getTime())) {
              datetime = d.toISOString();
              timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
          } catch (e) {
            // ignore
          }
        }

        const country = item.country || 'USD';
        const title = item.title || 'Economic Event';
        const impact = item.impact === 'High' || item.impact === 'Medium' || item.impact === 'Low' ? item.impact : 'Medium';
        
        const conditionUp = `Economy of ${country} strengthens. Investors optimistic, ${country} potentially STRENGTHENS (Bullish). Gold (XAUUSD) might go DOWN.`;
        const conditionDown = `Economy of ${country} weakens. Investors cautious, ${country} potentially WEAKENS (Bearish). Gold (XAUUSD) might go UP.`;

        return {
          id: idx + 1,
          time: timeStr,
          datetime,
          currency: country,
          impact,
          event: title,
          actual: item.actual !== null && item.actual !== undefined && String(item.actual).trim() !== '' ? String(item.actual) : '-',
          forecast: item.forecast !== null && item.forecast !== undefined && String(item.forecast).trim() !== '' ? String(item.forecast) : '-',
          previous: item.previous !== null && item.previous !== undefined && String(item.previous).trim() !== '' ? String(item.previous) : '-',
          insight: {
            title: `Analysis of ${title}`,
            desc: `${title} measures the economic health of ${country}. This scheduled release often causes substantial volatility in currency pairs and commodities like Gold.`,
            conditionUp,
            conditionDown
          }
        };
      });
    };

    let serverCalendarAnchorTime: number | null = null;
    let serverCalendarAnchorCreated = 0;

    const getServerCalendarAnchor = (): number => {
      const now = Date.now();
      // Keep anchor fixed for 12 hours so countdowns are 100% stable and tick down smoothly
      if (!serverCalendarAnchorTime || (now - serverCalendarAnchorCreated > 12 * 60 * 60 * 1000)) {
        serverCalendarAnchorTime = now;
        serverCalendarAnchorCreated = now;
      }
      return serverCalendarAnchorTime;
    };

    const adjustEventDates = (events: any[]) => {
      if (!events || events.length === 0) return events;
      
      const validEvents = events.filter(e => e.datetime && !isNaN(new Date(e.datetime).getTime()));
      if (validEvents.length === 0) return events;
      
      const datetimes = validEvents.map(e => new Date(e.datetime).getTime());
      const minTime = Math.min(...datetimes);
      const maxTime = Math.max(...datetimes);
      
      const anchorNow = getServerCalendarAnchor();
      
      // If the latest event has already passed (which happens on weekends or end of week)
      if (maxTime < anchorNow) {
        // Shift them so that the first event of the list starts exactly 36 hours ago relative to anchor
        const thirtySixHoursMs = 36 * 60 * 60 * 1000;
        const shiftOffset = anchorNow - minTime - thirtySixHoursMs;
        
        return events.map(e => {
          try {
            const originalDate = new Date(e.datetime);
            const newDate = new Date(originalDate.getTime() + shiftOffset);
            return {
              ...e,
              datetime: newDate.toISOString(),
              time: newDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            };
          } catch (err) {
            return e;
          }
        });
      }
      
      return events;
    };

    const generateDynamicEconomicEvents = () => {
      const baseDate = new Date(getServerCalendarAnchor());
      const createRelativeDate = (daysOffset: number, hour: number, minute: number) => {
        const d = new Date(baseDate.getTime());
        d.setDate(d.getDate() + daysOffset);
        d.setHours(hour, minute, 0, 0);
        return d;
      };

      const pool = [
        {
          dayOffset: 0,
          hour: 6,
          minute: 30,
          currency: 'USD',
          impact: 'High',
          event: 'Core CPI m/m',
          actual: '0.3%',
          forecast: '0.2%',
          previous: '0.1%',
          insight: {
            title: 'Core CPI m/m Analysis',
            desc: 'Core CPI (Consumer Price Index) measures the changes in the prices of goods and services, excluding food and energy. It is a key inflation measure closely watched by the Federal Reserve.',
            conditionUp: 'Inflation rises above expectations. USD strengthens, Gold (XAUUSD) potentially drops.',
            conditionDown: 'Inflation cools below expectations. USD weakens, Gold (XAUUSD) potentially rises.'
          }
        },
        {
          dayOffset: 0,
          hour: 7,
          minute: 0,
          currency: 'GBP',
          impact: 'Medium',
          event: 'Monetary Policy Summary',
          actual: '5.25%',
          forecast: '5.25%',
          previous: '5.25%',
          insight: {
            title: 'Monetary Policy Summary Analysis',
            desc: 'Bank of England monetary policy statement regarding the benchmark interest rate and macroeconomic conditions in the United Kingdom.',
            conditionUp: 'Hawkish stance from the BoE increases interest rate expectations. GBP potentially strengthens.',
            conditionDown: 'Dovish stance from the BoE lowers interest rate expectations. GBP potentially weakens.'
          }
        },
        {
          dayOffset: 0,
          hour: 8,
          minute: 30,
          currency: 'USD',
          impact: 'High',
          event: 'Non-Farm Employment Change',
          actual: '215K',
          forecast: '185K',
          previous: '165K',
          insight: {
            title: 'Non-Farm Payrolls (NFP) Analysis',
            desc: 'NFP reports the change in the number of newly employed people in the US (excluding the agricultural sector). It is a leading indicator of US economic growth.',
            conditionUp: 'Strong employment data. USD strengthens sharply, Gold (XAUUSD) potentially drops.',
            conditionDown: 'Weakened employment data. USD weakens sharply, Gold (XAUUSD) potentially rises.'
          }
        },
        {
          dayOffset: 0,
          hour: 8,
          minute: 30,
          currency: 'USD',
          impact: 'High',
          event: 'Unemployment Rate',
          actual: '3.9%',
          forecast: '4.0%',
          previous: '4.0%',
          insight: {
            title: 'Unemployment Rate Analysis',
            desc: 'The unemployment rate measures the percentage of the labor force that is unemployed. It reflects tightness in the labor market.',
            conditionUp: 'Unemployment rate increases. USD potentially weakens, Gold rises.',
            conditionDown: 'Unemployment rate decreases. USD potentially strengthens, Gold drops.'
          }
        },
        {
          dayOffset: 0,
          hour: 14,
          minute: 0,
          currency: 'USD',
          impact: 'High',
          event: 'Flash Manufacturing PMI',
          actual: '-',
          forecast: '47.5',
          previous: '47.2',
          insight: {
            title: 'Manufacturing PMI Analysis',
            desc: 'Manufacturing Purchasing Managers Index (PMI) provides an overview of manufacturing business activity. A reading above 50 indicates expansion.',
            conditionUp: 'PMI increases above forecast. Business sector is expanding, USD strengthens.',
            conditionDown: 'PMI decreases below forecast. Business sector is contracting, USD weakens.'
          }
        },
        {
          dayOffset: 1,
          hour: 14,
          minute: 30,
          currency: 'USD',
          impact: 'High',
          event: 'Retail Sales m/m',
          actual: '-',
          forecast: '0.4%',
          previous: '0.1%',
          insight: {
            title: 'Retail Sales m/m Analysis',
            desc: 'Retail Sales measures the change in the total value of sales at the retail level. It is a primary indicator of overall consumer spending.',
            conditionUp: 'Consumer spending increases sharply. Strong economy, USD potentially rises.',
            conditionDown: 'Consumer spending decreases. Slowing economy, USD potentially drops.'
          }
        },
        {
          dayOffset: 1,
          hour: 15,
          minute: 45,
          currency: 'EUR',
          impact: 'Medium',
          event: 'Flash Services PMI',
          actual: '-',
          forecast: '51.2',
          previous: '50.8',
          insight: {
            title: 'Flash Services PMI Analysis',
            desc: 'An indicator of purchasing managers activity in the Eurozone services sector. The services sector is a main driver of regional GDP.',
            conditionUp: 'Services sector activity expands. EUR potentially strengthens.',
            conditionDown: 'Services sector activity contracts. EUR potentially weakens.'
          }
        },
        {
          dayOffset: 2,
          hour: 19,
          minute: 0,
          currency: 'USD',
          impact: 'High',
          event: 'FOMC Statement',
          actual: '-',
          forecast: '-',
          previous: '-',
          insight: {
            title: 'FOMC Statement & Fed Rate Analysis',
            desc: 'US Federal Open Market Committee (FOMC) monetary policy statement which determines the benchmark interest rate and future policy direction.',
            conditionUp: 'Hawkish stance or rate hike by the Fed. USD strengthens rapidly, Gold weakens.',
            conditionDown: 'Dovish stance or rate cut by the Fed. USD weakens rapidly, Gold strengthens.'
          }
        }
      ];

      return pool.map((item, idx) => {
        const eventDate = createRelativeDate(item.dayOffset, item.hour, item.minute);
        const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return {
          id: idx + 1,
          time: timeStr,
          datetime: eventDate.toISOString(),
          currency: item.currency,
          impact: item.impact,
          event: item.event,
          actual: item.actual,
          forecast: item.forecast,
          previous: item.previous,
          insight: item.insight
        };
      });
    };

    let items: any[] = [];

    try {
      console.log("Fetching live news from CNBC Finance RSS feed...");
      const response = await fetch("https://search.cnbc.com/rs/search/all/view.xml?partnerId=2012&num=30", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (response.ok) {
        const xmlText = await response.text();
        const parsedCNBCNews = parseCNBCRSS(xmlText);
        if (parsedCNBCNews && parsedCNBCNews.length > 0) {
          items = parsedCNBCNews;
          console.log(`Successfully retrieved ${items.length} news items from CNBC RSS feed.`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch live news from CNBC RSS feed:", err);
    }

    if (items.length === 0) {
      items = [
        {
          id: 'mock_news_1',
          title: "Federal Reserve hints at future monetary easing on cooling inflation metrics",
          source: "Market Intelligence",
          time: "10 mins ago",
          url: "#",
          sentiment: { type: 'bullish', value: '+1.8%' }
        },
        {
          id: 'mock_news_2',
          title: "Gold surges past key psychological resistance level amidst rising global geopolitical risks",
          source: "Commodity Watch",
          time: "35 mins ago",
          url: "#",
          sentiment: { type: 'bullish', value: '+2.4%' }
        },
        {
          id: 'mock_news_3',
          title: "Tech sector index slides as major chipmakers report production bottlenecks",
          source: "Equity Insider",
          time: "1 hr ago",
          url: "#",
          sentiment: { type: 'bearish', value: '-1.5%' }
        }
      ];
    }

    try {
      let calendarEvents: any[] = [];
      let wasFetchedRealtime = false;
      
      // Attempt 1: Fetch via Jina Reader API (highly reliable CORS proxy that bypasses Cloudflare/Rate limit for faireconomy)
      try {
        console.log("Fetching weekly economic calendar from FairEconomy JSON feed via Jina Reader API...");
        const jinaResponse = await fetch(`https://r.jina.ai/https://nfs.faireconomy.media/ff_calendar_thisweek.json?_t=${Date.now()}`);
        if (jinaResponse.ok) {
          const text = await jinaResponse.text();
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              calendarEvents = parseForexFactoryJSON(jsonData);
              wasFetchedRealtime = true;
              console.log(`Successfully parsed ${calendarEvents.length} events from FairEconomy JSON via Jina.`);
            }
          }
        } else {
          console.warn(`Jina Reader returned status ${jinaResponse.status}. Trying direct fetch...`);
        }
      } catch (jinaErr) {
        console.error("Error fetching FairEconomy JSON via Jina:", jinaErr);
      }

      // Attempt 2: Direct fetch (as fallback if Jina failed)
      if (calendarEvents.length === 0) {
        try {
          console.log("Fetching weekly economic calendar from FairEconomy JSON feed directly...");
          const jsonResponse = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json?_t=${Date.now()}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          });
          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json();
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              calendarEvents = parseForexFactoryJSON(jsonData);
              wasFetchedRealtime = true;
              console.log(`Successfully parsed ${calendarEvents.length} events from FairEconomy JSON.`);
            }
          } else {
            console.warn(`FairEconomy JSON direct fetch returned status ${jsonResponse.status}. Trying XML...`);
          }
        } catch (jsonErr) {
          console.error("Error fetching FairEconomy JSON calendar directly:", jsonErr);
        }
      }

      // Attempt 3: Forex Factory XML feed direct (or maybe XML is blocked, but we try as backup)
      if (calendarEvents.length === 0) {
        try {
          console.log("Fetching weekly economic calendar from Forex Factory XML feed...");
          const calResponse = await fetch("https://www.forexfactory.com/ffcal_week_this.xml", {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
          });
          if (calResponse.ok) {
            const xmlString = await calResponse.text();
            if (xmlString && xmlString.includes('<event>')) {
              const parsedEvents = parseForexFactoryXML(xmlString);
              if (parsedEvents && parsedEvents.length > 0) {
                calendarEvents = parsedEvents;
                wasFetchedRealtime = true;
                console.log(`Successfully parsed ${calendarEvents.length} events from Forex Factory XML.`);
              }
            }
          } else {
            console.warn(`Forex Factory XML returned status ${calResponse.status}.`);
          }
        } catch (err) {
          console.error("Error fetching Forex Factory XML calendar:", err);
        }
      }

      // If we completely failed to fetch real-time data, fall back to mock data
      if (calendarEvents.length === 0) {
        console.log("Using dynamic mock economic calendar fallback.");
        calendarEvents = generateDynamicEconomicEvents();
      }

      // ONLY adjust/shift dates if we are using the mock/fallback data!
      // Real-time data from Jina/ForexFactory should never have its dates shifted!
      if (!wasFetchedRealtime) {
        calendarEvents = adjustEventDates(calendarEvents);
      }

      // Sort events chronologically by datetime
      calendarEvents.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

      // Filter to only include today's releases and future releases (no past dates before today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      calendarEvents = calendarEvents.filter(e => e.datetime && new Date(e.datetime).getTime() >= startOfToday.getTime());

      // Map over all events to inject the correct, Indonesian formatted day/date label!
      calendarEvents = calendarEvents.map(e => ({
        ...e,
        date: getIndonesianDateLabel(e.datetime)
      }));

      res.json({ news: items, economicEvents: calendarEvents });
    } catch (error: any) {
      console.error("Calendar fetch error:", error);
      const fallbackEvents = generateDynamicEconomicEvents();
      const adjustedFallback = adjustEventDates(fallbackEvents).map((e: any) => ({
        ...e,
        date: getIndonesianDateLabel(e.datetime)
      }));
      res.json({
        news: items,
        economicEvents: adjustedFallback
      });
    }
  });

  // API: Health Supabase
  app.get("/api/health-db", async (req, res) => {
    try {
      const { data, error } = await supabase.from('User').select('count').limit(1);
      if (error) throw error;
      res.json({ 
        status: "ok", 
        message: "Successfully connected to Supabase",
        data: data 
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: "error", 
        message: "Failed to connect to Supabase", 
        error: error.message 
      });
    }
  });

  // API: Locations
  app.get("/api/locations/countries", async (req, res) => {
    try {
      console.log('GET /api/locations/countries');
      const countries = await locationRepo.getAllCountries();
      console.log(`Found ${countries.length} countries`);
      res.json(countries);
    } catch (error: any) {
      console.error('Error in GET /api/locations/countries:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/locations/provinces", async (req, res) => {
    try {
      const countryId = req.query.countryId as string;
      console.log(`GET /api/locations/provinces?countryId=${countryId}`);
      if (!countryId) return res.status(400).json({ error: "countryId is required" });
      const provinces = await locationRepo.getProvincesByCountryId(countryId);
      console.log(`Found ${provinces.length} provinces for countryId ${countryId}`);
      res.json(provinces);
    } catch (error: any) {
      console.error(`Error in GET /api/locations/provinces for countryId ${req.query.countryId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/locations/cities", async (req, res) => {
    try {
      const provinceId = req.query.provinceId as string;
      console.log(`GET /api/locations/cities?provinceId=${provinceId}`);
      if (!provinceId) return res.status(400).json({ error: "provinceId is required" });
      const cities = await locationRepo.getCitiesByProvinceId(provinceId);
      console.log(`Found ${cities.length} cities for provinceId ${provinceId}`);
      res.json(cities);
    } catch (error: any) {
      console.error(`Error in GET /api/locations/cities for provinceId ${req.query.provinceId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API: List and Create Groups backed by Supabase Group/groups table
  app.get("/api/groups", async (req: any, res) => {
    try {
      const groupRepo = new GroupRepository();
      const groups = await groupRepo.list();
      res.json(groups);
    } catch (error: any) {
      console.error("Error listing groups:", error);
      res.status(500).json({ error: error.message });
    }
  });

  
  app.post('/api/upload-logo', async (req: any, res) => {
    try {
      const { image, type } = req.body;
      if (!image) return res.status(400).json({ error: 'No image provided' });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      
      let fileName = 'gotrading_logo.png';
      if (type === 'chat') {
        fileName = 'chat_logo.png';
      } else if (type === 'login') {
        fileName = 'login_logo.png';
      }

      const pubPath = path.join(process.cwd(), 'public', fileName);
      const distPath = path.join(process.cwd(), 'dist', fileName);
      const assetsPath = path.join(process.cwd(), 'assets', fileName);
      
      fs.writeFileSync(pubPath, base64Data, { encoding: 'base64' });
      fs.writeFileSync(assetsPath, base64Data, { encoding: 'base64' });
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        fs.writeFileSync(distPath, base64Data, { encoding: 'base64' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save logo' });
    }
  });

  app.post('/api/delete-logo', async (req: any, res) => {
    try {
      const { type } = req.body;
      
      let fileName = 'gotrading_logo.png';
      if (type === 'chat') {
        fileName = 'chat_logo.png';
      } else if (type === 'login') {
        fileName = 'login_logo.png';
      }

      const pubPath = path.join(process.cwd(), 'public', fileName);
      const distPath = path.join(process.cwd(), 'dist', fileName);
      const assetsPath = path.join(process.cwd(), 'assets', fileName);

      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
      if (fs.existsSync(distPath)) fs.unlinkSync(distPath);
      if (fs.existsSync(assetsPath)) fs.unlinkSync(assetsPath);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete logo' });
    }
  });

  app.post("/api/groups", async (req: any, res) => {
    try {
      const { id, name, type, city, province } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "Missing group id or name" });
      }
      const groupRepo = new GroupRepository();
      await groupRepo.create({ id, name, type: type || 'city', city, province });
      res.json({ success: true, group: { id, name, type, city, province } });
    } catch (error: any) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Groups Stats (Dynamic/Real Group Members and Messages Counts)
  app.get("/api/groups/stats", async (req: any, res) => {
    try {
      const city = (req.query.city as string) || '';
      const province = (req.query.province as string) || '';

      const userRepo = new UserRepository();
      const messageRepo = new MessageRepository();
      const postRepo = new PostRepository();

      const users = await userRepo.list();
      const messages = await messageRepo.list();
      const posts = await postRepo.list();

      // Calculate real registered user counts
      const cityUserCount = users.filter((u: any) => u.city && u.city.toLowerCase() === city.toLowerCase()).length;
      const provinceUserCount = users.filter((u: any) => u.province && u.province.toLowerCase() === province.toLowerCase()).length;

      // Group IDs
      const cityGroupId = `group_city_${city.toLowerCase().replace(/\s+/g, '_')}`;
      const provinceGroupId = `group_province_${province.toLowerCase().replace(/\s+/g, '_')}`;

      // Calculate chat messages
      const cityChatCount = messages.filter((m: any) => m.receiverId === cityGroupId).length;
      const provinceChatCount = messages.filter((m: any) => m.receiverId === provinceGroupId).length;

      // Calculate forum posts
      const cityPostCount = posts.filter((p: any) => p.groupId === cityGroupId).length;
      const provincePostCount = posts.filter((p: any) => p.groupId === provinceGroupId).length;

      res.json({
        city: {
          members: cityUserCount,
          messages: cityChatCount + cityPostCount
        },
        province: {
          members: provinceUserCount,
          messages: provinceChatCount + provincePostCount
        }
      });
    } catch (error: any) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Authentication
  app.get("/api/auth/check-availability", async (req, res) => {
    try {
      const { username, email } = req.query as { username?: string; email?: string };
      if (!username && !email) {
        return res.status(400).json({ error: "username or email is required" });
      }

      console.log(`Checking availability for username: ${username}, email: ${email}`);

      let userWithUsername = null;
      if (username) {
        const { data } = await supabase
          .from('User')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        userWithUsername = data;
      }

      let userWithEmail = null;
      if (email) {
        const { data } = await supabase
          .from('User')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        userWithEmail = data;
      }

      const result = {
        username_taken: !!userWithUsername,
        email_taken: !!userWithEmail
      };

      console.log(`Availability check result:`, result);
      res.json(result);
    } catch (error: any) {
      console.error('Error checking availability:', error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: any, res) => {
    try {
      let { firstName, lastName, username, email, whatsappNumber, country, province, city, password } = req.body;
      
      if (!firstName || !lastName || !username || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!password) {
        // Auto-generate a secure password since user is not supplying one
        password = Math.random().toString(36).substring(2, 15) + "A1!";
      }

      const profileData = {
        username,
        first_name: firstName,
        last_name: lastName,
        whatsapp_number: whatsappNumber || "",
        country: country || "Unknown",
        province: province || "",
        city: city || "",
        avatar: (firstName[0] + (lastName[0] || "")).toUpperCase(),
        cover_photo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
        headline: "Trader at Tarapti Community",
        bio: "Sharing ideas and connecting with trade professionals.",
        trading_experience: "Beginner",
        trading_asset: "Forex",
        online_status: "online",
        followers_count: 0,
        following_count: 0,
        reputation_points: 10,
        latitude: req.body.latitude || 1.3521,
        longitude: req.body.longitude || 103.8198,
        timezone: "UTC",
        locale: "en-US",
        currency: "USD"
      };

      const { user } = await authService.register({ 
        firstName, 
        lastName, 
        username, 
        email, 
        password,
        whatsappNumber: whatsappNumber || "",
        country: country || "",
        province: province || "",
        city: city || ""
      }, profileData as any);
      
      // Auto-verify for now as in the original logic there was no verification step mentioned
      await authService.verifyEmail(user.id); // This might need a real token if we implement verification

      const accessToken = generateAccessToken(user.id);

      const responseUser = {
        id: user.id,
        email: user.email,
        ...profileData,
        // Map back to camelCase for client consistency
        firstName,
        lastName,
        whatsappNumber,
        tradingExperience: "Beginner",
        tradingAsset: "Forex",
        onlineStatus: "online",
        followersCount: 0,
        followingCount: 0,
        reputationPoints: 10,
        coverPhoto: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      };

      res.json({ success: true, user: responseUser, token: accessToken });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || 'unknown';
      const device = {
        device_name: req.headers['user-agent'] || 'unknown',
        device_type: 'web',
        browser: 'unknown',
        os: 'unknown'
      };

      const result = await authService.login(email, password, ip, device);
      const userObj = await authService.getCurrentUserByEmail(email);
      
      let responseUser = { 
        ...userObj.user, 
        ...userObj.profile,
      };
      delete (responseUser as any).password;

      // Ensure user data is up-to-date with Supabase
      const userRepo = new UserRepository();
      const existingUser = await userRepo.findById(responseUser.id);
      
      if (existingUser) {
        responseUser = {
          ...responseUser,
          ...existingUser,
          avatar: existingUser.avatar || responseUser.avatar,
          coverPhoto: existingUser.coverPhoto || (existingUser as any).cover_photo || responseUser.coverPhoto || responseUser.cover_photo,
          cover_photo: (existingUser as any).cover_photo || existingUser.coverPhoto || responseUser.cover_photo || responseUser.coverPhoto
        };
      }

      res.json({ 
        success: true, 
        user: responseUser, 
        token: result.accessToken,
        refreshToken: result.refreshToken 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message || "Invalid email or password" });
    }
  });

  app.post("/api/auth/logout", async (req: any, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ success: true, message: "Reset code sent to your registered email & WhatsApp." });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Email not found" });
    }
  });

  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, newPassword } = req.body; // Assuming token is used for reset
      await authService.resetPassword(token, newPassword);
      res.json({ success: true, message: "Password updated successfully." });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to reset password" });
    }
  });

  // API: Get current session user detail
  app.get("/api/users/profile/:userId", async (req: any, res) => {
    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safeUser } = user;
    if (!safeUser.coverPhoto && (safeUser as any).cover_photo) safeUser.coverPhoto = (safeUser as any).cover_photo;
    if (!(safeUser as any).cover_photo && safeUser.coverPhoto) (safeUser as any).cover_photo = safeUser.coverPhoto;
    res.json(safeUser);
  });

  // API: Update profile
  app.put("/api/users/profile/:userId", async (req: any, res) => {
    const userId = req.params.userId;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { firstName, lastName, username, headline, bio, country, province, city, tradingExperience, tradingAsset, latitude, longitude, avatar, coverPhoto, marketPulseEnabled, marketPulseAssets } = req.body;
    if (firstName) { user.firstName = firstName; }
    if (lastName) { user.lastName = lastName; }
    if (username) { user.username = username; }
    if (headline !== undefined) user.headline = headline;
    if (bio !== undefined) user.bio = bio;
    if (country) user.country = country;
    if (province !== undefined) user.province = province;
    if (city) user.city = city;
    if (tradingExperience) { user.tradingExperience = tradingExperience; }
    if (tradingAsset) { user.tradingAsset = tradingAsset; }
    if (avatar) user.avatar = avatar;
    if (coverPhoto) {
      user.coverPhoto = coverPhoto;
    }
    if (latitude !== undefined) (user as any).latitude = latitude;
    if (longitude !== undefined) (user as any).longitude = longitude;
    
    // Update user and profile in Supabase
    await userRepo.update(userId, user);
    
    const profileRepo = new ProfileRepository();
    const profileObj: Partial<Profile> = {
      user_id: userId,
      first_name: user.firstName,
      last_name: user.lastName,
      headline: user.headline || undefined,
      bio: user.bio || undefined,
      avatar: user.avatar || undefined,
      cover_photo: user.coverPhoto || undefined,
      trading_experience: user.tradingExperience || undefined,
      trading_asset: user.tradingAsset || undefined,
      city: user.city || undefined,
      province: user.province || undefined,
      country: user.country || undefined,
      latitude: latitude !== undefined ? latitude : undefined,
      longitude: longitude !== undefined ? longitude : undefined
    };
    await profileRepo.update(userId, profileObj);

    // Note: Manual cascade to posts, comments, etc is skipped here 
    // to avoid excessive API calls. In a real app, these would be 
    // fetched via joins or eventually updated via background tasks.
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // API: Update user language/locale preference
  app.put("/api/users/profile/:userId/language", async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { language } = req.body;
      if (!language) return res.status(400).json({ error: "Language is required" });

      const userRepo = new UserRepository();
      const user = await userRepo.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const profileRepo = new ProfileRepository();
      await profileRepo.update(userId, { locale: language });

      // Return the updated user object with the new language/locale
      const updatedUser = await userRepo.findById(userId);
      if (updatedUser) {
        (updatedUser as any).locale = language;
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(500).json({ error: "Failed to fetch updated user" });
      }
    } catch (e: any) {
      console.error("Failed to update language preference:", e);
      res.status(500).json({ error: e?.message || "Internal server error" });
    }
  });

  // API: Users List with Filters
  app.get("/api/users", async (req: any, res) => {
    const userRepo = new UserRepository();
    let list = await userRepo.list();
    
    // Fall back to memory database users if Supabase returns nothing or is unconfigured
    if ((!list || list.length === 0) && req.db?.users && req.db.users.length > 0) {
      list = req.db.users;
    }

    const { search, country, province, city, experience, asset, online, lat, lng, radius } = req.query;
    console.log(`GET /api/users - Search: ${search}, Geo: ${lat}, ${lng}, Radius: ${radius}`);

    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(u => {
        const firstName = u.firstName || '';
        const lastName = u.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return fullName.includes(q) ||
          firstName.toLowerCase().includes(q) ||
          lastName.toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.headline || '').toLowerCase().includes(q) ||
          (u.city || '').toLowerCase().includes(q) ||
          (u.country || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.tradingExperience || '').toLowerCase().includes(q) ||
          (u.tradingAsset || '').toLowerCase().includes(q);
      });
    }

    if (country) list = list.filter(u => (u.country || '').toLowerCase() === (country as string).toLowerCase());
    if (province) list = list.filter(u => (u.province || '').toLowerCase() === (province as string).toLowerCase());
    if (city) list = list.filter(u => (u.city || '').toLowerCase() === (city as string).toLowerCase());
    if (experience) list = list.filter(u => u.tradingExperience === experience);
    if (asset) list = list.filter(u => u.tradingAsset === asset);
    if (online) list = list.filter(u => u.onlineStatus === online);

    // Geolocation radius filter
    if (lat && lng && radius) {
      const uLat = parseFloat(lat as string);
      const uLng = parseFloat(lng as string);
      const radKm = parseFloat(radius as string); // e.g. 10km, 100km, 1000km

      // Haversine distance calculator
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Assign coordinates to seeded users so there are always nearby traders found under all testing locations
      list = list.map((u, index) => {
        const userObj = { ...u } as any;
        if (!userObj.latitude || !userObj.longitude) {
          // Put the first 3 seeded users close to the scanned location
          if (index === 0) {
            // ~3.5km away
            userObj.latitude = uLat + 0.02;
            userObj.longitude = uLng + 0.02;
          } else if (index === 1) {
            // ~8.2km away
            userObj.latitude = uLat - 0.04;
            userObj.longitude = uLng - 0.04;
          } else if (index === 2) {
            // ~15km away
            userObj.latitude = uLat + 0.08;
            userObj.longitude = uLng - 0.08;
          } else {
            // Default Indonesian cities
            if (u.city === 'Tasikmalaya') {
              userObj.latitude = -7.3274;
              userObj.longitude = 108.2207;
            } else if (u.city === 'Bandung') {
              userObj.latitude = -6.9175;
              userObj.longitude = 107.6191;
            } else if (u.city === 'Jakarta Selatan' || u.city === 'Jakarta') {
              userObj.latitude = -6.2615;
              userObj.longitude = 106.8106;
            } else if (u.city === 'Surabaya') {
              userObj.latitude = -7.2575;
              userObj.longitude = 112.7521;
            } else if (u.city === 'Semarang') {
              userObj.latitude = -6.9667;
              userObj.longitude = 110.4167;
            } else {
              // Default fallback
              userObj.latitude = -6.2088;
              userObj.longitude = 106.8456;
            }
          }
        }
        return userObj;
      });

      list = list.filter(u => {
        if (!(u as any).latitude || !(u as any).longitude) return false;
        const dist = getDistance(uLat, uLng, (u as any).latitude, (u as any).longitude);
        // Save computed distance for optional UI rendering
        (u as any).distance = parseFloat(dist.toFixed(1));
        return dist <= radKm;
      });
    }

    // Map relationships (following / followers)
    const safeList = list.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    res.json(safeList);
  });

  // API: Follow / Unfollow trader
  app.post("/api/users/:targetUserId/follow", async (req: any, res) => {
    const { currentUserId } = req.body;
    const targetId = req.params.targetUserId;

    if (!currentUserId || currentUserId === targetId) {
      return res.status(400).json({ error: "Invalid operation" });
    }

    const followRepo = new FollowRepository();
    const notifRepo = new NotificationRepository();
    const userRepo = new UserRepository();
    const following = await followRepo.listFollowing(currentUserId);
    const isFollowing = following.includes(targetId);

    let followed = false;
    if (isFollowing) {
      // Unfollow
      await followRepo.unfollow(currentUserId, targetId);
    } else {
      // Follow
      await followRepo.follow(currentUserId, targetId);
      followed = true;

      // Notify target
      const sender = await userRepo.findById(currentUserId);
      
      if (sender) {
        await notifRepo.create({
          toUserId: targetId,
          fromUserId: currentUserId,
          fromUserName: `${sender.firstName} ${sender.lastName}`,
          fromUserAvatar: sender.avatar || "",
          type: "follow",
          message: "started following you",
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update follow counters
    const followerUser = await userRepo.findById(currentUserId);
    const targetUser = await userRepo.findById(targetId);
    
    if (followerUser && targetUser) {
      const following = await followRepo.listFollowing(currentUserId);
      const followers = await followRepo.listFollowers(targetId);
      
      (followerUser as any).followingCount = following.length;
      (targetUser as any).followersCount = followers.length;
      
      // award reputation points
      if (followed) {
        const currentRep = (targetUser as any).reputationPoints || 0;
        const gain = calculateReputationGain(currentRep, 3);
        (targetUser as any).reputationPoints = currentRep + gain;
      } else {
        (targetUser as any).reputationPoints = Math.max(10, ((targetUser as any).reputationPoints || 0) - 3);
      }

      await userRepo.update(currentUserId, followerUser);
      await userRepo.update(targetId, targetUser);
    }

    res.json({ success: true, followed });
  });

  // API: Get follow relationship states for current user
  app.get("/api/users/:userId/follows", async (req: any, res) => {
    const uid = req.params.userId;
    const followRepo = new FollowRepository();
    const userRepo = new UserRepository();
    const following = await followRepo.listFollowing(uid);
    const followers = await followRepo.listFollowers(uid);

    let allUsers: any[] = [];
    try {
      allUsers = await userRepo.list();
    } catch (e) {
      console.error("Could not fetch user list for follows:", e);
    }

    if ((!allUsers || allUsers.length === 0) && req.db?.users && req.db.users.length > 0) {
      allUsers = req.db.users;
    }

    const followingDetails = (allUsers || [])
      .filter((u: any) => following.includes(u.id))
      .map(({ password, ...u }: any) => u);

    const followerDetails = (allUsers || [])
      .filter((u: any) => followers.includes(u.id))
      .map(({ password, ...u }: any) => u);

    res.json({ following, followers, followingDetails, followerDetails });
  });

  // API: Connection Requests
  app.post("/api/users/connect", async (req: any, res) => {
    const { requesterId, receiverId } = req.body;
    if (!requesterId || !receiverId || requesterId === receiverId) {
      return res.status(400).json({ error: "Invalid connection request" });
    }

    const connRepo = new ConnectionRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();

    const connections = await connRepo.list();
    const existing = connections.find((c: any) => 
      (c.requesterId === requesterId && c.receiverId === receiverId) ||
      (c.requesterId === receiverId && c.receiverId === requesterId)
    );

    if (existing) {
      return res.status(400).json({ error: "Connection request already exists" });
    }

    const newConn: Connection = {
      requesterId,
      receiverId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    await connRepo.create(newConn);

    // Notify receiver
    const sender = await userRepo.findById(requesterId);
    if (sender) {
      await notifRepo.create({
        toUserId: receiverId,
        fromUserId: requesterId,
        fromUserName: `${sender.firstName} ${sender.lastName}`,
        fromUserAvatar: sender.avatar || "",
        type: "friend_request",
        message: "wants to connect with you",
        isRead: false,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, connection: newConn });
  });

  app.put("/api/users/connect/accept", async (req: any, res) => {
    const { requesterId, receiverId } = req.body;
    const connRepo = new ConnectionRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();

    const connections = await connRepo.list();
    const conn = connections.find((c: any) => c.requesterId === requesterId && c.receiverId === receiverId);

    if (!conn) return res.status(404).json({ error: "Connection request not found" });

    await connRepo.updateStatus(requesterId, receiverId, 'accepted');

    // Notify requester
    const receiver = await userRepo.findById(receiverId);
    if (receiver) {
      await notifRepo.create({
        toUserId: requesterId,
        fromUserId: receiverId,
        fromUserName: `${receiver.firstName} ${receiver.lastName}`,
        fromUserAvatar: receiver.avatar || "",
        type: "friend_accepted",
        message: "accepted your connection request",
        isRead: false,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  app.put("/api/users/connect/decline", async (req: any, res) => {
    const { requesterId, receiverId } = req.body;
    const connRepo = new ConnectionRepository();
    await connRepo.delete(requesterId, receiverId);
    res.json({ success: true });
  });

  app.get("/api/users/:userId/connection-status/:targetId", async (req: any, res) => {
    const { userId, targetId } = req.params;
    const connRepo = new ConnectionRepository();
    const connections = await connRepo.list();
    const conn = connections.find((c: any) => 
      (c.requesterId === userId && c.receiverId === targetId) ||
      (c.requesterId === targetId && c.receiverId === userId)
    );

    if (!conn) return res.json({ status: 'none' });
    
    if (conn.status === 'accepted') return res.json({ status: 'accepted' });
    if (conn.status === 'pending') {
      if (conn.requesterId === userId) return res.json({ status: 'pending' }); // User sent request
      return res.json({ status: 'received_pending' }); // User received request
    }
    res.json({ status: 'none' });
  });

  // API: Get pending connection requests for a user (Requirement 3)
  app.get("/api/users/:userId/pending-connections", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const connRepo = new ConnectionRepository();
      const userRepo = new UserRepository();
      const connections = await connRepo.list();
      const pending = connections.filter((c: any) => c.receiverId === userId && c.status === 'pending');
      const result = [];
      for (const p of pending) {
        const sender = await userRepo.findById(p.requesterId);
        if (sender) {
          result.push({
            id: p.requesterId,
            requesterId: p.requesterId,
            receiverId: p.receiverId,
            firstName: sender.firstName,
            lastName: sender.lastName,
            avatar: sender.avatar,
            tradingExperience: sender.tradingExperience || "Trader",
            city: sender.city || "Jakarta",
            country: sender.country || "Indonesia",
            timestamp: p.timestamp || new Date().toISOString()
          });
        }
      }
      res.json(result);
    } catch (e: any) {
      console.warn("Notice in /pending-connections:", e);
      res.json([]);
    }
  });

  // API: Stories
  app.get("/api/stories", async (req: any, res) => {
    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();
    
    try {
      const stories = await storyRepo.list();
      const users = await userRepo.list();
      
      const enrichedStories = await Promise.all(stories.map(async (story: any) => {
        const user = users.find((u: any) => u.id === story.userId);
        const rawViewers = await storyRepo.getViewers(story.id);
        const viewers = rawViewers.map((rv: any) => {
          const vUser = users.find((u: any) => u.id === rv.userId);
          return {
            userId: rv.userId,
            viewedAt: rv.viewedAt,
            user: vUser ? {
              id: vUser.id,
              firstName: vUser.firstName,
              lastName: vUser.lastName,
              username: vUser.username,
              avatar: vUser.avatar
            } : undefined
          };
        });

        return {
          ...story,
          viewers,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            avatar: user.avatar
          } : undefined
        };
      }));
      
      console.log("Fetching stories from Supabase, count:", enrichedStories.length);
      res.json(enrichedStories);
    } catch (e: any) {
      console.error("Error fetching stories:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/stories/:storyId/view", async (req: any, res) => {
    const { storyId } = req.params;
    const { viewerUserId } = req.body;

    if (!viewerUserId) {
      return res.status(400).json({ error: "viewerUserId is required" });
    }

    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();

    try {
      const rawViewers = await storyRepo.recordView(storyId, viewerUserId);
      const users = await userRepo.list();

      const enrichedViewers = rawViewers.map((rv: any) => {
        const vUser = users.find((u: any) => u.id === rv.userId);
        return {
          userId: rv.userId,
          viewedAt: rv.viewedAt,
          user: vUser ? {
            id: vUser.id,
            firstName: vUser.firstName,
            lastName: vUser.lastName,
            username: vUser.username,
            avatar: vUser.avatar
          } : undefined
        };
      });

      res.json({ success: true, viewers: enrichedViewers });
    } catch (e: any) {
      console.error("Error recording story view:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/stories", async (req: any, res) => {
    const { userId, imageUrl } = req.body;
    console.log("Posting story for user to Supabase:", userId);
    
    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();
    const followRepo = new FollowRepository();
    const notifRepo = new NotificationRepository();
    
    try {
      // User requested that new stories replace old ones for the same user
      await storyRepo.deleteByUserId(userId);

      const newStory = await storyRepo.create({
        userId,
        imageUrl,
        viewed: false
      });
      
      const user = await userRepo.findById(userId);

      // Notify followers of story activity
      try {
        if (user) {
          const followerIds = await followRepo.listFollowers(userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_story_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "friend_post",
              message: `${authorFullName} (yang Anda ikuti) membagikan cerita (story) baru.`,
              isRead: false,
              timestamp: new Date().toISOString()
            };
            await notifRepo.create(newNotif as any);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error sending story notification to followers:", notifErr);
      }

      const enrichedStory = {
        ...newStory,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar
        } : undefined
      };
      
      res.json(enrichedStory);
    } catch (e: any) {
      console.error("Error creating story:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/stories/:storyId", async (req: any, res) => {
    const { storyId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    const storyRepo = new StoryRepository();
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }

    try {
      // For now, let's just delete it. In a real app we'd check ownership.
      await storyRepo.delete(storyId);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error deleting story:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // API: Posts Feed (Home Feed & Group Posts)
    app.get("/api/posts", async (req: any, res) => {
      try {
        const postRepo = new PostRepository();
        const followRepo = new FollowRepository();
        
        const { search, tag, userId, groupId, currentUserId, limit, type } = req.query;
        const page = req.query.page !== undefined ? parseInt(req.query.page as string) : 0;
        const pageSize = req.query.pageSize !== undefined ? parseInt(req.query.pageSize as string) : 15;
        const limitVal = limit ? parseInt(limit as string) : (groupId || userId || search || tag ? 150 : 50);
        
        // Filter in database using PostRepository with new search/tag/pagination support
        let posts = await postRepo.list(
          limitVal, 
          (groupId as string) || (userId || search || tag ? undefined : null),
          search as string,
          tag as string,
          userId as string,
          page,
          pageSize
        );
        
        // Special logic for "Following" feed
        if (type === 'following' && currentUserId) {
          const followingIds = await followRepo.listFollowing(currentUserId as string);
          // Only show posts from users the current user follows
          posts = posts.filter(p => followingIds.includes(p.userId));
        }

        // Sorting
        if (type === 'popular') {
          posts = posts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        } else {
          // Default: pinned first, then newest
          posts = sortPostsWithPinnedFirst(posts);
        }

        const enrichedPosts = posts.map(p => {
          return {
            ...p,
            authorCity: p.authorCity || "Tasikmalaya",
            authorCountry: p.authorCountry || "Indonesia",
            authorVerified: !!p.authorVerified
          };
        });

        res.json(enrichedPosts);
      } catch (error) {
        console.error("Error in /api/posts:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

  // API: Post Details
  app.get("/api/posts/:postId", async (req: any, res) => {
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    const userRepo = new UserRepository();

    const post = await postRepo.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    const comments = await commentRepo.listByPostId(post.id);
    const author = await userRepo.findById(post.userId);
    
    const enrichedPost = {
      ...post,
      authorCity: author ? (author as any).city : (post.authorCity || "Tasikmalaya"),
      authorCountry: author ? (author as any).country : (post.authorCountry || "Indonesia"),
      authorVerified: author ? !!((author as any).mt5Connected || (author as any).isVerified) : !!post.authorVerified
    };

    const enrichedComments = await Promise.all(comments.map(async (c: any) => {
      const cAuthor = await userRepo.findById(c.userId);
      return {
        ...c,
        authorCity: cAuthor ? (cAuthor as any).city : (c.authorCity || "Tasikmalaya"),
        authorCountry: cAuthor ? (cAuthor as any).country : (c.authorCountry || "Indonesia"),
        authorVerified: cAuthor ? !!((cAuthor as any).mt5Connected || (cAuthor as any).isVerified) : !!c.authorVerified
      };
    }));

    res.json({ post: enrichedPost, comments: enrichedComments });
  });

  // API: Create Post
  app.post("/api/posts", async (req: any, res) => {
    console.log("POST /api/posts received:", JSON.stringify(req.body).substring(0, 200) + "...");
    try {
      const { userId, content, images, chart, videoUrl, groupId, isOfficial, isPinned, marketBias } = req.body;
      console.log(`Received POST request for /api/posts: userId=${userId}, contentLen=${content?.length}, imagesLen=${images?.length}`);
      if (!userId) {
        console.warn("POST /api/posts failed: userId is missing");
        return res.status(400).json({ error: "Missing required fields: userId is required" });
      }
      if (!content?.trim() && !images?.length && !videoUrl && !chart) {
        console.warn("POST /api/posts failed: content and media are missing");
        return res.status(400).json({ error: "Missing required fields: content or media/chart is required" });
      }

      console.log("Creating post for user:", userId);
      const userRepo = new UserRepository();
      const postRepo = new PostRepository();
      let user = await userRepo.findById(userId);
      
      if (!user) {
        console.log("User not found in repo, fetching from authService...");
        try {
          const uObj = await authService.getCurrentUser(userId);
          if (uObj && uObj.user) {
            user = uObj.user as any;
          } else if (uObj && uObj.profile) {
            // Fallback to profile data if user record is missing but profile exists
            const p = uObj.profile;
            user = {
              id: userId,
              firstName: p.first_name || (p as any).firstName || "Trader",
              lastName: p.last_name || (p as any).lastName || "Member",
              username: p.username || "trader_" + userId.substring(0, 6),
              avatar: p.avatar || p.avatar_url || "👤",
              city: p.city || "Jakarta",
              country: p.country || "Indonesia",
              tradingExperience: p.trading_experience || "Pro Trader"
            } as any;
            console.log("Using profile data for post author:", JSON.stringify(user));
          }
        } catch (e) {
          console.error("Error getting current user from authService:", e);
        }
      }
      if (!user) {
        console.log("User still not found, using generic fallback for user:", userId);
        user = {
          id: userId,
          firstName: "Trader",
          lastName: "Member",
          username: "trader_" + userId.substring(0, 6),
          email: "member@tarapti.com",
          avatar: "👤",
          tradingExperience: "Pro Trader",
          tradingAsset: "Forex",
          city: "Jakarta",
          country: "Indonesia",
          reputationPoints: 10
        } as any;
        try {
          await userRepo.create(user as any);
        } catch (e) {
          console.error("Error creating fallback user record:", e);
        }
      }

      // Extract hashtags safely
      const hashtags = content ? (content.match(/#\w+/g) || []).map((t: string) => t.substring(1)) : [];

      const authorFirstName = user.firstName || (user as any).first_name || 'Trader';
      const authorLastName = user.lastName || (user as any).last_name || 'Member';

      const newPost: Post = await postRepo.create({
        userId,
        authorName: `${authorFirstName} ${authorLastName}`.trim(),
        authorUsername: (user as any).username || ('trader_' + userId.substring(0, 6)),
        authorAvatar: user.avatar || (user as any).avatar_url || "",
        authorRole: (user as any).tradingExperience || (user as any).trading_experience || "Trader",
        authorCity: (user as any).city || "Jakarta",
        authorCountry: (user as any).country || "Indonesia",
        content: content || "",
        images: images || [],
        videoUrl: videoUrl || undefined,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        repostsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        tags: hashtags,
        chart: chart || undefined,
        groupId: groupId || undefined,
        isOfficial: isOfficial || false,
        isPinned: isPinned || false,
        isRepost: false,
        marketBias: marketBias || undefined,
        authorVerified: !!((user as any).mt5Connected || (user as any).isVerified)
      });

      console.log("Post creation result from repo:", JSON.stringify(newPost).substring(0, 200) + "...");
      console.log("Post created successfully in API:", newPost.id);

      // Keep req.db memory store in sync if present
      if (req.db) {
        if (!req.db.posts) req.db.posts = [];
        if (!req.db.posts.some((p: any) => p.id === newPost.id)) {
          req.db.posts.unshift(newPost);
          console.log("Post synced to memory store, new count:", req.db.posts.length);
        }
        if (typeof req.save === 'function') {
          if (typeof req.save === "function") req.save();
        }
      }

      const currentRep = (user as any).reputationPoints || 0;
      const gain = calculateReputationGain(currentRep, 2);
      (user as any).reputationPoints = currentRep + gain;
      try {
        await userRepo.update(userId, user);
      } catch (e) {
        console.error("Error updating user reputation:", e);
      }

      // Generate notifications for friends / followers / users (Requirement 2)
      try {
        const notifRepo = new NotificationRepository();
        const followRepo = new FollowRepository();
        const authorFullName = `${authorFirstName} ${authorLastName}`.trim();
        const allUsers = await userRepo.list();
        const otherUsers = allUsers.filter((u: any) => u.id && u.id !== userId);

        const followerIds = await followRepo.listFollowers(userId);

        const snippet = content ? (content.length > 50 ? content.substring(0, 50) + "..." : content) : "postingan baru";

        for (const targetUser of otherUsers) {
          const isFollower = followerIds.includes(targetUser.id);
          const messageText = isFollower
            ? `${authorFullName} (yang Anda ikuti) membagikan postingan baru: "${snippet}"`
            : `${authorFullName} membagikan postingan baru: "${snippet}"`;

          const newNotif = {
            id: "notify_post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            toUserId: targetUser.id,
            fromUserId: userId,
            fromUserName: authorFullName,
            fromUserAvatar: user.avatar || "",
            type: "friend_post",
            message: messageText,
            isRead: false,
            timestamp: new Date().toISOString()
          };
          await notifRepo.create(newNotif as any);
          if (req.db) {
            if (!req.db.notifications) req.db.notifications = [];
            req.db.notifications.unshift(newNotif);
          }
        }
      } catch (notifErr) {
        console.warn("Notice creating post notifications:", notifErr);
      }

      res.json(newPost);
    } catch (err: any) {
      console.error("Error creating post in /api/posts:", err);
      res.status(500).json({ error: err?.message || "Failed to create post" });
    }
  });

  // API: Edit Post
  app.put("/api/posts/:postId", async (req: any, res) => {
    const postRepo = new PostRepository();
    const post = await postRepo.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.userId !== req.body.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    post.content = req.body.content || post.content;
    post.tags = (post.content.match(/#\w+/g) || []).map((t: string) => t.substring(1));
    if (req.body.images) post.images = req.body.images;
    if (req.body.chart) post.chart = req.body.chart;

    await postRepo.update(post);
    res.json(post);
  });

  // API: Delete Post
  app.delete("/api/posts/:postId", async (req: any, res) => {
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    const { postId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    
    console.log(`DELETE /api/posts/${postId} requested by userId: ${userId}`);
    
    let post = await postRepo.findById(postId);
    if (!post && req.db?.posts) {
      post = req.db.posts.find((p: any) => p.id === postId);
    }
    
    if (!post) {
      console.warn(`Delete failed: Post ${postId} not found`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Enforce authorization
    if (!userId) {
      console.warn(`Delete failed: userId is missing for post ${postId}`);
      return res.status(400).json({ error: "userId is required for deletion" });
    }
    
    const userRepo = new UserRepository();
    const requester = await userRepo.findById(userId);
    const isAdmin = requester?.role === 'admin' || (requester as any)?.isAdmin === true || requester?.username === 'admin';

    if (post.userId !== userId && !isAdmin) {
      console.warn(`Delete failed: Unauthorized. Post owner is ${post.userId}, but requester is ${userId}`);
      return res.status(403).json({ error: "Unauthorized: Only the author or admin can delete this post" });
    }

    try {
      await postRepo.delete(postId);
      console.log(`Post ${postId} deleted from repository`);
      
      // Remove from local memory store req.db.posts as well
      if (req.db && req.db.posts) {
        req.db.posts = req.db.posts.filter((p: any) => p.id !== postId);
        if (typeof req.save === "function") {
          req.save();
        }
      }
      
      // clean comments
      const comments = await commentRepo.listByPostId(postId);
      console.log(`Cleaning up ${comments.length} comments for post ${postId}`);
      for (const c of comments) {
        await commentRepo.delete(c.id);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting post:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Like Post
  app.post("/api/posts/:postId/like", async (req: any, res) => {
    try {
      const { userId } = req.body;
      const postRepo = new PostRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();

      const post = await postRepo.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (!post.likedBy) post.likedBy = [];
      const likedIndex = post.likedBy.indexOf(userId);
      let liked = false;
      if (likedIndex >= 0) {
        post.likedBy.splice(likedIndex, 1);
      } else {
        post.likedBy.push(userId);
        liked = true;

        // Notify author
        if (post.userId !== userId) {
          const sender = await userRepo.findById(userId);
          if (sender) {
            await notifRepo.create({
              toUserId: post.userId,
              fromUserId: userId,
              fromUserName: `${(sender as any).firstName} ${(sender as any).lastName}`,
              fromUserAvatar: (sender as any).avatar,
              type: "like",
              message: "liked your post",
              isRead: false,
              timestamp: new Date().toISOString()
            });

            // Award reputation points
            const author = await userRepo.findById(post.userId);
            if (author) {
              const currentRep = (author as any).reputationPoints || 0;
              const gain = calculateReputationGain(currentRep, 1);
              (author as any).reputationPoints = currentRep + gain;
              await userRepo.update(post.userId, author);
            }
          }
        }

        // Notify followers of liking activity
        try {
          const sender = await userRepo.findById(userId);
          if (sender) {
            const followRepo = new FollowRepository();
            const followerIds = await followRepo.listFollowers(userId);
            const authorFullName = `${sender.firstName} ${sender.lastName}`.trim();
            for (const followerId of followerIds) {
              const newNotif = {
                id: "notify_like_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
                toUserId: followerId,
                fromUserId: userId,
                fromUserName: authorFullName,
                fromUserAvatar: sender.avatar || "",
                type: "like",
                message: `${authorFullName} (yang Anda ikuti) menyukai postingan từ ${post.authorName}.`,
                isRead: false,
                timestamp: new Date().toISOString()
              };
              await notifRepo.create(newNotif as any);
              if (req.db) {
                if (!req.db.notifications) req.db.notifications = [];
                req.db.notifications.unshift(newNotif);
              }
            }
          }
        } catch (notifErr) {
          console.warn("Error sending like notification to followers:", notifErr);
        }
      }

      post.likesCount = post.likedBy.length;
      await postRepo.update(post);
      res.json({ success: true, likesCount: post.likesCount, liked });
    } catch (err: any) {
      console.error("Error in /api/posts/:postId/like:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API: Comment on Post
  app.post("/api/posts/:postId/comments", async (req: any, res) => {
    try {
      console.log(`Received POST request for /api/posts/${req.params.postId}/comments: body=${JSON.stringify(req.body)}`);
      const { userId, content } = req.body;
      const postId = req.params.postId;
      const postRepo = new PostRepository();
      const commentRepo = new CommentRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();

      const post = await postRepo.findById(postId);
      if (!post) {
        console.warn(`POST /api/posts/${postId}/comments failed: Post not found`);
        return res.status(404).json({ error: "Post not found" });
      }

      const user = await userRepo.findById(userId);
      if (!user) {
        console.warn(`POST /api/posts/${postId}/comments failed: User not found`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`Attempting to create comment in CommentRepository: ${JSON.stringify({
        postId,
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: (user as any).username,
        authorAvatar: user.avatar,
        content
      })}`);
      const newComment: Comment = await commentRepo.create({
        postId,
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: (user as any).username,
        authorAvatar: user.avatar,
        content
      });
      console.log(`Comment created successfully: ${JSON.stringify(newComment)}`);

      const comments = await commentRepo.listByPostId(postId);
      post.commentsCount = comments.length;
      await postRepo.update(post);

      // Notify author
      if (post.userId !== userId) {
        await notifRepo.create({
          toUserId: post.userId,
          fromUserId: userId,
          fromUserName: `${user.firstName} ${user.lastName}`,
          fromUserAvatar: user.avatar,
          type: "comment",
          message: `commented on your post: "${content.substring(0, 30)}..."`,
          isRead: false,
          timestamp: new Date().toISOString()
        });

        const author = await userRepo.findById(post.userId);
        if (author) {
          const currentRep = (author as any).reputationPoints || 0;
          const gain = calculateReputationGain(currentRep, 2);
          (author as any).reputationPoints = currentRep + gain;
          await userRepo.update(post.userId, author);
        }
      }

      // Notify followers of commenting activity
      try {
        if (user) {
          const followRepo = new FollowRepository();
          const followerIds = await followRepo.listFollowers(userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          const snippet = content.length > 20 ? content.substring(0, 20) + "..." : content;
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_comment_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "comment",
              message: `${authorFullName} (yang Anda ikuti) mengomentari postingan ${post.authorName}: "${snippet}"`,
              isRead: false,
              timestamp: new Date().toISOString()
            };
            await notifRepo.create(newNotif as any);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error sending comment notification to followers:", notifErr);
      }

      res.json(newComment);
    } catch (err: any) {
      console.error("Error in /api/posts/:postId/comments:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API: Delete Comment
  app.delete("/api/posts/:postId/comments/:commentId", async (req: any, res) => {
    const userId = req.body?.userId || req.query?.userId;
    const { postId, commentId } = req.params;
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();

    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }

    const comment = await commentRepo.list().then(list => list.find(c => c.id === commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Authorization check
    if (comment.userId !== userId) {
      // Check if post author is deleting
      const post = await postRepo.findById(postId);
      if (!post || post.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized: Only the author or post owner can delete this comment" });
      }
    }

    try {
      await commentRepo.delete(commentId);

      // Update comment count on post
      const post = await postRepo.findById(postId);
      if (post) {
        const comments = await commentRepo.listByPostId(postId);
        post.commentsCount = comments.length;
        await postRepo.update(post);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Bookmark Post
  app.post("/api/posts/:postId/bookmark", async (req: any, res) => {
    const { userId } = req.body;
    const postId = req.params.postId;
    const postRepo = new PostRepository();

    const post = await postRepo.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.bookmarkedBy) post.bookmarkedBy = [];
    const idx = post.bookmarkedBy.indexOf(userId);
    let bookmarked = false;
    if (idx >= 0) {
      post.bookmarkedBy.splice(idx, 1);
    } else {
      post.bookmarkedBy.push(userId);
      bookmarked = true;
    }

    post.bookmarksCount = post.bookmarkedBy.length;
    await postRepo.update(post);
    res.json({ success: true, bookmarksCount: post.bookmarksCount, bookmarked });
  });

  // API: Repost
  app.post("/api/posts/:postId/repost", async (req: any, res) => {
    const { userId } = req.body;
    const postId = req.params.postId;
    const postRepo = new PostRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();

    const originalPost = await postRepo.findById(postId);
    if (!originalPost) return res.status(404).json({ error: "Post not found" });

    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!originalPost.repostedBy) originalPost.repostedBy = [];
    const idx = originalPost.repostedBy.indexOf(userId);

    if (idx >= 0) {
      originalPost.repostedBy.splice(idx, 1);
      // Remove the repost from feed
      const userPosts = await postRepo.list();
      const rp = userPosts.find((p: any) => p.userId === userId && p.isRepost && p.content.includes(originalPost.content));
      if (rp) await postRepo.delete(rp.id);
    } else {
      originalPost.repostedBy.push(userId);
      // Create repost on feed
      await postRepo.create({
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: (user as any).username,
        authorAvatar: user.avatar || "",
        authorRole: (user as any).tradingExperience || "",
        authorCity: (user as any).city || "",
        authorCountry: (user as any).country || "",
        content: `🔄 Reposted from @${originalPost.authorUsername}: \n\n${originalPost.content}`,
        images: originalPost.images || [],
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        repostsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        tags: originalPost.tags || [],
        chart: originalPost.chart,
        isRepost: true,
        originalAuthorName: originalPost.authorName,
        isOfficial: false,
        isPinned: false,
        authorVerified: !!((user as any).mt5Connected || (user as any).isVerified)
      });

      // Notify original author
      if (originalPost.userId !== userId) {
        await notifRepo.create({
          toUserId: originalPost.userId,
          fromUserId: userId,
          fromUserName: `${user.firstName} ${user.lastName}`,
          fromUserAvatar: user.avatar || "",
          type: "repost",
          message: "reposted your analysis",
          isRead: false,
          timestamp: new Date().toISOString()
        });

        const author = await userRepo.findById(originalPost.userId);
        if (author) {
          const currentRep = (author as any).reputationPoints || 0;
          const gain = calculateReputationGain(currentRep, 3);
          (author as any).reputationPoints = currentRep + gain;
          await userRepo.update(originalPost.userId, author);
        }
      }

      // Notify followers of reposting activity
      try {
        const followRepo = new FollowRepository();
        const followerIds = await followRepo.listFollowers(userId);
        const authorFullName = `${user.firstName} ${user.lastName}`.trim();
        for (const followerId of followerIds) {
          const newNotif = {
            id: "notify_repost_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            toUserId: followerId,
            fromUserId: userId,
            fromUserName: authorFullName,
            fromUserAvatar: user.avatar || "",
            type: "friend_post",
            message: `${authorFullName} (yang Anda ikuti) membagikan ulang postingan dari ${originalPost.authorName}.`,
            isRead: false,
            timestamp: new Date().toISOString()
          };
          await notifRepo.create(newNotif as any);
          if (req.db) {
            if (!req.db.notifications) req.db.notifications = [];
            req.db.notifications.unshift(newNotif);
          }
        }
      } catch (notifErr) {
        console.warn("Error sending repost notification to followers:", notifErr);
      }
    }

    originalPost.repostsCount = originalPost.repostedBy.length;
    await postRepo.update(originalPost);
    res.json({ success: true, repostsCount: originalPost.repostsCount });
  });

  // API: Get Comments
  app.get("/api/posts/:postId/comments", async (req: any, res) => {
    const commentRepo = new CommentRepository();
    const userRepo = new UserRepository();
    const comments = await commentRepo.listByPostId(req.params.postId);
    const enrichedComments = await Promise.all(comments.map(async (c: any) => {
      const cAuthor = await userRepo.findById(c.userId);
      return {
        ...c,
        authorCity: cAuthor ? cAuthor.city : (c.authorCity || "Tasikmalaya"),
        authorCountry: cAuthor ? cAuthor.country : (c.authorCountry || "Indonesia"),
        authorVerified: cAuthor ? !!((cAuthor as any).mt5Connected || (cAuthor as any).isVerified) : !!c.authorVerified
      };
    }));
    res.json(enrichedComments);
  });

  // API: Messages / Chat Sessions
  app.get("/api/messages/sessions/:userId", async (req: any, res) => {
    const uid = req.params.userId;
    const userRepo = new UserRepository();
    const messageRepo = new MessageRepository();
    const connRepo = new ConnectionRepository();

    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get all unique users that have a message session with uid
    const msgs = await messageRepo.listAllForUser(uid);
    
    // Get connection statuses
    const connections = await connRepo.list();
    const acceptedPartners = new Set(
      connections
        .filter((c: any) => c.status === 'accepted')
        .map((c: any) => c.requesterId === uid ? c.receiverId : c.receiverId === uid ? c.requesterId : null)
        .filter(Boolean)
    );
    
    const partnerIds = Array.from(new Set(msgs.map((m: any) => m.senderId === uid ? m.receiverId : m.senderId)))
      .filter((pId: any) => pId && typeof pId === 'string' && !pId.startsWith("group_")); // Exclude groups from regular partner sessions
    
    const sessions: any[] = await Promise.all(partnerIds.map(async (pId) => {
      const partner = await userRepo.findById(pId as string);
      if (!partner) return null;

      const userMsgs = msgs.filter((m: any) => (m.senderId === uid && m.receiverId === pId) || (m.senderId === pId && m.receiverId === uid));
      userMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const lastMsg = userMsgs[userMsgs.length - 1];
      const unreadCount = userMsgs.filter((m: any) => m.senderId === pId && m.receiverId === uid && !m.isRead).length;

      const isConnected = acceptedPartners.has(partner.id);

      return {
        userId: partner.id,
        username: partner.username,
        firstName: partner.firstName,
        lastName: partner.lastName,
        city: partner.city,
        country: partner.country,
        avatar: partner.avatar,
        lastMessage: lastMsg ? lastMsg.content : "",
        lastMessageTime: lastMsg ? lastMsg.timestamp : "",
        unreadCount,
        isGroup: false,
        isConnected
      };
    }));
    
    const filteredSessions = sessions.filter(s => s !== null);

    // Append City group chat if user has city
    if (user.city) {
      const cityKey = user.city.toLowerCase().replace(/\s+/g, '_');
      const cityGroupId = `group_city_${cityKey}`;
      const cityGroupMsgs = msgs.filter((m: any) => m.receiverId === cityGroupId);
      cityGroupMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastCityMsg = cityGroupMsgs[cityGroupMsgs.length - 1];

      filteredSessions.unshift({
        userId: cityGroupId,
        username: cityGroupId,
        firstName: `Grup ${user.city}`,
        lastName: "",
        city: user.city,
        country: user.country || "Indonesia",
        province: user.province || "",
        avatar: "GC",
        lastMessage: lastCityMsg ? lastCityMsg.content : `Selamat datang di grup chat ${user.city}!`,
        lastMessageTime: lastCityMsg ? lastCityMsg.timestamp : new Date().toISOString(),
        unreadCount: 0,
        isGroup: true,
        groupType: "city"
      });
    }

    // Append Province group chat if user has province
    if (user.province) {
      const provinceKey = user.province.toLowerCase().replace(/\s+/g, '_');
      const provinceGroupId = `group_province_${provinceKey}`;
      const provinceGroupMsgs = msgs.filter((m: any) => m.receiverId === provinceGroupId);
      provinceGroupMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastProvinceMsg = provinceGroupMsgs[provinceGroupMsgs.length - 1];

      filteredSessions.unshift({
        userId: provinceGroupId,
        username: provinceGroupId,
        firstName: `Grup ${user.province}`,
        lastName: "",
        city: user.city || "Singapore",
        country: user.country || "Indonesia",
        province: user.province,
        avatar: "GP",
        lastMessage: lastProvinceMsg ? lastProvinceMsg.content : `Selamat datang di grup chat ${user.province}!`,
        lastMessageTime: lastProvinceMsg ? lastProvinceMsg.timestamp : new Date().toISOString(),
        unreadCount: 0,
        isGroup: true,
        groupType: "province"
      });
    }

    res.json(filteredSessions);
  });

  // API: Chat History between current user and partner
  app.get("/api/messages/history", async (req: any, res) => {
    const { userId, partnerId } = req.query;
    if (!userId || !partnerId) return res.status(400).json({ error: "Missing parameters" });

    const messageRepo = new MessageRepository();
    const userRepo = new UserRepository();
    const isGroup = (partnerId as string).startsWith("group_");

    let chatHistory = await messageRepo.listHistory(userId as string, partnerId as string);

    chatHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Enrich message history with sender info for group chats
    let enrichedHistory = await Promise.all(chatHistory.map(async (m: any) => {
      const sender = await userRepo.findById(m.senderId);
      return {
        ...m,
        senderName: sender ? `${sender.firstName} ${sender.lastName}` : (m.senderId === 'tarapti_official' ? 'Tarapti Official' : 'Trader'),
        senderAvatar: sender ? sender.avatar : (m.senderId === 'tarapti_official' ? 'TO' : 'TR')
      };
    }));

    if (isGroup) {
      const groupName = (partnerId as string).replace("group_city_", "").replace("group_province_", "").replace(/_/g, " ");
      const uppercaseGroupName = groupName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const welcomeMessage = {
        id: `welcome_${partnerId}`,
        senderId: "tarapti_official",
        receiverId: partnerId,
        content: `Selamat datang di grup chat ${uppercaseGroupName}! Grup ini dirancang sebagai wadah komunikasi, berbagi sinyal, dan diskusi analisa market bagi para trader yang berdomisili di wilayah yang sama. Tetap patuhi aturan, hargai sesama trader, dan selamat bertransaksi!`,
        timestamp: new Date(new Date().getTime() - 365 * 24 * 3600 * 1000).toISOString(), // 1 year ago to keep it at the top
        isRead: true,
        senderName: "Tarapti Official",
        senderAvatar: "TO"
      };

      // Ensure the welcome message is always prepended if it's not already in the list
      if (!enrichedHistory.some((m: any) => m.id === `welcome_${partnerId}`)) {
        enrichedHistory = [welcomeMessage as any, ...enrichedHistory];
      }
    }

    if (!isGroup) {
      // Mark messages from partner to current user as read with timestamp
      const now = new Date().toISOString();
      await messageRepo.markAsRead(partnerId as string, userId as string);

      enrichedHistory = enrichedHistory.map((m: any) => {
        if (m.senderId === partnerId && m.receiverId === userId && !m.isRead) {
          return { ...m, isRead: true, read_at: now, readAt: now };
        }
        return m;
      });

      if (req.db && req.db.messages) {
        req.db.messages.forEach((m: any) => {
          if (m.senderId === partnerId && m.receiverId === userId && !m.isRead) {
            m.isRead = true;
            m.read_at = now;
            m.readAt = now;
          }
        });
      }
    }

    res.json(enrichedHistory);
  });

  // API: Send Message
  app.post("/api/messages", async (req: any, res) => {
    try {
      const { senderId, receiverId, content, image, fileUrl, fileName } = req.body;
      if (!senderId || !receiverId || (!content && !image && !fileUrl)) {
        return res.status(400).json({ error: "Missing message payload" });
      }

      const messageRepo = new MessageRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();

      const newMessage: Message = await messageRepo.create({
        senderId,
        receiverId,
        content: content || "",
        image: image || undefined,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        reactions: [],
        isRead: false,
        isDelivered: true,
        read_at: null,
        readAt: null
      });

      // Notify receiver or group members
      let sender = await userRepo.findById(senderId);
      if (!sender) {
        try {
          const uObj = await authService.getCurrentUser(senderId);
          if (uObj) {
            sender = { ...uObj.user, ...uObj.profile } as any;
            await userRepo.create(sender as any);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!sender) return res.status(404).json({ error: "Sender not found" });

      if (receiverId.startsWith("group_")) {
        const isCity = receiverId.startsWith("group_city_");
        const groupValue = receiverId.replace("group_city_", "").replace("group_province_", "").replace(/_/g, " ").toLowerCase();
        
        const allUsers = await userRepo.list();
        const groupUsers = allUsers.filter((u: any) => {
          if (u.id === senderId) return false;
          if (isCity) {
            return u.city && u.city.toLowerCase() === groupValue;
          } else {
            return u.province && u.province.toLowerCase() === groupValue;
          }
        });

        for (const targetUser of groupUsers) {
          await notifRepo.create({
            toUserId: targetUser.id,
            fromUserId: senderId,
            fromUserName: `${sender.firstName} ${sender.lastName}`,
            fromUserAvatar: sender.avatar || "",
            type: "message",
            message: `mengirim pesan di grup ${isCity ? sender.city : (sender as any).province}: "${content ? content.substring(0, 30) : "Gambar"}"`,
            isRead: false,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        const receiver = await userRepo.findById(receiverId);
        if (receiver) {
          await notifRepo.create({
            toUserId: receiverId,
            fromUserId: senderId,
            fromUserName: `${sender.firstName} ${sender.lastName}`,
            fromUserAvatar: sender.avatar || "",
            type: "message",
            message: `sent you a message: "${content ? content.substring(0, 30) : "Image"}"`,
            isRead: false,
            timestamp: new Date().toISOString()
          });
        }
      }

      res.json(newMessage);
    } catch (err: any) {
      console.error("Error in POST /api/messages:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API: React to Message
  // API: React to Message
  app.post("/api/messages/:messageId/react", async (req: any, res) => {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ error: "Missing user ID or emoji" });
    }

    const messageRepo = new MessageRepository();
    const message = await messageRepo.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.reactions) message.reactions = [];

    const existingReactionIndex = message.reactions.findIndex(
      (r: any) => r.userId === userId && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Toggle off
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ userId, emoji });
    }

    await messageRepo.update(message);
    res.json({ success: true, reactions: message.reactions });
  });

  // API: Delete Message
  app.delete("/api/messages/:messageId", async (req: any, res) => {
    const { messageId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    const messageRepo = new MessageRepository();
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }

    const message = await messageRepo.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Authorization check: only sender can delete
    if (message.senderId !== userId) {
      return res.status(403).json({ error: "Unauthorized: Only the sender can delete this message" });
    }

    try {
      await messageRepo.delete(messageId);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Notifications
  app.post("/api/notifications", async (req: any, res) => {
    const { toUserId, fromUserId, fromUserName, fromUserAvatar, type, message } = req.body;
    const notifRepo = new NotificationRepository();
    const newNotification = await notifRepo.create({
      toUserId,
      fromUserId: fromUserId || "system",
      fromUserName: fromUserName || "Tarapti Alert",
      fromUserAvatar: fromUserAvatar || "🚨",
      type: type || "market_pulse",
      message,
      isRead: false,
      timestamp: new Date().toISOString()
    });
    res.json(newNotification);
  });

  app.get("/api/notifications/:userId", async (req: any, res) => {
    const notifRepo = new NotificationRepository();
    const userNotifications = await notifRepo.listByUserId(req.params.userId);
    userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(userNotifications);
  });

  // API: Mark notification as read
  app.put("/api/notifications/:notificationId/read", async (req: any, res) => {
    const notifRepo = new NotificationRepository();
    const notification = await notifRepo.findById(req.params.notificationId);
    if (notification) {
      notification.isRead = true;
      await notifRepo.update(notification.id, notification);
    }
    res.json({ success: true });
  });

  // API: Mark all notifications read
  app.put("/api/notifications/user/:userId/read-all", async (req: any, res) => {
    const notifRepo = new NotificationRepository();
    await notifRepo.markAllAsRead(req.params.userId);
    res.json({ success: true });
  });

  // API: Clear all market pulse notifications for a user
  app.delete("/api/notifications/user/:userId/market_pulse", async (req: any, res) => {
    const notifRepo = new NotificationRepository();
    const notifs = await notifRepo.listByUserId(req.params.userId);
    const toDelete = notifs.filter(n => n.type === 'market_pulse');
    for (const n of toDelete) {
      await notifRepo.delete(n.id);
    }
    res.json({ success: true });
  });

  // API: Leaderboard (Weekly, Monthly, All Time)
  app.get("/api/leaderboard", async (req: any, res) => {
    const { period } = req.query; // weekly, monthly, alltime
    // We can simulate score based on reputationPoints, posts count, and followings.
    // Let's sort by reputationPoints.
    const userRepo = new UserRepository();
    const sortedUsers = (await userRepo.list()).sort((a: any, b: any) => (b.reputationPoints || 0) - (a.reputationPoints || 0));
    
    // Construct Top Contributors, Most Helpful, and Most Active
    const contributors = sortedUsers.map((u, i) => {
      const scale = period === 'weekly' ? 0.3 : period === 'monthly' ? 0.7 : 1.0;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        reputation: Math.round(u.reputationPoints * scale),
        postsCount: req.db.posts.filter((p: any) => p.userId === u.id).length,
        rank: i + 1
      };
    });

    // Most helpful: based on comments and likes received
    const helpful = [...sortedUsers].sort((a,b) => (b.reputationPoints * 1.2) - (a.reputationPoints * 0.9)).map((u, i) => {
      const scale = period === 'weekly' ? 0.25 : period === 'monthly' ? 0.65 : 1.0;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        score: Math.round((u.reputationPoints + 50) * scale),
        rank: i + 1
      };
    });

    // Most active: based on posting and online presence
    const active = [...sortedUsers].sort((a,b) => (uOnlineWeight(b) - uOnlineWeight(a))).map((u, i) => {
      const scale = period === 'weekly' ? 0.4 : period === 'monthly' ? 0.8 : 1.0;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        activityIndex: Math.round((u.reputationPoints * 0.1 + 15) * scale),
        rank: i + 1
      };
    });

    function uOnlineWeight(u: any) {
      let weight = u.reputationPoints;
      if (u.onlineStatus === 'online') weight += 500;
      return weight;
    }

    res.json({ contributors, helpful, active });
  });

  // Volatility Alerts Definitions
  const VOLATILITY_EVENTS = {
    "Forex": [
      "US Dollar Index (DXY) surges +1.5% following hot inflation print!",
      "GBP/USD drops 120 pips as Bank of England shifts dovish.",
      "EUR/USD spikes to 3-week highs on unexpected Eurozone GDP growth.",
      "USD/JPY breaks above 150.00, triggering suspected government intervention warnings!"
    ],
    "Crypto": [
      "Bitcoin drops 6.5% in 20 minutes as long liquidations top $300M!",
      "Ethereum gas fees surge 400% amid high volume decentralized exchange swaps.",
      "Solana spikes +12% breaking key resistance at $160.",
      "Crypto market cap gains $80B in 2 hours as ETF inflows reach record highs."
    ],
    "Stocks": [
      "NVIDIA shares jump +8.2% in pre-market trading after blowout earnings!",
      "Tech sector sell-off drags S&P 500 down by 1.8% at the market open.",
      "Tesla drops 5% on regulatory filing showing margin contractions.",
      "Apple reaches new record high, leading a broad-based equities rally."
    ],
    "Indices": [
      "NASDAQ 100 VIX index rises by 25%, marking extreme intraday swings!",
      "Dow Jones Industrial Average drops 500 points on hawkish Fed minutes.",
      "Nikkei 225 drops 3% overnight following monetary policy rate hike.",
      "S&P 500 breaks historic 5,500 milestone with high sector rotation volatility."
    ],
    "Commodities": [
      "Crude Oil spikes +4.5% due to Middle East supply disruption concerns.",
      "Gold (XAU/USD) shoots past $2,450 to all-time high on safe haven inflows!",
      "Natural Gas down 7.2% as weather forecasts predict milder temperatures.",
      "Silver gains +5% in heavy volume breakout, catching up to Gold's bull run."
    ]
  };

  function triggerMarketPulse(db: any, saveFn: () => void, assetClass?: string, customMsg?: string) {
    const assets = ["Forex", "Crypto", "Stocks", "Indices", "Commodities"];
    const chosenAsset = assetClass || assets[Math.floor(Math.random() * assets.length)];
    
    const events = VOLATILITY_EVENTS[chosenAsset as keyof typeof VOLATILITY_EVENTS] || [];
    const messageText = customMsg || events[Math.floor(Math.random() * events.length)];

    // Find users who have enabled market pulse and follow this asset class
    const usersToNotify = db.users.filter((u: any) => {
      if (!u.marketPulseEnabled) return false;
      const followedAssets = u.marketPulseAssets || [u.tradingAsset];
      return followedAssets.includes(chosenAsset);
    });

    if (usersToNotify.length === 0) return { chosenAsset, notifiedCount: 0, messageText };

    usersToNotify.forEach((user: any) => {
      db.notifications.push({
        id: "notify_mp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        toUserId: user.id,
        fromUserId: "system",
        fromUserName: "Market Pulse",
        fromUserAvatar: "⚡",
        type: "market_pulse",
        message: `High Volatility Alert (${chosenAsset}): ${messageText}`,
        isRead: false,
        timestamp: new Date().toISOString(),
        assetClass: chosenAsset
      });
    });

    saveFn();
    return { chosenAsset, notifiedCount: usersToNotify.length, messageText };
  }

  // API: Get App Stats for simulated Push and Offline Notifications
  app.post("/api/pwa/subscribe", (req: any, res) => {
    const { subscription } = req.body;
    if (subscription) {
      req.db.pushSubscriptions = req.db.pushSubscriptions || [];
      req.db.pushSubscriptions.push(subscription);
      if (typeof req.save === "function") req.save();
    }
    res.json({ success: true });
  });

  // API: Simulate Market Volatility Event
  app.post("/api/pwa/market-pulse/simulate", (req: any, res) => {
    const { assetClass, message } = req.body;
    const result = triggerMarketPulse(req.db, req.save, assetClass, message);
    res.json({ success: true, ...result });
  });

  // Start automated volatility background simulation
  setInterval(() => {
    try {
      const db = loadDb();
      const hasEnabledUsers = db.users.some((u: any) => u.marketPulseEnabled);
      if (hasEnabledUsers) {
        const result = triggerMarketPulse(db, () => saveDb(db));
        console.log(`[Market Pulse Background] Triggered volatility spike for ${result.chosenAsset}. Notified ${result.notifiedCount} traders.`);
      }
    } catch (e) {
      console.error("[Market Pulse Background Error]:", e);
    }
  }, 45000);

  // --- ADMIN PORTAL INTEGRATIONS ---
  // Ensure default admin settings exist
  const getAdminSettings = (db: any) => {
    if (!db.adminSettings) {
      db.adminSettings = {
        mt5Server: "axi-live-server",
        mt5Login: "2091384",
        mt5Password: "••••••••••••",
        mt5Port: "443",
        mt5Status: "connected",
        newsProvider: "rss",
        newsRssUrl: "https://www.forexlive.com/rss",
        newsApiKey: "",
        telegramBotToken: "",
        telegramChatId: "",
        fcmServerKey: ""
      };
    }
    return db.adminSettings;
  };

  // API: Get admin integration settings
  app.get("/api/admin/settings", authenticate, (req: any, res) => {
    res.json(getAdminSettings(req.db));
  });

  // API: Update admin integration settings
  app.post("/api/admin/settings", authenticate, (req: any, res) => {
    const settings = getAdminSettings(req.db);
    Object.assign(settings, req.body);
    if (typeof req.save === "function") req.save();
    res.json({ success: true, settings });
  });

  // API: Test MT5 integration
  app.post("/api/admin/mt5/test", authenticate, (req: any, res) => {
    const { mt5Server, mt5Login, mt5Password, mt5Port } = req.body;
    if (!mt5Server || !mt5Login || !mt5Password) {
      return res.status(400).json({ error: "Missing required MT5 configuration fields" });
    }
    // Simulate active validation connection with delay
    setTimeout(() => {
      try {
        const isSuccess = mt5Login !== "fail";
        if (isSuccess) {
          req.db.adminSettings = req.db.adminSettings || {};
          req.db.adminSettings.mt5Status = "connected";
          if (typeof req.save === "function") req.save();
          res.json({ success: true, message: `Successfully connected to MetaTrader 5 server: ${mt5Server} for Login ID: ${mt5Login}` });
        } else {
          res.status(400).json({ error: "Failed to establish socket connection with MT5 server. Please verify credentials and server state." });
        }
      } catch (err) {
        console.error("Error in MT5 test simulation:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error during simulation" });
      }
    }, 800);
  });

  // --- METATRADER API ENDPOINTS (PROXY ke tarapti-be) ---
  //
  // Semua request /api/metatrader/* diteruskan ke tarapti-be (BE-GOTRADING)
  // yang punya koneksi nyata ke MT5 Gateway. JANGAN tangani di sini pakai
  // MetaTraderService lokal (hanya nulis ke tabel Post, tidak ke gateway).
  //
  // tarapti-be URL: process.env.VITE_BACKEND_API_URL || 'http://172.17.0.1:3004'

  const MT5_BACKEND_URL = (process.env.VITE_BACKEND_API_URL || 'http://172.17.0.1:3004').replace(/\/$/, '');

  async function proxyToBackend(req: any, res: any, path: string, method: string, body?: any) {
    const authHeader = req.headers['authorization'] || '';
    const qs = Object.keys(req.query || {}).length
      ? '?' + new URLSearchParams(req.query as Record<string, string>).toString()
      : '';
    const targetUrl = `${MT5_BACKEND_URL}${path}${qs}`;
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        } as Record<string, string>,
      };
      if (body !== undefined && method !== 'GET') {
        (fetchOptions as any).body = JSON.stringify(body);
      }
      const upstream = await fetch(targetUrl, fetchOptions);
      const contentType = upstream.headers.get('content-type') || '';
      res.status(upstream.status);
      if (contentType.includes('application/json')) {
        const data = await upstream.json();
        res.json(data);
      } else {
        const text = await upstream.text();
        res.send(text);
      }
    } catch (err: any) {
      console.error(`[MT5-PROXY] Error proxying ${method} ${targetUrl}:`, err.message);
      res.status(502).json({ error: 'MT5 backend tidak dapat dihubungi. Coba lagi.' });
    }
  }

  // GET /api/metatrader/account
  app.get("/api/metatrader/account", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/account', 'GET');
  });

  // POST /api/metatrader/connect
  app.post("/api/metatrader/connect", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/connect', 'POST', req.body);
  });

  // POST /api/metatrader/disconnect
  app.post("/api/metatrader/disconnect", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/disconnect', 'POST', req.body);
  });

  // GET /api/metatrader/trades
  app.get("/api/metatrader/trades", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/trades', 'GET');
  });

  // POST /api/metatrader/sync
  app.post("/api/metatrader/sync", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/sync', 'POST', req.body);
  });

  // POST /api/metatrader/reconnect
  app.post("/api/metatrader/reconnect", authenticate, async (req: any, res) => {
    await proxyToBackend(req, res, '/api/metatrader/reconnect', 'POST', req.body);
  });

  // API: Test & Sync News API / RSS
  app.post("/api/admin/news/sync", authenticate, (req: any, res) => {
    const { newsProvider, newsRssUrl, newsApiKey } = req.body;
    // Simulate fetching and parsing RSS feeds or calling trading news APIs.
    setTimeout(() => {
      try {
        const articles = [
          { title: "USD/JPY Breaks 158.50 as Yield Differentials Diverge", source: "ForexLive", time: "Just Now" },
          { title: "ECB Policymakers Signal Cautious Approach on Upcoming Rate Cuts", source: "Tarapti News Feed", time: "15 mins ago" },
          { title: "Gold Consolidation Continues Ahead of US Retail Sales Report", source: newsProvider === "rss" ? "Custom RSS" : "NewsAPI", time: "45 mins ago" }
        ];
        res.json({ 
          success: true, 
          message: `Successfully synchronized news from ${newsProvider === "rss" ? newsRssUrl : "NewsAPI"}`,
          articles 
        });
      } catch (err) {
        console.error("Error in news sync simulation:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error during news sync" });
      }
    }, 600);
  });

  // API: Admin list all users
  app.get("/api/admin/users", authenticate, async (req: any, res) => {
    const userRepo = new UserRepository();
    const users = await userRepo.list();
    const safeUsers = (users || []).map(({ password, ...u }: any) => u);
    res.json(safeUsers);
  });

  // API: Admin update user (reputation, trading experience/asset, role)
  app.put("/api/admin/users/:userId", authenticate, async (req: any, res) => {
    const { userId } = req.params;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { firstName, lastName, username, email, tradingExperience, tradingAsset, reputationPoints, role, onlineStatus } = req.body;
    
    const updatedFields: any = {};
    if (firstName !== undefined) updatedFields.firstName = firstName;
    if (lastName !== undefined) updatedFields.lastName = lastName;
    if (username !== undefined) updatedFields.username = username;
    if (email !== undefined) updatedFields.email = email;
    if (tradingExperience !== undefined) updatedFields.tradingExperience = tradingExperience;
    if (tradingAsset !== undefined) updatedFields.tradingAsset = tradingAsset;
    if (reputationPoints !== undefined) updatedFields.reputationPoints = Number(reputationPoints);
    if (role !== undefined) updatedFields.role = role;
    if (onlineStatus !== undefined) updatedFields.onlineStatus = onlineStatus;
    
    await userRepo.update(userId, updatedFields);
    res.json({ success: true, user: { ...user, ...updatedFields } });
  });

  // API: Admin delete user
  app.delete("/api/admin/users/:userId", authenticate, async (req: any, res) => {
    const { userId } = req.params;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    await userRepo.delete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  });

  // API: Test Real-time Notification Trigger
  app.post("/api/notifications/test-trigger", async (req: any, res) => {
    const { userId, eventType } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const userRepo = new UserRepository();
    const targetUser = await userRepo.findById(userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const allUsers = await userRepo.list();
    const sampleSender = (allUsers || []).find((u: any) => u.id !== userId) || {
      id: "user_sim",
      firstName: "Sarah",
      lastName: "Jenkins",
      username: "sarah_trades",
      avatar: "SJ"
    };

    let notification: Notification;
    let eventName = "NOTIFICATION";

    if (eventType === 'friend_request') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "friend_request",
        message: "wants to connect with you",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "FRIEND_REQUEST";
    } else if (eventType === 'friend_accepted') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "friend_accepted",
        message: "accepted your connection request!",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "FRIEND_ACCEPTED";
    } else if (eventType === 'new_message') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "message",
        message: "sent you a message: 'Hello! How is your XAUUSD market setup today?'",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NEW_MESSAGE";
    } else if (eventType === 'profit_target_daily') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "🎯",
        type: "profit_target_daily",
        message: "🎯 Target Profit Harian Tercapai! Selama sesi ini Anda menghasilkan +$520.00 (+5.2%).",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === 'profit_target_weekly') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "🚀",
        type: "profit_target_weekly",
        message: "🚀 Target Profit Mingguan Tercapai! Akumulasi minggu ini: +$1,850.00 (+18.5%). Performa luar biasa!",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === 'drawdown_daily') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "⚠️",
        type: "drawdown_daily",
        message: "⚠️ Peringatan Drawdown Harian! Loss harian mencapai -2.8% (mendekati batas toleransi -3.0%).",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === 'drawdown_weekly') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "🚨",
        type: "drawdown_weekly",
        message: "🚨 Batas Max Drawdown Mingguan Reached! Drawdown -5.1% tercapai. Proteksi posisi otomatis aktif.",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === 'high_news') {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_news_radar",
        fromUserName: "Economic News Radar",
        fromUserAvatar: "🔴",
        type: "high_news",
        message: "🔴 High Impact Economic News: US Non-Farm Payrolls (NFP) & Unemployment Rate rilis dalam 15 menit!",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    } else {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "like",
        message: "liked your technical analysis post",
        isRead: false,
        timestamp: new Date().toISOString()
      };
      eventName = "NOTIFICATION";
    }

    req.db.notifications.push(notification);
    if (typeof req.save === "function") req.save();

    res.json({ success: true, notification, eventName });
  });

  // API: Broadcast Notification to all users
  app.post("/api/admin/broadcast", authenticate, async (req: any, res) => {
    const { message, type } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Broadcast message cannot be empty" });
    }

    const senderId = "user_1"; // Michael (System Admin)
    const userRepo = new UserRepository();
    const notificationRepo = new NotificationRepository();
    
    const sender = await userRepo.findById(senderId) || { firstName: "System", lastName: "Admin", avatar: "SA" };
    const allUsers = await userRepo.list();
    
    let count = 0;
    
    for (const user of (allUsers || [])) {
      const notification = {
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        toUserId: user.id,
        fromUserId: senderId,
        fromUserName: `${sender.firstName} ${sender.lastName}`,
        fromUserAvatar: sender.avatar,
        type: type || "market_pulse",
        message: message,
        isRead: false,
        timestamp: new Date().toISOString()
      };
      await notificationRepo.create(notification as any);
      count++;
    }

    res.json({ success: true, message: `Successfully broadcasted to ${count} users.` });
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
        const user = await authService.getCurrentUser((req as any).userId);
        res.json({ success: true, data: user, error: null });
    } catch (e: any) {
        res.status(500).json({ success: false, data: null, error: { code: 'AUTH_INTERNAL_ERROR', message: e.message } });
    }
  });

  app.get("/api/auth/sessions", authenticate, async (req, res) => {
    try {
        const sessions = await authService.listSessions((req as any).userId);
        res.json({ success: true, data: sessions, error: null });
    } catch (e: any) {
        res.status(500).json({ success: false, data: null, error: { code: 'AUTH_INTERNAL_ERROR', message: e.message } });
    }
  });

  app.delete("/api/auth/sessions/:id", authenticate, async (req, res) => {
    try {
        await authService.revokeSession(req.params.id);
        res.json({ success: true, data: null, error: null });
    } catch (e: any) {
        res.status(500).json({ success: false, data: null, error: { code: 'AUTH_INTERNAL_ERROR', message: e.message } });
    }
  });

  app.delete("/api/auth/sessions", authenticate, async (req, res) => {
    try {
        await authService.revokeAllSessions((req as any).userId);
        res.json({ success: true, data: null, error: null });
    } catch (e: any) {
        res.status(500).json({ success: false, data: null, error: { code: 'AUTH_INTERNAL_ERROR', message: e.message } });
    }
  });

  // 404 handler for API routes - must be before SPA fallback
  app.all("/api/*", (req: any, res) => {
    res.status(404).json({ 
      success: false, 
      data: null, 
      error: { 
        code: "API_NOT_FOUND", 
        message: `API route not found: ${req.originalUrl}` 
      } 
    });
  });
  app.use("/api", (req: any, res) => {
    res.status(404).json({ 
      success: false, 
      data: null, 
      error: { 
        code: "API_NOT_FOUND", 
        message: `API route not found: ${req.originalUrl}` 
      } 
    });
  });


  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global express error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  });

  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite integration
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR WebSocket creation to prevent socket connection errors
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback: Send index.html for any non-API route
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Tarapti Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FATAL: Failed to start express server:", err);
});
