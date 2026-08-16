const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add to destructuring
code = code.replace(
  "    fetchPosts, \n    notifications,",
  "    fetchPosts, \n    newPostsQueue,\n    flushNewPostsQueue,\n    notifications,"
);

// 2. Add the pill UI
const feedItems = `{/* Feed items list */}`;
const pillUI = `{/* Feed items list */}
              <AnimatePresence>
                {newPostsQueue && newPostsQueue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="sticky top-0 z-10 flex justify-center pb-3"
                  >
                    <button
                      onClick={flushNewPostsQueue}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-lg shadow-indigo-600/30 text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition active:scale-95 cursor-pointer filter drop-shadow"
                    >
                      <ArrowUp size={16} />
                      {newPostsQueue.length} {t('common.post.newPosts', 'Postingan Baru')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>`;

code = code.replace(feedItems, pillUI);

// 3. Import ArrowUp
if (!code.includes("ArrowUp")) {
  code = code.replace("Search, TrendingUp, Filter,", "Search, TrendingUp, Filter, ArrowUp,");
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
