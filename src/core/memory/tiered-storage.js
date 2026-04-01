// Copyright (c) 2026 Ultra-Dex
// Tiered Storage - Hot/Warm/Cold storage management

export class TieredStorage {
    constructor(options = {}) {
        this.hotStorage = new Map();
        this.warmStorage = new Map();
        this.coldStorage = new Map();
        
        this.hotLimit = options.hotLimit || 1000;
        this.warmLimit = options.warmLimit || 10000;
        this.accessThreshold = options.accessThreshold || 10;
        this.ageThreshold = options.ageThreshold || 24 * 60 * 60 * 1000; // 24 hours
    }

    async store(key, data, metadata = {}) {
        const entry = {
            key,
            data,
            metadata: {
                ...metadata,
                created: new Date(),
                lastAccessed: new Date(),
                accessCount: 1
            }
        };

        this.hotStorage.set(key, entry);
        await this.rebalance();
        return entry;
    }

    async get(key) {
        // Check hot storage first
        if (this.hotStorage.has(key)) {
            const entry = this.hotStorage.get(key);
            entry.metadata.lastAccessed = new Date();
            entry.metadata.accessCount++;
            return entry.data;
        }

        // Check warm storage
        if (this.warmStorage.has(key)) {
            const entry = this.warmStorage.get(key);
            entry.metadata.lastAccessed = new Date();
            entry.metadata.accessCount++;
            
            // Promote to hot if frequently accessed
            if (entry.metadata.accessCount >= this.accessThreshold) {
                this.warmStorage.delete(key);
                this.hotStorage.set(key, entry);
                await this.rebalance();
            }
            
            return entry.data;
        }

        // Check cold storage
        if (this.coldStorage.has(key)) {
            const entry = this.coldStorage.get(key);
            entry.metadata.lastAccessed = new Date();
            entry.metadata.accessCount++;
            
            // Promote to warm
            this.coldStorage.delete(key);
            this.warmStorage.set(key, entry);
            await this.rebalance();
            
            return entry.data;
        }

        return null;
    }

    async rebalance() {
        // Move items from hot to warm if over limit
        while (this.hotStorage.size > this.hotLimit) {
            const [key, entry] = this.getLeastRecentlyUsed(this.hotStorage);
            this.hotStorage.delete(key);
            this.warmStorage.set(key, entry);
        }

        // Move items from warm to cold if over limit
        while (this.warmStorage.size > this.warmLimit) {
            const [key, entry] = this.getLeastRecentlyUsed(this.warmStorage);
            this.warmStorage.delete(key);
            this.coldStorage.set(key, entry);
        }

        // Archive old items from cold storage
        await this.archiveOldItems();
    }

    getLeastRecentlyUsed(storage) {
        let lruEntry = null;
        let lruTime = Date.now();

        for (const [key, entry] of storage) {
            if (entry.metadata.lastAccessed.getTime() < lruTime) {
                lruTime = entry.metadata.lastAccessed.getTime();
                lruEntry = [key, entry];
            }
        }

        return lruEntry;
    }

    async archiveOldItems() {
        const cutoff = Date.now() - this.ageThreshold;
        const toArchive = [];

        for (const [key, entry] of this.coldStorage) {
            if (entry.metadata.lastAccessed.getTime() < cutoff) {
                toArchive.push(key);
            }
        }

        // In production, would archive to external storage
        for (const key of toArchive) {
            this.coldStorage.delete(key);
        }
    }

    getStats() {
        return {
            hot: this.hotStorage.size,
            warm: this.warmStorage.size,
            cold: this.coldStorage.size,
            total: this.hotStorage.size + this.warmStorage.size + this.coldStorage.size,
            limits: {
                hot: this.hotLimit,
                warm: this.warmLimit
            }
        };
    }
}

export default TieredStorage;
