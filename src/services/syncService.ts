
import { supabase } from './supabase';

export interface SyncItem {
    id: string;
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: string;
}

const STORAGE_KEY = 'admcanaa_sync_queue';

class SyncService {
    private queue: SyncItem[] = [];

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.syncAll());
        }
    }

    private loadQueue() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.queue = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse sync queue', e);
                this.queue = [];
            }
        }
    }

    private saveQueue() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    }

    enqueue(table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
        const item: SyncItem = {
            id: crypto.randomUUID(),
            table,
            operation,
            payload,
            timestamp: new Date().toISOString()
        };
        this.queue.push(item);
        this.saveQueue();

        // Tenta sincronizar se estiver online houver conexão
        if (navigator.onLine) {
            this.syncAll();
        }

        return item.id;
    }

    async syncAll() {
        if (this.queue.length === 0) return;
        if (!navigator.onLine) return;

        console.log(`Iniciando sincronização de ${this.queue.length} itens...`);

        const itemsToSync = [...this.queue];

        for (const item of itemsToSync) {
            try {
                let error;
                if (item.operation === 'INSERT') {
                    const { error: err } = await supabase.from(item.table).insert([item.payload]);
                    error = err;
                } else if (item.operation === 'UPDATE') {
                    // Assume payload contains the ID for update filtering or it's handled via eq
                    const { id, ...updateData } = item.payload;
                    const { error: err } = await supabase.from(item.table).update(updateData).eq('id', id);
                    error = err;
                } else if (item.operation === 'DELETE') {
                    const { error: err } = await supabase.from(item.table).delete().eq('id', item.payload.id);
                    error = err;
                }

                if (!error) {
                    this.queue = this.queue.filter(q => q.id !== item.id);
                    this.saveQueue();
                } else {
                    console.error(`Erro ao sincronizar item ${item.id}:`, error);
                    // Se for um erro permanente (400), talvez devêssemos remover da fila
                    // Por enquanto, mantém na fila para tentar novamente
                }
            } catch (err) {
                console.error(`Falha crítica na sincronização do item ${item.id}:`, err);
            }
        }
    }

    getQueueSize() {
        return this.queue.length;
    }

    isOffline() {
        return !navigator.onLine;
    }
}

export const syncService = new SyncService();
