import { IFollowRepository } from './interfaces.ts';
import { supabase } from '../lib/supabaseClient.ts';
import crypto from 'crypto';

export class FollowRepository implements IFollowRepository {
    private static memoryFollows: { followerId: string; followingId: string }[] = [];

    async listFollowers(userId: string): Promise<string[]> {
        const followers = new Set<string>();
        // Add memory follows
        FollowRepository.memoryFollows
            .filter(f => f.followingId === userId)
            .forEach(f => followers.add(f.followerId));

        try {
            let { data, error } = await supabase
                .from('Follow')
                .select('followerId')
                .eq('followingId', userId);
            
            if (error || !data) {
                const res = await supabase
                    .from('follows')
                    .select('follower_id, followerId')
                    .or(`following_id.eq.${userId},followingId.eq.${userId}`);
                if (!res.error && res.data) {
                    res.data.forEach((f: any) => {
                        const fid = f.followerId || f.follower_id;
                        if (fid) followers.add(fid);
                    });
                }
            } else {
                data.forEach((f: any) => {
                    const fid = f.followerId || f.follower_id;
                    if (fid) followers.add(fid);
                });
            }
        } catch (e: any) {
            console.error('Failed to list followers from Supabase:', e?.message || e);
        }
        return Array.from(followers);
    }

    async listFollowing(userId: string): Promise<string[]> {
        const following = new Set<string>();
        // Add memory follows
        FollowRepository.memoryFollows
            .filter(f => f.followerId === userId)
            .forEach(f => following.add(f.followingId));

        try {
            let { data, error } = await supabase
                .from('Follow')
                .select('followingId')
                .eq('followerId', userId);

            if (error || !data) {
                const res = await supabase
                    .from('follows')
                    .select('following_id, followingId')
                    .or(`follower_id.eq.${userId},followerId.eq.${userId}`);
                if (!res.error && res.data) {
                    res.data.forEach((f: any) => {
                        const fid = f.followingId || f.following_id;
                        if (fid) following.add(fid);
                    });
                }
            } else {
                data.forEach((f: any) => {
                    const fid = f.followingId || f.following_id;
                    if (fid) following.add(fid);
                });
            }
        } catch (e: any) {
            console.error('Failed to list following from Supabase:', e?.message || e);
        }
        return Array.from(following);
    }

    async list(): Promise<{followerId: string, followingId: string}[]> {
        const listMap = new Map<string, {followerId: string, followingId: string}>();
        // Add memory follows
        FollowRepository.memoryFollows.forEach(f => {
            listMap.set(`${f.followerId}_${f.followingId}`, f);
        });

        try {
            let { data, error } = await supabase
                .from('Follow')
                .select('followerId, followingId');

            if (error || !data) {
                const res = await supabase
                    .from('follows')
                    .select('follower_id, following_id, followerId, followingId');
                if (!res.error && res.data) {
                    res.data.forEach((f: any) => {
                        const r = {
                            followerId: f.followerId || f.follower_id,
                            followingId: f.followingId || f.following_id
                        };
                        if (r.followerId && r.followingId) {
                            listMap.set(`${r.followerId}_${r.followingId}`, r);
                        }
                    });
                }
            } else {
                data.forEach((f: any) => {
                    const r = {
                        followerId: f.followerId || f.follower_id,
                        followingId: f.followingId || f.following_id
                    };
                    if (r.followerId && r.followingId) {
                        listMap.set(`${r.followerId}_${r.followingId}`, r);
                    }
                });
            }
        } catch (e: any) {
            console.error('Failed to list follows from Supabase:', e?.message || e);
        }
        return Array.from(listMap.values());
    }

    async follow(followerId: string, followingId: string): Promise<void> {
        // Add to memory
        if (!FollowRepository.memoryFollows.some(f => f.followerId === followerId && f.followingId === followingId)) {
            FollowRepository.memoryFollows.push({ followerId, followingId });
        }

        try {
            const followId = crypto.randomUUID();
            let { error } = await supabase
                .from('Follow')
                .insert({ id: followId, followerId, followingId });
            
            if (error) {
                const res = await supabase
                    .from('follows')
                    .insert({ id: followId, follower_id: followerId, following_id: followingId, followerId, followingId });
                error = res.error;
            }
            if (error) throw error;
        } catch (e: any) {
            console.error('Failed to follow in Supabase:', e?.message || e);
        }
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        // Remove from memory
        FollowRepository.memoryFollows = FollowRepository.memoryFollows.filter(
            f => !(f.followerId === followerId && f.followingId === followingId)
        );

        try {
            let { error } = await supabase
                .from('Follow')
                .delete()
                .eq('followerId', followerId)
                .eq('followingId', followingId);

            if (error) {
                const res1 = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', followerId)
                    .eq('following_id', followingId);
                const res2 = await supabase
                    .from('follows')
                    .delete()
                    .eq('followerId', followerId)
                    .eq('followingId', followingId);
                if (res1.error && res2.error) error = res1.error;
            }
            if (error) throw error;
        } catch (e: any) {
            console.error('Failed to unfollow in Supabase:', e?.message || e);
        }
    }
}

