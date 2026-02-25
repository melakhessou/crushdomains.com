import Replicate from 'replicate';
import { calculateFallbackPrice } from './appraisal-fallback';
import { scoreBrandability } from './brand-score';

import { Redis } from '@upstash/redis';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

// Initialize Redis if credentials exist
let redis: Redis | null = null;
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN,
        });
    } catch (err) {
        console.warn('Failed to initialize Redis client:', err);
    }
}

export interface AppraisalResult {
    source: 'AI' | 'CrushDomains';
    value: number;
    confidence: 'High' | 'Medium';
    raw: any;
}

export async function appraiseDomain(domain: string): Promise<AppraisalResult> {
    const cacheKey = `appraisal:${domain.toLowerCase()}`;

    // 1. Check Cache (Async safe, no crash)
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const result = typeof cached === 'string' ? JSON.parse(cached) : cached;
                if (result && result.value && result.source) {
                    return { ...result, source: 'AI' };
                }
            }
        } catch (err) {
            console.warn(`Redis get failed for ${domain}:`, err);
        }
    }

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                // Wait before retry: 1s, then 2s
                const delay = attempt * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`[Appraisal Retry] Attempt ${attempt} for ${domain}`);
            }

            // 2. Attempt AI API request with timeout
            const prediction = await Promise.race([
                replicate.run(
                    "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                    { input: { domains: domain } }
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI API timeout')), 6000)
                )
            ]) as any;

            // 3. Validate response
            let estimatedValue = -1;
            if (prediction && prediction.valuations && Array.isArray(prediction.valuations) && prediction.valuations.length > 0) {
                const val = prediction.valuations[0];
                if (typeof val.marketplace === 'number') {
                    estimatedValue = val.marketplace;
                }
            } else if (prediction && typeof prediction.estimated_value === 'number') {
                estimatedValue = prediction.estimated_value;
            }

            if (estimatedValue >= 0) {
                const result: AppraisalResult = {
                    source: 'AI',
                    value: estimatedValue,
                    confidence: 'High',
                    raw: prediction
                };

                // 4. Cache Result (TTL 7 days)
                if (redis) {
                    redis.set(cacheKey, JSON.stringify(result), { ex: 604800 }).catch(e => console.warn('Redis set failed', e));
                }

                return result;
            }

            throw new Error('Invalid AI response');

        } catch (error: any) {
            lastError = error;
            console.error(`[Appraisal Attempt ${attempt} Error] ${domain}:`, error.message);

            // Only retry on rate limits or timeouts
            const isRetryable = error.message.includes('429') ||
                error.message.includes('throttled') ||
                error.message.includes('timeout');

            if (!isRetryable || attempt === maxRetries) {
                break;
            }
        }
    }

    // Final error Handling: Never leak raw JSON or technical URLS to the user
    // Template: AI service encountered a temporary technical issue. Please wait a moment and try again. [Error #XXX]
    const msg = lastError?.message || '';
    const standardPrefix = 'AI service encountered a temporary technical issue. Please wait a moment and try again.';

    // 1. Account/Credit issues
    if (msg.toLowerCase().includes('credit')) {
        throw new Error(`${standardPrefix} [Error #402]`);
    }

    // 2. Rate Limits (429)
    if (msg.includes('429') || msg.toLowerCase().includes('throttled') || msg.toLowerCase().includes('too many requests')) {
        throw new Error(`${standardPrefix} [Error #429]`);
    }

    // 3. Timeouts
    if (msg.toLowerCase().includes('timeout')) {
        throw new Error(`${standardPrefix} [Error #504]`);
    }

    // 4. Invalid responses
    if (msg.includes('Invalid AI response')) {
        throw new Error(`The AI could not value this domain (likely too new or obscure). [Error #422]`);
    }

    // 5. Technical failure catch-all (catches raw statuses, urls, etc)
    const technicalMarkers = ['failed with status', 'http', 'api.replicate', '{', '}', 'v1/predictions'];
    const isTechnical = technicalMarkers.some(marker => msg.toLowerCase().includes(marker));

    if (isTechnical) {
        throw new Error(`${standardPrefix} [Error #500]`);
    }

    throw new Error(msg && msg.length < 60 ? `${msg} [Error #503]` : `${standardPrefix} [Error #503]`);
}
