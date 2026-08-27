import { IConnectionRepository } from './interfaces.ts';
import { Connection } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';

export class ConnectionRepository implements IConnectionRepository {
  private static memoryConnections: Connection[] = [];

  async list(): Promise<Connection[]> {
    try {
      const { data, error } = await supabase
        .from('Connection')
        .select('*');
      
      if (!error && data && data.length > 0) {
        const mapped = data.map((c: any) => ({
          requesterId: c.requester_id || c.requesterId,
          receiverId: c.receiver_id || c.receiverId,
          status: c.status,
          timestamp: c.timestamp || new Date().toISOString()
        })) as Connection[];
        // Merge with memory connections
        for (const mc of ConnectionRepository.memoryConnections) {
          if (!mapped.some(m => (m.requesterId === mc.requesterId && m.receiverId === mc.receiverId))) {
            mapped.push(mc);
          }
        }
        return mapped;
      }
    } catch (e: any) {
      console.warn('Supabase list connections failed, using memory:', e?.message || e);
    }
    return ConnectionRepository.memoryConnections;
  }

  async create(connection: Connection): Promise<void> {
    const existingIndex = ConnectionRepository.memoryConnections.findIndex(
      c => (c.requesterId === connection.requesterId && c.receiverId === connection.receiverId) ||
           (c.requesterId === connection.receiverId && c.receiverId === connection.requesterId)
    );
    if (existingIndex >= 0) {
      ConnectionRepository.memoryConnections[existingIndex] = connection;
    } else {
      ConnectionRepository.memoryConnections.push(connection);
    }

    try {
      await supabase
        .from('Connection')
        .insert({
          requester_id: connection.requesterId,
          receiver_id: connection.receiverId,
          status: connection.status
        });
    } catch (e: any) {
      console.warn('Failed to create connection in Supabase, stored in memory:', e?.message || e);
    }
  }

  async delete(requesterId: string, receiverId: string): Promise<void> {
    ConnectionRepository.memoryConnections = ConnectionRepository.memoryConnections.filter(
      c => !((c.requesterId === requesterId && c.receiverId === receiverId) ||
             (c.requesterId === receiverId && c.receiverId === requesterId))
    );

    try {
      await supabase
        .from('Connection')
        .delete()
        .match({ requester_id: requesterId, receiver_id: receiverId });
      // Also try reverse match
      await supabase
        .from('Connection')
        .delete()
        .match({ requester_id: receiverId, receiver_id: requesterId });
    } catch (e: any) {
      console.warn('Failed to delete connection in Supabase:', e?.message || e);
    }
  }

  async updateStatus(requesterId: string, receiverId: string, status: 'pending' | 'accepted' | 'declined'): Promise<void> {
    let conn = ConnectionRepository.memoryConnections.find(
      c => (c.requesterId === requesterId && c.receiverId === receiverId) ||
           (c.requesterId === receiverId && c.receiverId === requesterId)
    );
    if (conn) {
      conn.status = status;
    } else {
      ConnectionRepository.memoryConnections.push({
        requesterId,
        receiverId,
        status,
        timestamp: new Date().toISOString()
      });
    }

    try {
      await supabase
        .from('Connection')
        .update({ status })
        .match({ requester_id: requesterId, receiver_id: receiverId });
      await supabase
        .from('Connection')
        .update({ status })
        .match({ requester_id: receiverId, receiver_id: requesterId });
    } catch (e: any) {
      console.warn('Failed to update connection status in Supabase:', e?.message || e);
    }
  }
}
