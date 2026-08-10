import { IPostRepository } from './interfaces.ts';
import { Post } from '../types.ts';
import { isPostPinned, sortPostsWithPinnedFirst, serializePostContent, deserializePost } from '../utils/postUtils.ts';
import { supabase } from '../lib/supabaseClient.ts';

const FALLBACK_POSTS: Post[] = [];

export class PostRepository implements IPostRepository {
    async list(
        limit?: number, 
        groupId?: string, 
        search?: string, 
        tag?: string, 
        userId?: string,
        page?: number,
        pageSize?: number
    ): Promise<Post[]> {
        let remotePosts: Post[] = [];
        try {
            let query = supabase
                .from('Post')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (groupId) {
                query = query.eq('groupId', groupId);
            }

            if (userId) {
                query = query.eq('userId', userId);
            }

            if (search) {
                query = query.or(`content.ilike.%${search}%,authorName.ilike.%${search}%,authorUsername.ilike.%${search}%`);
            }

            if (tag) {
                query = query.contains('tags', [tag]);
            }
            
            const fetchLimit = (groupId === null || groupId === 'null') ? Math.max((limit || 50) * 3, 300) : (limit || 150);
            
            if (page !== undefined && groupId !== null && groupId !== 'null') {
                const size = pageSize !== undefined ? pageSize : 15;
                const from = page * size;
                const to = from + size - 1;
                query = query.range(from, to);
            } else {
                query = query.limit(fetchLimit);
            }
            
            const { data, error } = await query;
            if (!error && data) {
                remotePosts = data.map(deserializePost);
            }
        } catch (e: any) {
            console.warn('Supabase list posts warning:', e?.message || e);
        }

        // Merge remote posts and fallback posts if empty
        const map = new Map<string, Post>();
        
        // Add remote posts first
        remotePosts.forEach(p => map.set(p.id, p));
        // Add fallback posts if map is empty
        if (map.size === 0) {
            FALLBACK_POSTS.forEach(p => map.set(p.id, p));
        }

        let results = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (groupId) {
            results = results.filter(p => p.groupId === groupId);
        } else if (groupId === null || groupId === 'null') {
            results = results.filter(p => !p.groupId);
        }

        if (userId) {
            results = results.filter(p => p.userId === userId);
        }

        if (search) {
            const q = search.toLowerCase();
            results = results.filter(p => 
                p.content.toLowerCase().includes(q) || 
                p.authorName.toLowerCase().includes(q) || 
                p.authorUsername.toLowerCase().includes(q)
            );
        }

        if (tag) {
            results = results.filter(p => p.tags && p.tags.includes(tag));
        }

        if (page !== undefined) {
            const size = pageSize !== undefined ? pageSize : 15;
            const from = page * size;
            results = results.slice(from, from + size);
        } else if (limit) {
            results = results.slice(0, limit);
        }

        return results;
    }

    async create(post: Omit<Post, 'id' | 'timestamp'>): Promise<Post> {
        const timestamp = new Date().toISOString();
        const id = "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        
        const newPost: Post = {
            id,
            userId: post.userId,
            authorName: post.authorName,
            authorUsername: post.authorUsername,
            authorAvatar: post.authorAvatar,
            authorRole: post.authorRole,
            authorCity: post.authorCity,
            authorCountry: post.authorCountry,
            authorVerified: post.authorVerified || false,
            content: post.content || '',
            videoUrl: post.videoUrl,
            images: post.images,
            marketBias: post.marketBias,
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            bookmarksCount: post.bookmarksCount || 0,
            repostsCount: post.repostsCount || 0,
            likedBy: post.likedBy || [],
            bookmarkedBy: post.bookmarkedBy || [],
            repostedBy: post.repostedBy || [],
            timestamp,
            tags: post.tags || [],
            chart: post.chart,
            groupId: post.groupId,
            isOfficial: post.isOfficial || false,
            isPinned: post.isPinned || false,
            isRepost: post.isRepost || false,
            originalAuthorName: (post as any).originalAuthorName
        };

        try {
            const dbRecord: any = { ...newPost };
            const { data, error } = await supabase
                .from('Post')
                .insert([dbRecord])
                .select()
                .single();
            
            if (!error && data) {
                return deserializePost(data);
            }
        } catch (e: any) {
            console.warn('Supabase create post fallback:', e?.message || e);
        }

        return newPost;
    }

    async findById(id: string): Promise<Post | null> {
        const fallback = FALLBACK_POSTS.find(p => p.id === id);
        if (fallback) return fallback;

        try {
            const { data, error } = await supabase
                .from('Post')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            
            if (!error && data) return deserializePost(data);
        } catch (e: any) {
            // ignore
        }
        return null;
    }

    async delete(id: string): Promise<void> {
        try {
            await supabase
                .from('Post')
                .delete()
                .eq('id', id);
        } catch (e: any) {
            // ignore
        }
    }

    async update(post: Post): Promise<void> {
        try {
            const dbUpdate = {
                userId: post.userId,
                authorName: post.authorName,
                authorUsername: post.authorUsername,
                authorAvatar: post.authorAvatar,
                authorRole: post.authorRole,
                authorCity: post.authorCity,
                authorCountry: post.authorCountry,
                authorVerified: post.authorVerified,
                content: post.content || '',
                videoUrl: post.videoUrl || null,
                images: post.images || [],
                marketBias: post.marketBias || null,
                likesCount: post.likesCount,
                commentsCount: post.commentsCount,
                bookmarksCount: post.bookmarksCount,
                repostsCount: post.repostsCount,
                likedBy: post.likedBy,
                bookmarkedBy: post.bookmarkedBy,
                repostedBy: post.repostedBy,
                timestamp: post.timestamp,
                tags: post.tags,
                chart: post.chart,
                groupId: post.groupId,
                isOfficial: post.isOfficial,
                isPinned: post.isPinned,
                isRepost: post.isRepost
            };

            await supabase
                .from('Post')
                .update(dbUpdate)
                .eq('id', post.id);
        } catch (e: any) {
            // ignore
        }
    }

    async filter(predicate: (post: Post) => boolean): Promise<Post[]> {
        const posts = await this.list();
        return posts.filter(predicate);
    }
}
