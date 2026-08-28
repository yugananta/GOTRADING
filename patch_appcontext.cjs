const fs = require('fs');
let code = fs.readFileSync('src/components/AppContext.tsx', 'utf8');

// 1. Add to interface
code = code.replace(
  "  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;\n  loadingPosts: boolean;",
  "  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;\n  newPostsQueue: Post[];\n  flushNewPostsQueue: () => void;\n  loadingPosts: boolean;"
);

// 2. Add state and function
const stateInject = `  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostsQueue, setNewPostsQueue] = useState<Post[]>([]);
  const flushNewPostsQueue = useCallback(() => {
    setPosts(prev => {
      const filteredQueue = newPostsQueue.filter(newP => !prev.some(p => p.id === newP.id));
      return [...filteredQueue, ...prev].slice(0, 200);
    });
    setNewPostsQueue([]);
  }, [newPostsQueue]);`;

code = code.replace("  const [loadingPosts, setLoadingPosts] = useState(false);", stateInject);

// 3. Update useEffect
const oldEffect = `  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Post' },
        (payload) => {
          const newPost = deserializePost(payload.new);
          
          // CRITICAL: Filter out group-specific posts from the main public feed
          if (newPost.groupId) return;

          setPosts(prev => {
            // 1. If we already have this post ID, don't add it again
            if (prev.some(p => p.id === newPost.id)) return prev;
            
            // 2. Handle optimistic update overlap: 
            // If there's an optimistic post from this user with same content, 
            // the realtime event might have arrived before the API response.
            // We'll remove the optimistic one to let the real one take its place.
            const filtered = prev.filter(p => {
              const isMatch = p.isSending && 
                              p.userId === newPost.userId && 
                              p.content === newPost.content;
              return !isMatch;
            });

            // Keep main feed at a reasonable size
            return [newPost, ...filtered].slice(0, 200);
          });
        }
      )`;

const newEffect = `  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Post' },
        (payload) => {
          const newPost = deserializePost(payload.new);
          
          if (newPost.groupId) return;

          // If current user created it, update directly (optimistic swap)
          if (currentUser?.id && newPost.userId === currentUser.id) {
            setPosts(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              const filtered = prev.filter(p => !(p.isSending && p.userId === newPost.userId && p.content === newPost.content));
              return [newPost, ...filtered].slice(0, 200);
            });
          } else {
            // Someone else posted! Queue it up.
            setNewPostsQueue(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [newPost, ...prev];
            });
          }
        }
      )`;

code = code.replace(oldEffect, newEffect);

// 4. Update dependencies
code = code.replace("    };\n  }, []);", "    };\n  }, [currentUser?.id]);");

// 5. Add to return value
code = code.replace(
  "      fetchPosts,\n      stories,",
  "      fetchPosts,\n      newPostsQueue,\n      flushNewPostsQueue,\n      stories,"
);

fs.writeFileSync('src/components/AppContext.tsx', code);
console.log("Patched AppContext.tsx");
