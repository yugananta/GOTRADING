const fs = require('fs');
let code = fs.readFileSync('src/components/GroupView.tsx', 'utf8');

// 1. Add state
const oldState = `  const [activeTab, setActiveTab] = useState<'city' | 'province'>(
    (initialGroupId && initialGroupId.includes('province')) ? 'province' : 'city'
  );`;
const newState = `  const [activeTab, setActiveTab] = useState<'city' | 'province'>(
    (initialGroupId && initialGroupId.includes('province')) ? 'province' : 'city'
  );
  const [feedFilter, setFeedFilter] = useState<'latest' | 'top' | 'milestones'>('latest');`;

if (!code.includes("const [feedFilter, setFeedFilter]")) {
  code = code.replace(oldState, newState);
}

// 2. Add Toggle UI
const oldFeedListComment = `{/* GROUP FEED LIST (Official Posts & Member Posts) */}
      <div className="space-y-4">`;

const newFeedListComment = `{/* FEED FILTER TOGGLE */}
      <div className="flex items-center border-b border-slate-100 pb-2 mb-4 sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-2 px-1 rounded-xl shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar w-full">
          <button 
            onClick={() => setFeedFilter('latest')}
            className={\`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap \${feedFilter === 'latest' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}
          >
            <Clock size={12} className="mr-1.5" />Latest Posts
          </button>
          <button 
            onClick={() => setFeedFilter('top')}
            className={\`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap \${feedFilter === 'top' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}
          >
            <TrendingUp size={12} className="mr-1.5" />Top Discussions
          </button>
          <button 
            onClick={() => setFeedFilter('milestones')}
            className={\`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap \${feedFilter === 'milestones' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}
          >
            <Sparkles size={12} className="mr-1.5" />Member Milestones
          </button>
        </div>
      </div>

      {/* GROUP FEED LIST (Official Posts & Member Posts) */}
      <div className="space-y-4">`;

code = code.replace(oldFeedListComment, newFeedListComment);


// 3. Filter/Sort logic
const oldFeedLogic = `        ) : (() => {
          const feedPosts = posts.filter(p => activePinnedPost ? p.id !== activePinnedPost.id : true);
          return feedPosts.length === 0 ? (`;

const newFeedLogic = `        ) : (() => {
          let feedPosts = posts.filter(p => activePinnedPost ? p.id !== activePinnedPost.id : true);
          
          if (feedFilter === 'top') {
            feedPosts = [...feedPosts].sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)));
          } else if (feedFilter === 'milestones') {
            feedPosts = feedPosts.filter(p => p.isOfficial || (p.content && p.content.toLowerCase().match(/milestone|achieve|target|profit|win|success|welcome|verified/)));
          } else {
            // latest is already sorted by date usually, assuming it's correctly sorted. If not we can sort by date here
            feedPosts = [...feedPosts].sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
          }

          return feedPosts.length === 0 ? (`;

code = code.replace(oldFeedLogic, newFeedLogic);

fs.writeFileSync('src/components/GroupView.tsx', code);
console.log("Patched GroupView filter logic");
