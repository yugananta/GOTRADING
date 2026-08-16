import { IStoryRepository } from './interfaces.ts';
import { Story } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class StoryRepository implements IStoryRepository {
    private static memoryStories: Story[] = [];
    private static storyViewersMap: Record<string, { userId: string; viewedAt: string }[]> = {};

    async getViewers(storyId: string): Promise<{ userId: string; viewedAt: string }[]> {
        return StoryRepository.storyViewersMap[storyId] || [];
    }

    async recordView(storyId: string, viewerUserId: string): Promise<{ userId: string; viewedAt: string }[]> {
        if (!StoryRepository.storyViewersMap[storyId]) {
            StoryRepository.storyViewersMap[storyId] = [];
        }
        const existing = StoryRepository.storyViewersMap[storyId].find(v => v.userId === viewerUserId);
        if (!existing) {
            StoryRepository.storyViewersMap[storyId].push({
                userId: viewerUserId,
                viewedAt: new Date().toISOString()
            });
        }
        const memStory = StoryRepository.memoryStories.find(s => s.id === storyId);
        if (memStory) {
            memStory.viewed = true;
        }
        return StoryRepository.storyViewersMap[storyId];
    }

    async list(): Promise<Story[]> {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from('Story')
                .select('*')
                .gte('timestamp', twentyFourHoursAgo)
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e: any) {
            // Gracefully fall back to memory stories if table is missing or query fails
            return StoryRepository.memoryStories;
        }
    }

    async create(story: Omit<Story, 'id' | 'timestamp'>): Promise<Story> {
        const timestamp = new Date().toISOString();
        const id = "story_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        
        const dbRecord: Story = {
            id,
            userId: story.userId,
            imageUrl: story.imageUrl,
            timestamp,
            viewed: false
        };

        try {
            const { data, error } = await supabase
                .from('Story')
                .insert([dbRecord])
                .select()
                .single();
            
            if (error) throw error;
            StoryRepository.memoryStories.unshift(data);
            return data;
        } catch (e: any) {
            // Fall back to memory store on Supabase insert error
            StoryRepository.memoryStories.unshift(dbRecord);
            return dbRecord;
        }
    }

    async delete(id: string): Promise<void> {
        StoryRepository.memoryStories = StoryRepository.memoryStories.filter(s => s.id !== id);
        try {
            await supabase
                .from('Story')
                .delete()
                .eq('id', id);
        } catch (e: any) {
            // Ignore if table does not exist
        }
    }

    async deleteByUserId(userId: string): Promise<void> {
        StoryRepository.memoryStories = StoryRepository.memoryStories.filter(s => s.userId !== userId);
        try {
            await supabase
                .from('Story')
                .delete()
                .eq('userId', userId);
        } catch (e: any) {
            // Ignore
        }
    }
}
