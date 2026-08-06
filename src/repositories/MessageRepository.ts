import { IMessageRepository } from './interfaces.ts';
import { Message } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class MessageRepository implements IMessageRepository {
    async list(): Promise<Message[]> {
        try {
            let allMessages: Message[] = [];
            const { data: msgData, error: msgError } = await supabase
                .from('Message')
                .select('*')
                .order('timestamp', { ascending: false });
            if (!msgError && msgData) {
                allMessages = [...msgData];
            }

            const { data: commData, error: commError } = await supabase
                .from('community_messages')
                .select('*')
                .order('timestamp', { ascending: false });
            if (!commError && commData) {
                const mappedComm = commData.map((m: any) => ({
                    id: m.id,
                    senderId: m.senderId || m.sender_id || m.userId,
                    receiverId: m.receiverId || m.receiver_id || m.groupId || m.group_id,
                    content: m.content || "",
                    timestamp: m.timestamp || m.created_at || new Date().toISOString(),
                    isRead: true,
                    isDelivered: true,
                    image: m.image || m.image_url,
                    reactions: m.reactions || []
                }));
                allMessages = [...allMessages, ...mappedComm];
            }

            // Deduplicate by id and sort by timestamp descending
            const map = new Map();
            allMessages.forEach(m => map.set(m.id, m));
            return Array.from(map.values()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
            console.error('Failed to list messages from Supabase:', e);
            return [];
        }
    }

    async listAllForUser(userId: string): Promise<Message[]> {
        return this.list();
    }

    async listHistory(userId: string, partnerId: string): Promise<Message[]> {
        const isGroup = partnerId.startsWith("group_");
        try {
            if (isGroup) {
                let groupMessages: Message[] = [];
                const { data: msgData } = await supabase
                    .from('Message')
                    .select('*')
                    .eq('receiverId', partnerId);
                if (msgData) groupMessages.push(...msgData);

                const { data: commData } = await supabase
                    .from('community_messages')
                    .select('*')
                    .or(`groupId.eq.${partnerId},group_id.eq.${partnerId}`);
                if (commData) {
                    const mapped = commData.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId || m.sender_id || m.userId,
                        receiverId: m.receiverId || m.receiver_id || m.groupId || m.group_id,
                        content: m.content || "",
                        timestamp: m.timestamp || m.created_at || new Date().toISOString(),
                        isRead: true,
                        isDelivered: true,
                        image: m.image || m.image_url,
                        reactions: m.reactions || []
                    }));
                    groupMessages.push(...mapped);
                }

                const map = new Map();
                groupMessages.forEach(m => map.set(m.id, m));
                return Array.from(map.values()).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            } else {
                const { data, error } = await supabase
                    .from('Message')
                    .select('*')
                    .or(`and(senderId.eq.${userId},receiverId.eq.${partnerId}),and(senderId.eq.${partnerId},receiverId.eq.${userId})`);
                if (error) throw error;
                return (data || []) as Message[];
            }
        } catch (e) {
            console.error('Failed to list chat history from Supabase:', e);
            return [];
        }
    }

    async findById(id: string): Promise<Message | null> {
        try {
            const { data } = await supabase
                .from('Message')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (data) return data as Message;

            const { data: commData } = await supabase
                .from('community_messages')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (commData) {
                return {
                    id: commData.id,
                    senderId: commData.senderId || commData.sender_id || commData.userId,
                    receiverId: commData.receiverId || commData.receiver_id || commData.groupId || commData.group_id,
                    content: commData.content || "",
                    timestamp: commData.timestamp || commData.created_at || new Date().toISOString(),
                    isRead: true,
                    isDelivered: true,
                    image: commData.image || commData.image_url,
                    reactions: commData.reactions || []
                };
            }
            return null;
        } catch (e) {
            console.error('Failed to find message by id from Supabase:', e);
            return null;
        }
    }

    async create(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
        const id = "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        const isGroupMsg = message.receiverId && message.receiverId.startsWith("group_");
        
        const dbRecord: Message = {
            id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content || "",
            timestamp,
            isRead: false,
            isDelivered: true,
            image: message.image,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            reactions: message.reactions || []
        };

        try {
            // Also save to community_messages if it's a group message
            if (isGroupMsg) {
                await supabase.from('community_messages').insert([{
                    id,
                    groupId: message.receiverId,
                    group_id: message.receiverId,
                    senderId: message.senderId,
                    sender_id: message.senderId,
                    content: message.content || "",
                    timestamp,
                    image: message.image
                }]);
            }

            const { data, error } = await supabase
                .from('Message')
                .insert([{
                    id,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content || "",
                    timestamp,
                    isRead: false,
                    isDelivered: true
                }])
                .select()
                .single();
            if (error) {
                console.warn('Supabase message create notice:', error.message || error);
                return dbRecord;
            }
            return (data || dbRecord) as Message;
        } catch (e: any) {
            console.warn('Failed to create message in Supabase, using fallback:', e?.message || e);
            return dbRecord;
        }
    }

    async update(message: Message): Promise<void> {
        try {
            const updatePayload: any = {
                content: message.content,
                isRead: message.isRead,
                isDelivered: message.isDelivered
            };
            await supabase
                .from('Message')
                .update(updatePayload)
                .eq('id', message.id);
            await supabase
                .from('community_messages')
                .update(updatePayload)
                .eq('id', message.id);
        } catch (e: any) {
            console.warn('Failed to update message in Supabase:', e?.message || e);
        }
    }

    async markAsRead(senderId: string, receiverId: string): Promise<void> {
        try {
            await supabase
                .from('Message')
                .update({ isRead: true })
                .eq('senderId', senderId)
                .eq('receiverId', receiverId)
                .eq('isRead', false);
        } catch (e: any) {
            console.warn('Failed to mark messages as read in Supabase:', e?.message || e);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await supabase
                .from('Message')
                .delete()
                .eq('id', id);
            await supabase
                .from('community_messages')
                .delete()
                .eq('id', id);
        } catch (e: any) {
            console.warn('Failed to delete message in Supabase:', e?.message || e);
        }
    }
}

