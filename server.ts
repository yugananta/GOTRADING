import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initialUsers,
  initialTradingAccounts,
  initialTrades,
  initialHealthRecords,
  initialJournalEntries,
  initialPlans,
  initialSocialPosts,
  initialSocialReports,
  initialCampaigns,
  initialCompetitions,
  initialParticipants,
  initialTransactions,
  initialPartners,
  initialTickets,
  initialCMSContent,
  initialIntegrations,
  initialCredentials,
  initialWebhooks,
  initialAdmins,
  initialAuditLogs,
  defaultSystemSettings
} from './src/mockData/initialState';

// Process-level exception guards for container reliability
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Request logger for observability in cloud deploy logs
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  app.use(express.json());

  // CORS middleware for cross-origin and domain flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // In-memory data store for server APIs
  let users = [...initialUsers];
  let tradingAccounts = [...initialTradingAccounts];
  let trades = [...initialTrades];
  let healthRecords = [...initialHealthRecords];
  let journalEntries = [...initialJournalEntries];
  let plans = [...initialPlans];
  let socialPosts = [...initialSocialPosts];
  let socialReports = [...initialSocialReports];
  let campaigns = [...initialCampaigns];
  let competitions = [...initialCompetitions];
  let participants = [...initialParticipants];
  let transactions = [...initialTransactions];
  let partners = [...initialPartners];
  let tickets = [...initialTickets];
  let cmsContent = [...initialCMSContent];
  let integrations = [...initialIntegrations];
  let credentials = [...initialCredentials];
  let webhooks = [...initialWebhooks];
  let admins = [...initialAdmins];
  let auditLogs = [...initialAuditLogs];
  let settings = { ...defaultSystemSettings };

  // Helper function to insert audit log
  const logAudit = (adminName: string, role: any, action: string, targetModule: string, targetId: string, details: string) => {
    const newLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      adminName,
      adminRole: role,
      action,
      targetModule,
      targetId,
      ipAddress: '127.0.0.1',
      device: 'Admin Server Agent',
      details
    };
    auditLogs.unshift(newLog);
  };

  // --- API ROUTES ---

  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'CONNECTED',
      serverTime: new Date().toISOString(),
      activeAdmins: admins.filter(a => a.status === 'ACTIVE').length,
      mt5Bridge: 'CONNECTED',
      database: 'CONNECTED'
    });
  });

  // Dashboard Stats
  app.get('/api/v1/dashboard/stats', (req, res) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
    const newUsers = 12; // last 24h
    const activeTraders = tradingAccounts.filter(a => a.status === 'CONNECTED').length;
    const totalDeposit = transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawal = transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
    const totalVolume = 18450.5; // Lots
    const totalPnl = users.reduce((sum, u) => sum + u.pnl, 0);
    const avgWinRate = (users.reduce((sum, u) => sum + u.winRate, 0) / users.length).toFixed(1);
    const usersAtRisk = healthRecords.filter(h => h.riskLevel === 'CRITICAL' || h.riskLevel === 'WARNING').length;

    res.json({
      totalUsers,
      activeUsers,
      newUsers,
      activeTraders,
      totalDeposit,
      totalWithdrawal,
      totalVolume,
      totalPnl,
      avgWinRate,
      usersAtRisk,
      systemStatus: {
        backendApi: 'CONNECTED',
        database: 'CONNECTED',
        supabase: 'CONNECTED',
        mt5Connector: 'CONNECTED',
        brokerApi: 'CONNECTED',
        socialApi: 'CONNECTED',
        paymentApi: 'CONNECTED',
        notificationService: 'WARNING',
        webhooks: 'CONNECTED'
      }
    });
  });

  // Users APIs
  app.get('/api/v1/users', (req, res) => {
    res.json(users);
  });

  app.post('/api/v1/users/:id/suspend', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (user) {
      user.status = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      logAudit('Owner', 'OWNER', user.status === 'SUSPENDED' ? 'USER SUSPENDED' : 'USER ACTIVATED', 'Users', user.id, `User ${user.name} status updated to ${user.status}`);
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  });

  // Trading Accounts APIs
  app.get('/api/v1/trading-accounts', (req, res) => {
    res.json(tradingAccounts);
  });

  app.post('/api/v1/trading-accounts/:id/sync', (req, res) => {
    const acc = tradingAccounts.find(a => a.id === req.params.id);
    if (acc) {
      acc.lastSync = 'Just now';
      acc.status = 'CONNECTED';
      acc.latencyMs = Math.floor(Math.random() * 15) + 10;
      logAudit('Owner', 'OWNER', 'FORCE SYNC ACCOUNT', 'Trading Accounts', acc.accountNumber, `Triggered force sync for ${acc.userName} (${acc.accountNumber})`);
      return res.json({ success: true, account: acc });
    }
    res.status(404).json({ error: 'Account not found' });
  });

  // Trading Health APIs
  app.get('/api/v1/trading-health', (req, res) => {
    res.json(healthRecords);
  });

  app.post('/api/v1/trading-health/warning', (req, res) => {
    const { userId, note } = req.body;
    const record = healthRecords.find(h => h.userId === userId);
    if (record) {
      record.lastWarningSent = new Date().toISOString().replace('T', ' ').substring(0, 19);
      if (note) record.notes = note;
      logAudit('Owner', 'OWNER', 'RISK WARNING DISPATCHED', 'Trading Health', userId, `Dispatched warning notification to ${record.userName}. Note: ${note || 'Standard Warning'}`);
      return res.json({ success: true, record });
    }
    res.status(404).json({ error: 'Record not found' });
  });

  // Finance APIs
  app.get('/api/v1/finance/transactions', (req, res) => {
    res.json(transactions);
  });

  app.post('/api/v1/finance/transactions/:id/approve', (req, res) => {
    const tx = transactions.find(t => t.id === req.params.id);
    if (tx) {
      tx.status = 'APPROVED';
      tx.processedBy = req.body.adminName || 'Admin (Owner)';
      logAudit(tx.processedBy, 'FINANCE', `${tx.type} APPROVED`, 'Finance', tx.id, `Approved ${tx.type} of $${tx.amount} for user ID ${tx.userId}`);
      return res.json({ success: true, transaction: tx });
    }
    res.status(404).json({ error: 'Transaction not found' });
  });

  // Integrations & API Keys
  app.get('/api/v1/integrations', (req, res) => {
    res.json({ integrations, credentials, webhooks });
  });

  app.post('/api/v1/integrations/:id/test', (req, res) => {
    const integ = integrations.find(i => i.id === req.params.id);
    if (integ) {
      integ.lastSync = 'Just now';
      integ.status = 'CONNECTED';
      integ.latencyMs = Math.floor(Math.random() * 20) + 8;
      logAudit('Owner', 'OWNER', 'TEST CONNECTION', 'Integrations', integ.name, `Executed connection test for ${integ.name}. Result: SUCCESS (${integ.latencyMs}ms)`);
      return res.json({ success: true, status: 'CONNECTED', latencyMs: integ.latencyMs });
    }
    res.status(404).json({ error: 'Integration not found' });
  });

  app.post('/api/v1/integrations/credentials/rotate', (req, res) => {
    const { credId, newKeyHint } = req.body;
    const cred = credentials.find(c => c.id === credId);
    if (cred) {
      const newMask = `${cred.maskedKey.split('_')[0]}_sec_••••••••••••${Math.random().toString(36).substring(2, 6)}`;
      cred.maskedKey = newMask;
      cred.lastRotated = new Date().toISOString().replace('T', ' ').substring(0, 19);
      logAudit('Owner', 'OWNER', 'API KEY ROTATED', 'API Keys', cred.serviceName, `Rotated API Secret Key for ${cred.serviceName}. New key fingerprint applied.`);
      return res.json({ success: true, credential: cred });
    }
    res.status(404).json({ error: 'Credential not found' });
  });

  // Audit Logs
  app.get('/api/v1/audit-logs', (req, res) => {
    res.json(auditLogs);
  });

  // Settings
  app.get('/api/v1/settings', (req, res) => {
    res.json(settings);
  });

  app.put('/api/v1/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    logAudit('Owner', 'OWNER', 'SYSTEM SETTINGS UPDATED', 'Settings', 'GLOBAL', 'Updated global platform operational settings and risk parameters.');
    res.json({ success: true, settings });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Determine the absolute dist path safely across CJS bundle & process working directories
    const resolveDistPath = () => {
      const candidates = [
        path.join(process.cwd(), 'dist'),
        typeof __dirname !== 'undefined' ? __dirname : '',
        typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'dist') : '',
        path.resolve('dist'),
        process.cwd()
      ].filter(Boolean);

      for (const candidate of candidates) {
        if (fs.existsSync(path.join(candidate, 'index.html'))) {
          return candidate;
        }
      }
      return path.join(process.cwd(), 'dist');
    };

    const distPath = resolveDistPath();
    console.log(`[Production] Serving static files from: ${distPath}`);

    // Serve static assets
    app.use(express.static(distPath, {
      index: false,
      maxAge: '1d'
    }));

    // Safe SPA catch-all fallback for non-API GET requests (compatible across Express versions)
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        const indexPath = path.join(distPath, 'index.html');
        return res.sendFile(indexPath, (err) => {
          if (err) {
            console.error(`[Error] Failed to serve index.html for ${req.originalUrl}:`, err);
            if (!res.headersSent) {
              res.status(500).send('Frontend index.html build file not found.');
            }
          }
        });
      }
      next();
    });

    // 404 handler for unmatched API routes
    app.use('/api', (req, res) => {
      res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GoTrading Admin Server running on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
