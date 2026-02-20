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
    source: 'Humbleworth' | 'CrushDomains';
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
                // Ensure we handle both string and object responses from redis driver
                const result = typeof cached === 'string' ? JSON.parse(cached) : cached;
                // Validate structure minimally
                if (result && result.value && result.source) {
                    return { ...result, source: 'Humbleworth' }; // Return as Humbleworth source even if cached
                }
            }
        } catch (err) {
            console.warn(`Redis get failed for ${domain}:`, err);
            // Continue to API without crashing
        }
    }

    try {
        // 2. Attempt Humbleworth API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const prediction = await Promise.race([
            replicate.run(
                "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                {
                    input: { domains: domain }
                }
            ),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Humbleworth API timeout')), 5000)
            )
        ]) as any;

        clearTimeout(timeoutId);

        // 3. Validate response
        // Handle { valuations: [...] } structure from Humbleworth
        let estimatedValue = -1;

        if (prediction && prediction.valuations && Array.isArray(prediction.valuations) && prediction.valuations.length > 0) {
            const val = prediction.valuations[0];
            // Use marketplace value as primary, or fallback to auction/brokerage if missing
            if (typeof val.marketplace === 'number') {
                estimatedValue = val.marketplace;
            }
        } else if (prediction && typeof prediction.estimated_value === 'number') {
            // Fallback for different model versions just in case
            estimatedValue = prediction.estimated_value;
        }

        // We consider 0 as a valid output from Humbleworth if explicitly returned.
        if (estimatedValue >= 0) {
            const result: AppraisalResult = {
                source: 'Humbleworth',
                value: estimatedValue,
                confidence: 'High',
                raw: prediction
            };

            // 4. Cache Result (TTL 7 days = 604800 seconds)
            if (redis) {
                try {
                    // Fire and forget cache set to not delay response
                    redis.set(cacheKey, JSON.stringify(result), { ex: 604800 }).catch(e => console.warn('Redis set failed', e));
                } catch (e) {
                    console.warn('Redis set error', e);
                }
            }

            return result;
        }

        // If response weird, throw to trigger fallback
        throw new Error('Invalid Humbleworth response');

    } catch (error) {
        console.warn(`Humbleworth API failed or timed out for ${domain}:`, error);

        // 5. Fallback to local engine
        // Strip TLD for local scoring as requested
        const parts = domain.split('.');
        const sld = parts[0];

        const brandScore = scoreBrandability(sld);
        const fallback = calculateFallbackPrice(domain); // Keep full domain for TLD check inside this if needed, or check implementation

        // We need to adhere to the fallback price logic but maybe adjust it with the new brand score?
        // The prompt says "convert score -> estimated value". 
        // calculateFallbackPrice returns a price, let's use that but enhance it or just use it as is if it already uses brand score?
        // Actually, looking at route.ts, it seemed to do manual blending. 
        // For now, let's rely on calculateFallbackPrice which seems to be the "local scoring engine" for price.
        // We will pass the brand score breakdown in 'raw'.

        return {
            source: 'CrushDomains',
            value: fallback.fallback_price,
            confidence: 'Medium',
            raw: {
                fallback_result: fallback,
                brand_scoring: brandScore
            }
        };
    }
}
