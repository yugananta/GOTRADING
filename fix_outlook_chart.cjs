const fs = require('fs');

let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

// 1. Add MemoizedChart component definition right before `export const Outlook = ...`
const memoizedChartDef = `
const MemoizedChart = React.memo(({ symbol }: { symbol: string }) => {
  return (
    <AdvancedRealTimeChart 
      theme="dark" 
      symbol={symbol} 
      autosize 
      allow_symbol_change={false}
      hide_top_toolbar={true}
      hide_legend={false}
      disabled_features={["header_symbol_search", "header_compare"]}
    />
  );
});

export const Outlook: React.FC = () => {`;

code = code.replace('export const Outlook: React.FC = () => {', memoizedChartDef);

// 2. Replace the actual usage
const oldChart = /<AdvancedRealTimeChart[\s\S]*?\/>/;
const newChart = '<MemoizedChart symbol={selectedPair} />';

code = code.replace(oldChart, newChart);

fs.writeFileSync('src/components/Outlook.tsx', code);
console.log('Fixed chart memoization');
