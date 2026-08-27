const fs = require('fs');
let code = fs.readFileSync('src/components/AppContext.tsx', 'utf8');

if (!code.includes("import { getPostsFromCache, savePostsToCache }")) {
  code = code.replace(
    "import { apiFetch, isJsonResponse } from '../utils/apiFetch';",
    "import { apiFetch, isJsonResponse } from '../utils/apiFetch';\nimport { getPostsFromCache, savePostsToCache } from '../utils/cacheDb';"
  );
}

// 1. Remove localStorage synchronous loading
const oldUseStatePosts = `  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const cached = localStorage.getItem('tarapti_cached_posts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });`;

const newUseStatePosts = `  const [posts, setPosts] = useState<Post[]>([]);

  // Asynchronously load cached posts on mount
  useEffect(() => {
    getPostsFromCache().then(cached => {
      if (cached && cached.length > 0) {
        setPosts(prev => prev.length === 0 ? cached : prev);
      }
    });
  }, []);`;

code = code.replace(oldUseStatePosts, newUseStatePosts);

// 2. Change localStorage saving to indexedDB in fetchPosts
const oldFetchTry = `      if (isJsonResponse(res)) {
        const data = await res.json();
        setPosts(data);
        try {
          localStorage.setItem('tarapti_cached_posts', JSON.stringify(data));
        } catch (err) {
          console.warn("Failed to cache posts in localStorage:", err);
        }
      }`;

const newFetchTry = `      if (isJsonResponse(res)) {
        const data = await res.json();
        setPosts(data);
        savePostsToCache(data);
      }`;

code = code.replace(oldFetchTry, newFetchTry);

fs.writeFileSync('src/components/AppContext.tsx', code);
console.log("Patched AppContext.tsx for IndexedDB caching");
