export class DrawdownRiskService {
  static calculateDrawdownRisk(userId: string, trades: any[], accountInfo: any) {
    
    // Sort trades by close time
    const sortedTrades = [...(trades || [])].sort((a, b) => {
      const timeA = a.closeTime ? new Date(a.closeTime).getTime() : 0;
      const timeB = b.closeTime ? new Date(b.closeTime).getTime() : 0;
      return timeA - timeB;
    });

    let peakEquity = accountInfo?.peak_equity || accountInfo?.peakEquity || 0;
    const balance = accountInfo?.balance || 0;
    let startingBalance = balance;
    
    // If no peak equity provided, try to estimate starting balance
    if (peakEquity <= 0) {
       const totalPnL = sortedTrades.reduce((acc, t) => acc + (t.pl || 0), 0);
       startingBalance = balance - totalPnL;
       if (startingBalance <= 0) startingBalance = balance > 0 ? balance : 1000;
       peakEquity = startingBalance;
    }

    let runningEquity = startingBalance;
    let maxDD = 0;
    const ddHistory: number[] = [];
    
    let previousDD = 0;
    const recentDDs: number[] = []; // for acceleration

    sortedTrades.forEach(t => {
      runningEquity += (t.pl || 0);
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      
      const ddAmount = peakEquity - runningEquity;
      const ddPercent = peakEquity > 0 ? (ddAmount / peakEquity) * 100 : 0;
      
      if (ddPercent > maxDD) {
        maxDD = ddPercent;
      }
      if (ddPercent > 0.1) {
         ddHistory.push(ddPercent);
      }
      recentDDs.push(ddPercent);
    });

    // Also account for current open positions if equity < balance
    const currentEquity = accountInfo?.equity || runningEquity;
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const currentDDAmount = peakEquity - currentEquity;
    const currentDrawdown = peakEquity > 0 ? Math.max(0, (currentDDAmount / peakEquity) * 100) : 0;
    
    if (currentDrawdown > maxDD) {
      maxDD = currentDrawdown;
    }
    recentDDs.push(currentDrawdown);
    if (currentDrawdown > 0.1) {
      ddHistory.push(currentDrawdown);
    }

    // Typical DD (Average of non-trivial DDs or 75th percentile)
    // Let's use average of top 50% DDs to represent "typical deep" or just median
    ddHistory.sort((a, b) => a - b);
    let medianDrawdown = 0;
    let typicalDrawdown = 0;
    
    if (ddHistory.length > 0) {
      const mid = Math.floor(ddHistory.length / 2);
      medianDrawdown = ddHistory.length % 2 !== 0 ? ddHistory[mid] : (ddHistory[mid - 1] + ddHistory[mid]) / 2;
      
      // Typical: average of DDs above median
      const upperHalf = ddHistory.slice(mid);
      typicalDrawdown = upperHalf.length > 0 ? upperHalf.reduce((a, b) => a + b, 0) / upperHalf.length : medianDrawdown;
    }

    const historicalMaxDrawdown = maxDD;

    // Confidence
    let confidence: 'INSUFFICIENT DATA' | 'EARLY BASELINE' | 'RELIABLE' = 'RELIABLE';
    if (sortedTrades.length < 10) confidence = 'INSUFFICIENT DATA';
    else if (sortedTrades.length < 30) confidence = 'EARLY BASELINE';

    if (confidence === 'INSUFFICIENT DATA') {
      typicalDrawdown = 0;
      medianDrawdown = 0;
      // historicalMaxDrawdown remains
    }

    // 1. Current Condition (Current DD vs Historical)
    let currentCondition: any = 'NORMAL';
    let currentConditionScore = 100;
    
    if (confidence === 'INSUFFICIENT DATA') {
      currentCondition = 'NORMAL';
      currentConditionScore = 50;
    } else {
      const diff = currentDrawdown - typicalDrawdown;
      if (currentDrawdown > historicalMaxDrawdown && currentDrawdown > typicalDrawdown + 5) {
         currentCondition = 'NEW HISTORICAL MAX';
         currentConditionScore = 0;
      } else if (currentDrawdown >= historicalMaxDrawdown * 0.9 && currentDrawdown > 5) {
         currentCondition = 'NEAR HISTORICAL MAX';
         currentConditionScore = 20;
      } else if (diff > 15) {
         currentCondition = 'EXTREMELY ABOVE NORMAL';
         currentConditionScore = 10;
      } else if (diff > 8) {
         currentCondition = 'SIGNIFICANTLY ABOVE NORMAL';
         currentConditionScore = 30;
      } else if (diff > 3) {
         currentCondition = 'SLIGHTLY ABOVE NORMAL';
         currentConditionScore = 60;
      } else if (currentDrawdown < typicalDrawdown - 2) {
         currentCondition = 'BELOW NORMAL';
         currentConditionScore = 100;
      } else {
         currentCondition = 'NORMAL';
         currentConditionScore = 80;
      }
    }

    // 2. Absolute Severity
    let absoluteSeverity: any = 'LOW';
    let absoluteSeverityScore = 100;
    
    if (currentDrawdown > 50) {
      absoluteSeverity = 'SEVERE / EXTREME';
      absoluteSeverityScore = 0;
    } else if (currentDrawdown > 30) {
      absoluteSeverity = 'EXTREME';
      absoluteSeverityScore = 10;
    } else if (currentDrawdown > 20) {
      absoluteSeverity = 'VERY HIGH';
      absoluteSeverityScore = 30;
    } else if (currentDrawdown > 10) {
      absoluteSeverity = 'HIGH';
      absoluteSeverityScore = 50;
    } else if (currentDrawdown > 5) {
      absoluteSeverity = 'MODERATE';
      absoluteSeverityScore = 75;
    } else {
      absoluteSeverity = 'LOW';
      absoluteSeverityScore = 100;
    }

    // 3. Historical Risk Profile
    let historicalRiskProfile: any = 'LOW EXPOSURE';
    let historicalRiskProfileScore = 100;

    if (confidence !== 'INSUFFICIENT DATA') {
      const riskMetric = (typicalDrawdown * 2 + historicalMaxDrawdown) / 3;
      if (riskMetric > 30) {
        historicalRiskProfile = 'EXTREME EXPOSURE';
        historicalRiskProfileScore = 10;
      } else if (riskMetric > 20) {
        historicalRiskProfile = 'VERY HIGH EXPOSURE';
        historicalRiskProfileScore = 30;
      } else if (riskMetric > 10) {
        historicalRiskProfile = 'HIGH EXPOSURE';
        historicalRiskProfileScore = 50;
      } else if (riskMetric > 5) {
        historicalRiskProfile = 'MODERATE EXPOSURE';
        historicalRiskProfileScore = 75;
      } else {
        historicalRiskProfile = 'LOW EXPOSURE';
        historicalRiskProfileScore = 100;
      }
    } else {
      historicalRiskProfileScore = 50;
      historicalRiskProfile = 'MODERATE EXPOSURE';
    }

    // 4. DD Acceleration (Trend)
    let drawdownTrend: any = 'STABLE';
    let accelerationScore = 80;
    
    if (recentDDs.length >= 5) {
      const last5 = recentDDs.slice(-5);
      const start = last5[0];
      const end = last5[4];
      const diff = end - start;
      if (diff > 5) {
         drawdownTrend = 'RAPIDLY INCREASING';
         accelerationScore = 20;
      } else if (diff > 2) {
         drawdownTrend = 'INCREASING';
         accelerationScore = 40;
      } else if (diff < -2) {
         drawdownTrend = 'IMPROVING';
         accelerationScore = 100;
      } else {
         drawdownTrend = 'STABLE';
         accelerationScore = 80;
      }
    } else {
      accelerationScore = 50;
    }

    // 5. DD Duration / Recovery
    let drawdownDurationMinutes = 0;
    let durationRecoveryScore = 80;
    // We can estimate duration by checking when equity was last at peak.
    let timeSincePeak = 0;
    if (sortedTrades.length > 0 && currentDrawdown > 1) {
        // find last time runningEquity >= peakEquity
        let lastPeakTime = new Date(sortedTrades[0].closeTime).getTime();
        let tempEq = startingBalance;
        let tempPeak = startingBalance;
        for (const t of sortedTrades) {
           tempEq += (t.pl || 0);
           if (tempEq >= tempPeak) {
             tempPeak = tempEq;
             lastPeakTime = new Date(t.closeTime).getTime();
           }
        }
        timeSincePeak = Date.now() - lastPeakTime;
        drawdownDurationMinutes = Math.floor(timeSincePeak / 60000);
        
        if (drawdownDurationMinutes > 7 * 24 * 60) durationRecoveryScore = 30; // > 1 week
        else if (drawdownDurationMinutes > 24 * 60) durationRecoveryScore = 50; // > 1 day
        else durationRecoveryScore = 70;
    }

    // Recovery Required
    const recoveryRequired = currentDrawdown >= 100 ? 0 : (currentDrawdown / (100 - currentDrawdown)) * 100;

    // Final Score Calculation
    // Weights: Current (30%), Absolute (30%), Historical (25%), Accel (10%), Duration (5%)
    let score = (
      currentConditionScore * 0.30 +
      absoluteSeverityScore * 0.30 +
      historicalRiskProfileScore * 0.25 +
      accelerationScore * 0.10 +
      durationRecoveryScore * 0.05
    );

    // Floor / Safety Override
    if (absoluteSeverity === 'SEVERE / EXTREME' || absoluteSeverity === 'EXTREME') {
      if (score > 39) score = 39; // Max HIGH RISK
    } else if (absoluteSeverity === 'VERY HIGH') {
      if (score > 59) score = 59; // Max ELEVATED RISK
    }
    
    // Category mapping
    let category: any = 'HEALTHY';
    if (score >= 90) category = 'VERY HEALTHY';
    else if (score >= 75) category = 'HEALTHY';
    else if (score >= 60) category = 'WATCH';
    else if (score >= 40) category = 'ELEVATED RISK';
    else if (score >= 20) category = 'HIGH RISK';
    else category = 'CRITICAL';

    // Explanation & Advice
    let explanation = '';
    let advice = '';

    if (currentCondition === 'NORMAL' || currentCondition === 'SLIGHTLY ABOVE NORMAL' || currentCondition === 'BELOW NORMAL') {
       if (absoluteSeverityScore < 60) {
          explanation = `Your current drawdown is not unusual compared with your historical trading pattern. However, the drawdown itself is very deep, and your historical data shows that deep drawdowns are a recurring characteristic of your trading.`;
          advice = `Your current DD may be consistent with your historical behavior, but the depth of your drawdowns suggests that risk exposure should be reviewed. Consider reviewing position sizing and overall risk exposure.`;
       } else {
          explanation = `Your current drawdown remains within your normal historical range and is relatively low.`;
          advice = `Maintain your current risk management practices. Your execution remains consistent.`;
       }
    } else {
       if (absoluteSeverityScore < 60) {
          explanation = `Your current drawdown is substantially higher than your historical range and has reached a very deep level.`;
          advice = `You are experiencing an unusually deep drawdown. It is highly recommended to pause trading, step back, and review your current strategy.`;
       } else {
          explanation = `Your current drawdown is significantly higher than your historical trading range, although not yet at critical absolute levels.`;
          advice = `Monitor your performance closely. You are deviating from your typical risk profile.`;
       }
    }

    return {
      score: Math.round(score),
      category,
      confidence,
      currentDrawdown,
      typicalDrawdown,
      medianDrawdown,
      historicalMaxDrawdown,
      currentCondition,
      absoluteSeverity,
      historicalRiskProfile,
      drawdownTrend,
      drawdownAcceleration: drawdownTrend, // alias
      drawdownDuration: drawdownDurationMinutes,
      recoveryRequired,
      explanation,
      advice,
      components: {
        currentConditionScore,
        absoluteSeverityScore,
        historicalRiskProfileScore,
        accelerationScore,
        durationRecoveryScore
      }
    };
  }
}
