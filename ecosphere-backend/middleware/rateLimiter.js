// Rate Limiter Middleware
// Simple in-memory rate limiter for forecast endpoints
// Sufficient for 20-50 users, no need for Redis at this scale

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60000; // 1 minute default
        this.maxRequests = options.maxRequests || 10; // 10 requests per window
        this.message = options.message || 'Too many requests, please try again later';
        this.requests = new Map(); // Store: { ip: [timestamps] }
    }

    /**
     * Middleware function
     */
    middleware() {
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const now = Date.now();

            // Get or initialize request history for this IP
            if (!this.requests.has(ip)) {
                this.requests.set(ip, []);
            }

            const requestHistory = this.requests.get(ip);

            // Remove expired timestamps (outside the time window)
            const validRequests = requestHistory.filter(
                timestamp => now - timestamp < this.windowMs
            );

            // Check if limit exceeded
            if (validRequests.length >= this.maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: this.message,
                    retryAfter: Math.ceil(this.windowMs / 1000) // seconds
                });
            }

            // Add current request timestamp
            validRequests.push(now);
            this.requests.set(ip, validRequests);

            next();
        };
    }

    /**
     * Clean up old entries periodically
     */
    cleanup() {
        const now = Date.now();
        for (const [ip, timestamps] of this.requests.entries()) {
            const validRequests = timestamps.filter(
                timestamp => now - timestamp < this.windowMs
            );
            if (validRequests.length === 0) {
                this.requests.delete(ip);
            } else {
                this.requests.set(ip, validRequests);
            }
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            trackedIPs: this.requests.size,
            windowMs: this.windowMs,
            maxRequests: this.maxRequests
        };
    }
}

// Create rate limiter instances for different endpoints
const forecastLimiter = new RateLimiter({
    windowMs: 60000,        // 1 minute
    maxRequests: 60,        // 60 requests per minute per IP (production setting)
    message: 'Too many forecast requests. Please wait before generating more forecasts.'
});

// Clean up old entries every 5 minutes
setInterval(() => {
    forecastLimiter.cleanup();
}, 5 * 60 * 1000);

module.exports = {
    forecastLimiter
};
