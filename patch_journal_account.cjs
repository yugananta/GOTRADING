const fs = require('fs');
const file = 'src/components/Journal.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to add state for account info
const stateInsertion = `  const [activeAccountInfo, setActiveAccountInfo] = useState<any>(null);`;
content = content.replace("const [trades, setTrades] = useState<any[]>([]);", `${stateInsertion}\n  const [trades, setTrades] = useState<any[]>([]);`);

// Inside fetchTrades or a new fetchAccountInfo
const fetchTradesString = `  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      const res = await apiFetch('/api/metatrader/trades');`;
      
const fetchTradesReplacement = `  const fetchAccountInfo = async () => {
    try {
      const res = await apiFetch('/api/metatrader/account');
      if (res.ok) {
        const data = await res.json();
        const accs = data.accounts || (data.account ? [data.account] : (data.data?.accounts || (data.data?.account ? [data.data.account] : [])));
        if (accs && accs.length > 0) {
          setActiveAccountInfo(accs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      fetchAccountInfo(); // Call this here for now
      const res = await apiFetch('/api/metatrader/trades');`;

content = content.replace(fetchTradesString, fetchTradesReplacement);

fs.writeFileSync(file, content, 'utf8');
