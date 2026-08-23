import { INotificationRepository } from './interfaces.ts';
import { Notification } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class NotificationRepository implements INotificationRepository {
    private static memoryNotifications: Notification[] = [];

    async list(): Promise<Notification[]> {
        const listMap = new Map<string, Notification>();
        // Add memory notifications
        NotificationRepository.memoryNotifications.forEach(n => listMap.set(n.id, n));

        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .order('timestamp', { ascending: false });
            if (error) throw error;
            if (data) {
                data.forEach((n: any) => listMap.set(n.id, n as Notification));
            }
        } catch (e) {
            console.error('Failed to list notifications from Supabase:', e);
        }
        return Array.from(listMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async listByUserId(userId: string): Promise<Notification[]> {
        const listMap = new Map<string, Notification>();
        // Add memory notifications
        NotificationRepository.memoryNotifications
            .filter(n => n.toUserId === userId)
            .forEach(n => listMap.set(n.id, n));

        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .eq('toUserId', userId)
                .order('timestamp', { ascending: false });
            if (error) throw error;
            if (data) {
                data.forEach((n: any) => listMap.set(n.id, n as Notification));
            }
        } catch (e: any) {
            console.error('Failed to list notifications by user from Supabase:', e?.message || e);
        }
        return Array.from(listMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async findById(id: string): Promise<Notification | null> {
        // Find in memory first
        const memNotif = NotificationRepository.memoryNotifications.find(n => n.id === id);
        if (memNotif) return memNotif;

        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            return data as Notification;
        } catch (e) {
            console.error('Failed to find notification by id from Supabase:', e);
            return null;
        }
    }

    async create(notification: Omit<Notification, 'id'> & { id?: string }): Promise<Notification> {
        const id = notification.id || "notify_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        
        const newNotif: Notification = {
            id,
            toUserId: notification.toUserId,
            fromUserId: notification.fromUserId || "system",
            fromUserName: notification.fromUserName || "Tarapti Alert",
            fromUserAvatar: notification.fromUserAvatar || "🚨",
            type: notification.type,
            message: notification.message,
            isRead: notification.isRead || false,
            timestamp: notification.timestamp || new Date().toISOString()
        };

        // Save to memory
        NotificationRepository.memoryNotifications.unshift(newNotif);

        try {
            const { data, error } = await supabase
                .from('Notification')
                .insert([newNotif])
                .select()
                .single();
            if (error) throw error;
            return data as Notification;
        } catch (e) {
            console.error('Failed to create notification in Supabase, using memory fallback:', e);
            return newNotif;
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        // Mark in memory
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
        // Delete from memory
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
        // Update in memory
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
