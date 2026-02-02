/**
 * Production-Ready Domain Check API
 * Features: In-memory Cache, Request Queue (Concurrency Control), Deduplication, Rate Limiting
 */

const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Environment Config
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const Config = {
    PORT: process.env.PORT || 3001,
    DOMAINR_KEY: process.env.DOMAINR_API_KEY,
    FASTLY_KEY: process.env.FASTLY_KEY,
    CACHE_TTL: 15 * 60 * 1000,
    MAX_CONCURRENT: 10,
    IS_PROD: process.env.NODE_ENV === 'production'
};

const app = express();

// --- Internal State ---
const cache = new Map();
const inflight = new Map();
const requestQueue = [];
let activeRequests = 0;

const log = (msg, level = 'info') => {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${level.toUpperCase()}] ${msg}`);
};

const getCached = (domain) => {
    const entry = cache.get(domain);
    if (entry && Date.now() - entry.timestamp < Config.CACHE_TTL) return entry.data;
    cache.delete(domain);
    return null;
};

const processQueue = () => {
    while (activeRequests < Config.MAX_CONCURRENT && requestQueue.length > 0) {
        const { resolve, reject, domain, options } = requestQueue.shift();
        activeRequests++;

        axios.request(options)
            .then(response => {
                const result = response.data;
                cache.set(domain, { data: result, timestamp: Date.now() });
                resolve(result);
            })
            .catch(reject)
            .finally(() => {
                activeRequests--;
                processQueue();
            });
    }
};

// --- Middleware ---

app.use(cors());
app.use(express.json());

// Rate Limiter
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' }
}));

// --- Routes ---

/**
 * Main Domain Check Endpoint
 */
app.get('/api/check-domain', async (req, res) => {
    const domain = req.query.domain?.toLowerCase().trim();

    if (!domain || !domain.endsWith('.com')) {
        return res.status(400).json({ error: 'Valid .com domain required' });
    }

    // 1. Cache Check
    const cached = getCached(domain);
    if (cached) return res.json(formatResponse(cached));

    // 2. Deduplication (Inflight check)
    if (inflight.has(domain)) {
        try {
            const data = await inflight.get(domain);
            return res.json(formatResponse(data));
        } catch (err) {
            return res.status(502).json({ error: 'Upstream check failed' });
        }
    }

    // 3. Prepare Config
    const options = Config.FASTLY_KEY
        ? {
            method: 'GET',
            url: 'https://api.domainr.com/v2/status',
            params: { domain },
            headers: { 'Fastly-Key': Config.FASTLY_KEY }
        }
        : {
            method: 'GET',
            url: 'https://domainr.p.rapidapi.com/v2/status',
            params: { domain },
            headers: {
                'x-rapidapi-key': Config.DOMAINR_KEY,
                'x-rapidapi-host': 'domainr.p.rapidapi.com'
            }
        };

    if (!Config.FASTLY_KEY && !Config.DOMAINR_KEY) {
        log('API Keys missing', 'error');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // 4. Queue and Concurrency Execution
    const checkPromise = new Promise((resolve, reject) => {
        requestQueue.push({ resolve, reject, domain, options });
        processQueue();
    });

    inflight.set(domain, checkPromise);

    try {
        const data = await checkPromise;
        log(`Checked: ${domain}`);
        return res.json(formatResponse(data));
    } catch (error) {
        log(`Check failed: ${domain} - ${error.message}`, 'error');
        return res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Domain check failed'
        });
    } finally {
        inflight.delete(domain);
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// Standardize response output
function formatResponse(data) {
    const status = data.status?.[0];
    return {
        domain: status?.domain,
        available: status?.summary === 'undelegated' || status?.summary === 'inactive',
        status: status?.summary
    };
}

// VPS Launch
if (require.main === module) {
    app.listen(Config.PORT, () => {
        log(`Production server running on port ${Config.PORT}`);
    });
}

// Serverless Export
module.exports = app;
