import { Post } from '../types.ts';

export function serializePostContent(content: string, images: string[] | undefined, marketBias: string | undefined): string {
    return content;
}

// Helper to deserialize metadata from content field
export function deserializePost(dbPost: any): Post {
    if (!dbPost) return dbPost;
    const post = { ...dbPost } as Post;
    const rawContent = dbPost.content || '';
    const parts = rawContent.split('\n\n__METADATA__=');
    if (parts.length > 1) {
        const content = parts.slice(0, -1).join('\n\n__METADATA__=');
        try {
            const metadata = JSON.parse(parts[parts.length - 1]);
            post.content = content;
            post.images = metadata.images || dbPost.images || [];
            post.marketBias = metadata.marketBias || dbPost.marketBias || null;
        } catch {
            post.images = dbPost.images || [];
            post.marketBias = dbPost.marketBias || null;
        }
    } else {
        post.images = dbPost.images || [];
        post.marketBias = dbPost.marketBias || null;
    }

    // Safety check: filter out giant base64 data URLs (> 100MB) that exceed browser capacities
    if (Array.isArray(post.images)) {
        post.images = post.images.filter(img => typeof img === 'string' && img.length < 100000000);
    }
    if (post.videoUrl && post.videoUrl.startsWith('data:') && post.videoUrl.length > 100000000) {
        post.videoUrl = undefined;
    }

    return post;
}

/**
 * Helper function to identify pinned posts based on 'pinned', 'isPinned', 'is_pinned', or 'isOfficial'
 * boolean columns from the Supabase posts table.
 */
export function isPostPinned(post: any): boolean {
  if (!post) return false;
  return Boolean(
    post.pinned === true ||
    post.isPinned === true ||
    post.is_pinned === true ||
    post.isOfficial === true
  );
}

/**
 * Sorts an array of posts so that pinned posts appear prioritized at the top of the feed,
 * followed by newest posts ordered by timestamp descending.
 */
export function sortPostsWithPinnedFirst<T extends Record<string, any>>(posts: T[]): T[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => {
    const aPinned = isPostPinned(a);
    const bPinned = isPostPinned(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
}
