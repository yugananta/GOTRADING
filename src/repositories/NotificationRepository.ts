import { INotificationRepository } from './interfaces.ts';
import { Notification } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class NotificationRepository implements INotificationRepository {
    private static memoryNotifications: Notification[] = [];

    async list(): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .order('timestamp', { ascending: false });
            if (!error && data) {
                // Sync memory cache snapshot with DB
                NotificationRepository.memoryNotifications = data as Notification[];
                return data as Notification[];
            }
        } catch (e) {
            console.error('Failed to list notifications from Supabase, using memory fallback:', e);
        }
        return [...NotificationRepository.memoryNotifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async listByUserId(userId: string): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .eq('toUserId', userId)
                .order('timestamp', { ascending: false });
            if (!error && data) {
                // Sync memory cache for this user
                const otherUserNotifs = NotificationRepository.memoryNotifications.filter(n => n.toUserId !== userId);
                NotificationRepository.memoryNotifications = [...otherUserNotifs, ...(data as Notification[])];
                return data as Notification[];
            }
        } catch (e: any) {
            console.error('Failed to list notifications by user from Supabase, using memory fallback:', e?.message || e);
        }
        return NotificationRepository.memoryNotifications
            .filter(n => n.toUserId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async findById(id: string): Promise<Notification | null> {
        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (!error && data) {
                const idx = NotificationRepository.memoryNotifications.findIndex(n => n.id === id);
                if (idx !== -1) {
                    NotificationRepository.memoryNotifications[idx] = data as Notification;
                } else {
                    NotificationRepository.memoryNotifications.push(data as Notification);
                }
                return data as Notification;
            }
        } catch (e) {
            console.error('Failed to find notification by id from Supabase:', e);
        }
        const memNotif = NotificationRepository.memoryNotifications.find(n => n.id === id);
        return memNotif || null;
    }

    async create(notification: Omit<Notification, 'id'> & { id?: string }): Promise<Notification> {
        const id = notification.id || "notify_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        
        let validFromUserId = notification.fromUserId || "tarapti_official_admin";
        if (validFromUserId === "system" || validFromUserId.startsWith("system_") || validFromUserId === "user_sim") {
            validFromUserId = "tarapti_official_admin";
        }

        const newNotif: Notification = {
            id,
            toUserId: notification.toUserId,
            fromUserId: validFromUserId,
            fromUserName: notification.fromUserName || "Tarapti Alert",
            fromUserAvatar: notification.fromUserAvatar || "🚨",
            type: notification.type,
            message: notification.message,
            isRead: notification.isRead || false,
            timestamp: notification.timestamp || new Date().toISOString()
        };

        // Cache in memory fallback
        const existingIdx = NotificationRepository.memoryNotifications.findIndex(n => n.id === id);
        if (existingIdx >= 0) {
            NotificationRepository.memoryNotifications[existingIdx] = newNotif;
        } else {
            NotificationRepository.memoryNotifications.unshift(newNotif);
        }

        try {
            const { data, error } = await supabase
                .from('Notification')
                .upsert([newNotif])
                .select()
                .single();
            if (!error && data) {
                return data as Notification;
            }
            if (error) {
                // If it was FK error on fromUserId, retry with tarapti_official_admin
                if (error.code === '23503') {
                    newNotif.fromUserId = 'tarapti_official_admin';
                    const retry = await supabase.from('Notification').upsert([newNotif]).select().single();
                    if (!retry.error && retry.data) {
                        return retry.data as Notification;
                    }
                }
                throw error;
            }
        } catch (e) {
            console.error('Failed to persist notification in Supabase, using memory fallback:', e);
        }
        return newNotif;
    }

    async markAllAsRead(userId: string): Promise<void> {
        // Mark in memory cache
        NotificationRepository.memoryNotifications
            .filter(n => n.toUserId === userId)
            .forEach(n => n.isRead = true);

        try {
            await supabase
                .from('Notification')
                .update({ isRead: true })
                .eq('toUserId', userId);
        } catch (e) {
            console.error('Failed to mark notifications as read in Supabase:', e);
        }
    }

    async delete(id: string): Promise<void> {
        // Delete from memory cache
        NotificationRepository.memoryNotifications = NotificationRepository.memoryNotifications.filter(n => n.id !== id);

        try {
            await supabase
                .from('Notification')
                .delete()
                .eq('id', id);
        } catch (e) {
            console.error('Failed to delete notification in Supabase:', e);
        }
    }

    async update(id: string, updates: Partial<Notification>): Promise<void> {
        // Update in memory cache
        const memNotif = NotificationRepository.memoryNotifications.find(n => n.id === id);
        if (memNotif) {
            Object.assign(memNotif, updates);
        }

        try {
            await supabase
                .from('Notification')
                .update(updates)
                .eq('id', id);
        } catch (e) {
            console.error('Failed to update notification in Supabase:', e);
        }
    }
}

