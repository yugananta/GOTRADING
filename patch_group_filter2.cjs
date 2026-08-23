const fs = require('fs');
let code = fs.readFileSync('src/components/GroupView.tsx', 'utf8');

const oldState = `  const [activeTab, setActiveTab] = useState<'city' | 'province'>(
    initialGroupId?.startsWith('group_province_') ? 'province' : 'city'
  );`;

const newState = `  const [activeTab, setActiveTab] = useState<'city' | 'province'>(
    initialGroupId?.startsWith('group_province_') ? 'province' : 'city'
  );
  const [feedFilter, setFeedFilter] = useState<'latest' | 'top' | 'milestones'>('latest');`;

code = code.replace(oldState, newState);

const oldLatestSort = `            feedPosts = [...feedPosts].sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());`;
const newLatestSort = `            // feedPosts already sorted originally`;
code = code.replace(oldLatestSort, newLatestSort);

fs.writeFileSync('src/components/GroupView.tsx', code);
console.log("Patched GroupView state");
