import fs from 'fs';
import path from 'path';
import { NotificationRepository } from '../repositories/NotificationRepository.ts';

const STATE_FILE = path.join(process.cwd(), 'data', 'drawdown_notification_state.json');

interface RiskState {
  category: string;
  score: number;
  currentDrawdown: number;
  historicalMaxDrawdown: number;
  lastNotifiedAt: number;
  lastNotifiedCategory: string;
}

export class DrawdownNotificationService {
  private static getStateMap(): Record<string, RiskState> {
    try {
       if (fs.existsSync(STATE_FILE)) {
         return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
       }
    } catch (e) {}
    return {};
  }

  private static saveStateMap(map: Record<string, RiskState>) {
    try {
      if (!fs.existsSync(path.dirname(STATE_FILE))) {
         fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(map, null, 2));
    } catch (e) {}
  }

  static async evaluateDrawdownNotification(userId: string, currentAssessment: any, accountRules: any = null) {
    const map = this.getStateMap();
    const previousState = map[userId] || {
      category: 'HEALTHY',
      score: 100,
      currentDrawdown: 0,
      historicalMaxDrawdown: 0,
      lastNotifiedAt: 0,
      lastNotifiedCategory: 'HEALTHY'
    };

    const now = Date.now();
    const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours

    let shouldNotify = false;
    let priority = 99;
    let alertType = 'DRAWDOWN_RISK';
    let severity = 'LOW';
    let title = '';
    let body = '';
    let cta = 'Review Analysis';
    let triggerReason = '';

    // EVENT F: Account Maximum DD Approach (P0)
    if (accountRules && accountRules.maxDrawdown && currentAssessment.currentDrawdown >= (accountRules.maxDrawdown * 0.8)) {
       // Approach or exceed
       shouldNotify = true;
       priority = 0;
       alertType = 'ACCOUNT_RULE';
       severity = 'CRITICAL';
       title = '🔴 Account Drawdown Warning';
       body = `Your drawdown is ${currentAssessment.currentDrawdown.toFixed(1)}% against the account's ${accountRules.maxDrawdown}% maximum drawdown rule.`;
       cta = 'Review Account Risk';
       triggerReason = 'ACCOUNT_MAX_DD_APPROACH';
    }

    // EVENT D: Extreme Absolute Drawdown (P4)
    if (priority > 4 && currentAssessment.absoluteSeverity === 'SEVERE / EXTREME') {
        shouldNotify = true;
        priority = 4;
        severity = 'CRITICAL';
        title = '🔴 High Drawdown';
        if (['NORMAL', 'BELOW NORMAL', 'SLIGHTLY ABOVE NORMAL'].includes(currentAssessment.currentCondition)) {
           body = `Your current drawdown is ${currentAssessment.currentDrawdown.toFixed(1)}%. While this is within your historical pattern, the drawdown itself is very deep.`;
        } else {
           body = `Your current drawdown has reached ${currentAssessment.currentDrawdown.toFixed(1)}%. This is a very deep drawdown level.`;
        }
        triggerReason = 'EXTREME_ABSOLUTE_DRAWDOWN';
    }

    // EVENT C: Rapid Drawdown Deterioration (P3)
    if (priority > 3 && currentAssessment.drawdownAcceleration === 'RAPIDLY INCREASING') {
        shouldNotify = true;
        priority = 3;
        severity = 'HIGH';
        title = '🔴 Rapid Drawdown Increase';
        body = `Your drawdown has increased rapidly and is now significantly above your normal trading range.`;
        triggerReason = 'RAPID_DRAWDOWN_ACCELERATION';
    }

    // EVENT B: New Historical Drawdown High (P2)
    if (priority > 2 && currentAssessment.currentCondition === 'NEW HISTORICAL MAX' && currentAssessment.currentDrawdown > previousState.historicalMaxDrawdown) {
       // Only if it's a meaningful DD (e.g. > 5%) to avoid noise on small accounts
       if (currentAssessment.currentDrawdown > 5) {
         shouldNotify = true;
         priority = 2;
         severity = 'HIGH';
         title = '🔴 New Drawdown High';
         body = `Your current drawdown of ${currentAssessment.currentDrawdown.toFixed(1)}% is now higher than your previous historical maximum of ${previousState.historicalMaxDrawdown > 0 ? previousState.historicalMaxDrawdown.toFixed(1) : currentAssessment.typicalDrawdown.toFixed(1)}%.`;
         triggerReason = 'NEW_HISTORICAL_MAX';
       }
    }

    // EVENT E: Drawdown + Abnormal Risk Behavior (P5) (Placeholder for future risk expansion, skipped for now as we don't have position size data here)
    
    // EVENT A: Risk Category Deterioration (P6)
    // Categories: VERY HEALTHY, HEALTHY, WATCH, ELEVATED RISK, HIGH RISK, CRITICAL
    const catSeverity = {
       'VERY HEALTHY': 0, 'HEALTHY': 1, 'WATCH': 2, 'ELEVATED RISK': 3, 'HIGH RISK': 4, 'CRITICAL': 5
    };
    
    const prevCatIndex = catSeverity[previousState.lastNotifiedCategory as keyof typeof catSeverity] || 0;
    const currCatIndex = catSeverity[currentAssessment.category as keyof typeof catSeverity] || 0;

    if (priority > 6 && currCatIndex > prevCatIndex) {
        shouldNotify = true;
        priority = 6;
        severity = currentAssessment.category === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
        
        if (currCatIndex >= 3) {
           title = '⚠️ Drawdown Risk Increased';
           body = `Your current drawdown risk category has deteriorated to ${currentAssessment.category}. Your drawdown is significantly above your historical range.`;
        } else {
           title = '⚠️ Drawdown Risk Alert';
           body = `Your current drawdown risk category has shifted to ${currentAssessment.category}.`;
        }
        triggerReason = 'RISK_CATEGORY_DETERIORATION';
    }

    // Cooldown Check
    let actuallyNotify = false;
    if (shouldNotify) {
       if (now - previousState.lastNotifiedAt > cooldownMs) {
          actuallyNotify = true;
       } else {
          // Exception: Material escalation (e.g., P0 or P1, or category worsened)
          if (currCatIndex > prevCatIndex && currCatIndex >= 3) {
             actuallyNotify = true;
          } else if (priority <= 2) {
             // Allow high priority overrides if current DD is noticeably higher than last notified
             if (currentAssessment.currentDrawdown > previousState.currentDrawdown + 2) {
                actuallyNotify = true;
             }
          }
       }
    }

    if (actuallyNotify) {
       const notifRepo = new NotificationRepository();
       await notifRepo.create({
          toUserId: userId,
          fromUserId: 'system',
          fromUserName: 'Risk Engine',
          fromUserAvatar: priority <= 2 ? '🔴' : '⚠️',
          type: 'drawdown_risk',
          message: `${title}: ${body}`
       });

       previousState.lastNotifiedAt = now;
       previousState.lastNotifiedCategory = currentAssessment.category;
       previousState.currentDrawdown = currentAssessment.currentDrawdown;
    }

    // Always update the tracking state for historical max and current category
    if (currentAssessment.currentDrawdown > previousState.historicalMaxDrawdown) {
       previousState.historicalMaxDrawdown = currentAssessment.currentDrawdown;
    }
    
    // Recovery reset logic
    if (!actuallyNotify && currCatIndex < prevCatIndex) {
       // If the current category is better than the last notified category, reset the lastNotifiedCategory
       // so that future deteriorations will trigger normally.
       previousState.lastNotifiedCategory = currentAssessment.category;
       
       // Also reset currentDrawdown tracker so that if they plunge again, it counts.
       previousState.currentDrawdown = currentAssessment.currentDrawdown;
    }
    
    previousState.category = currentAssessment.category;
    previousState.score = currentAssessment.score;

    map[userId] = previousState;
    this.saveStateMap(map);

    return {
       shouldNotify: actuallyNotify,
       alertType,
       priority,
       severity,
       title,
       body,
       cta,
       previousState: previousState.category,
       currentState: currentAssessment.category,
       triggerReason,
       cooldownUntil: previousState.lastNotifiedAt + cooldownMs
    };
  }
}
