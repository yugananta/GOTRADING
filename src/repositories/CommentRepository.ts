import { ICommentRepository } from './interfaces.ts';
import { Comment } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class CommentRepository implements ICommentRepository {
    async listByPostId(postId: string): Promise<Comment[]> {
        try {
            const { data, error } = await supabase
                .from('Comment')
                .select('*')
                .eq('postId', postId)
                .order('timestamp', { ascending: true });
            if (error) throw error;
            return (data || []) as Comment[];
        } catch (e: any) {
            console.error('Failed to list comments from Supabase:', e?.message || e);
            return [];
        }
    }

    async list(): Promise<Comment[]> {
        try {
            const { data, error } = await supabase
                .from('Comment')
                .select('*');
            if (error) throw error;
            return (data || []) as Comment[];
        } catch (e: any) {
            console.error('Failed to list all comments from Supabase:', e?.message || e);
            return [];
        }
    }

    async create(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
        const timestamp = new Date().toISOString();
        const id = "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        
        // Explicitly map only the fields that exist in the database schema
        const dbRecord = {
            id,
            postId: comment.postId,
            userId: comment.userId,
            authorName: comment.authorName,
            authorUsername: comment.authorUsername,
            authorAvatar: comment.authorAvatar,
            content: comment.content,
            timestamp
        };

        try {
            console.log(`Inserting comment into Supabase: ${JSON.stringify(dbRecord)}`);
            const { data, error } = await supabase
                .from('Comment')
                .insert([dbRecord])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error inserting comment:', error);
                throw error;
            }
            console.log('Comment inserted into Supabase successfully:', data);
            return data as Comment;
        } catch (e: any) {
            console.warn('Failed to create comment in Supabase:', e?.message || e);
            throw e;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('Comment')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (e: any) {
            console.error('Failed to delete comment in Supabase:', e?.message || e);
        }
    }
}
