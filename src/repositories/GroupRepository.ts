import { supabase } from '../lib/supabaseClient.ts';

export class GroupRepository {
    async list(): Promise<any[]> {
        try {
            let { data, error } = await supabase
                .from('Group')
                .select('*');
            if (error || !data) {
                const res = await supabase
                    .from('groups')
                    .select('*');
                if (!res.error && res.data) {
                    data = res.data;
                }
            }
            return data || [];
        } catch (e) {
            console.error('Failed to list groups from Supabase:', e);
            return [];
        }
    }

    async findById(groupId: string): Promise<any | null> {
        try {
            let { data } = await supabase
                .from('Group')
                .select('*')
                .eq('id', groupId)
                .maybeSingle();
            if (data) return data;

            const res = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .maybeSingle();
            return res.data || null;
        } catch (e) {
            console.error('Failed to find group by id:', e);
            return null;
        }
    }

    async create(group: { id: string; name: string; type: string; city?: string; province?: string }): Promise<void> {
        try {
            await supabase.from('Group').upsert([group]);
            await supabase.from('groups').upsert([group]);
        } catch (e) {
            console.error('Failed to create/upsert group in Supabase:', e);
        }
    }
}
