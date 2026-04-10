import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

/**
 * REDIS CONFIGURATION
 * 
 * Redis is an IN-MEMORY data store. 
 * Why use it for analytics?
 * 1. Aggregation pipelines are "expensive" (they scan many docs).
 * 2. Analytics data doesn't change every second (users don't care if stats are 1hr old).
 * 3. Redis response time: ~1ms. MongoDB aggregation: ~100-500ms.
 */

let redis;

try {
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'your_redis_url_here') {
        redis = new Redis(process.env.REDIS_URL);
        console.log('🚀 Redis Connected'.cyan.bold);
    } else {
        console.log('⚠️  Redis not configured — caching disabled.'.yellow);
    }
} catch (err) {
    console.error('❌ Redis Connection Error:', err.message);
}

// Utility functions for caching
export const getCachedData = async (key) => {
    if (!redis) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

export const setCachedData = async (key, data, ttlSeconds = 3600) => {
    if (!redis) return;
    // EX → set expiry in seconds
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
};

export default redis;
