// Simple In-Memory Cache
// Sufficient for 20-50 users, no need for Redis at this scale
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
    }

    /**
     * Set a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
     */
    set(key, value, ttl = 3600000) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        this.stats.sets++;
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete a specific key
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        let cleared = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
                cleared++;
            }
        }

        if (cleared > 0) {
            console.log(`Cleared ${cleared} expired cache entries`);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Generate cache key from parameters
     * @param {string} prefix - Key prefix (e.g., 'consumption', 'forecast')
     * @param {...any} params - Parameters to include in key
     * @returns {string} Cache key
     */
    static generateKey(prefix, ...params) {
        return `${prefix}:${params.join(':')}`;
    }
}

// Create singleton instance
const cache = new SimpleCache();

// Clear expired entries every 5 minutes
setInterval(() => {
    cache.clearExpired();
}, 5 * 60 * 1000);

module.exports = cache;
