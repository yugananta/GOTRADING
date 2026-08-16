const fs = require('fs');
const file = 'src/components/Journal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the corrupted syntax
content = content.replace(/{activeTab === 'ledger' {activeTab === 'history' && \({activeTab === 'history' && \( \(/g, "{activeTab === 'history' && (");
content = content.replace(/{activeTab === 'ledger' {activeTab === 'ledger' && \({activeTab === 'ledger' && \( \(/g, "{activeTab === 'ledger' && (");

// Let's just fix the specific syntax errors on lines 1065, 1096, 1236, 1512...
// It's probably easier to just replace all instances of `{activeTab === 'ledger' {activeTab === '...`
// Wait, I can just use a regex
content = content.replace(/{activeTab === '[^']+' {activeTab === '[^']+' && \({activeTab === '[^']+' && \( \(/g, match => {
    // extract the last one
    const m = match.match(/({activeTab === '[^']+' && \()/g);
    if (m && m.length > 0) return m[m.length - 1];
    return match;
});

// Also fix any other weird `activeTab ===` combinations
content = content.replace(/\{activeTab === '\w+' \{activeTab === '\w+' && \(\{activeTab === '\w+' && \( \(/g, match => {
    const m = match.match(/({activeTab === '\w+' && \()/);
    return m ? m[1] : match;
});

fs.writeFileSync(file, content, 'utf8');
