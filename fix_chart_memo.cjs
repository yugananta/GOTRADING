const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

const badMemo = `const MemoizedChart = React.memo(({ symbol }: { symbol: string }) => {
  return (
    <MemoizedChart symbol={selectedPair} />
  );
});`;

const goodMemo = `const MemoizedChart = React.memo(({ symbol }: { symbol: string }) => {
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
});`;

code = code.replace(badMemo, goodMemo);
fs.writeFileSync('src/components/Outlook.tsx', code);
console.log('Fixed MemoizedChart definition');
