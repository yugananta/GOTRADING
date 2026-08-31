import fs from 'fs';
import path from 'path';
import { DailyBrief, DailyBriefEvent } from '../types.ts';
import { NotificationRepository } from '../repositories/NotificationRepository.ts';

const STATE_FILE = path.join(process.cwd(), 'data', 'daily_briefs.json');

export class DailyBriefService {
  private static getBriefs(): Record<string, DailyBrief> {
    try {
       if (fs.existsSync(STATE_FILE)) {
         return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
       }
    } catch (e) {}
    return {};
  }

  private static saveBriefs(map: Record<string, DailyBrief>) {
    try {
      if (!fs.existsSync(path.dirname(STATE_FILE))) {
         fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(map, null, 2));
    } catch (e) {}
  }

  static async generateBrief(userId: string, localDate: string, timezone: string, traderContextInput?: any): Promise<DailyBrief> {
    const briefs = this.getBriefs();
    const key = `${userId}_${localDate}`;

    if (briefs[key]) {
      return briefs[key];
    }

    // Mock AI Generation Logic based on rules
    
    let marketContext = "Today's calendar is concentrated around major USD economic releases.";
    let traderContext = "Personal trading context is not yet available.";
    let watchItems = [
      "US CPI — 14:30",
      "USD volatility around the release",
      "Keep risk exposure in perspective"
    ];
    let advice = "Major USD events are scheduled today. Be mindful of risk exposure around the releases.";
    
    // Customize if trader context is provided
    if (traderContextInput && traderContextInput.currentDrawdown > 5) {
      traderContext = "Your current drawdown remains elevated compared with your recent baseline.";
      watchItems[2] = "Current drawdown remains elevated";
      advice = "Major USD events are scheduled today while your drawdown remains elevated. Be especially mindful of risk exposure around the releases.";
    } else if (traderContextInput) {
      traderContext = "Your recent trading conditions appear relatively stable.";
    }

    const newBrief: DailyBrief = {
      id: `brief_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      userId,
      date: localDate,
      timezone,
      marketContext,
      highImpactEvents: [
        {
          id: 'evt_1',
          time: '14:30', // Ideally converted to local timezone, but we'll leave it as a string for now
          title: 'US CPI',
          currency: 'USD',
          impact: 'HIGH IMPACT',
          forecast: '3.1%',
          previous: '3.2%'
        },
        {
          id: 'evt_2',
          time: '19:00',
          title: 'FOMC Speaker',
          currency: 'USD',
          impact: 'HIGH IMPACT'
        }
      ],
      traderContext,
      watchItems,
      advice,
      generatedAt: new Date().toISOString()
    };

    briefs[key] = newBrief;
    this.saveBriefs(briefs);
    return newBrief;
  }

  static async sendPushNotification(userId: string, briefId: string) {
    const briefs = this.getBriefs();
    // Find the brief
    const brief = Object.values(briefs).find(b => b.id === briefId && b.userId === userId);
    
    if (brief) {
      const notifRepo = new NotificationRepository();
      await notifRepo.create({
        toUserId: userId,
        fromUserId: 'system_ai_brief', // System sender
        fromUserName: 'AI Daily Brief',
        fromUserAvatar: '🤖',
        type: 'daily_brief',
        message: "3 high-impact economic events are scheduled today, including major USD releases.",
        isRead: false,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }
}
