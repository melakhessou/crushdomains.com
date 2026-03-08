/**
 * Shared Domain Availability Logic
 * Powered by Domainr API (Fastly or RapidAPI)
 */

export interface AvailabilityResult {
    available: boolean;
    rawStatuses: string[];
    confidence: 'high' | 'medium';
    status: string;
    domain: string;
}

/**
 * Checks domain availability via Domainr API.
 * This function can be used in Next.js API routes or libraries.
 */
export async function checkDomainAvailability(domain: string): Promise<AvailabilityResult | null> {
    const FASTLY_KEY = process.env.FASTLY_KEY;
    const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

    if (!FASTLY_KEY && !DOMAINR_API_KEY) {
        console.error('[Availability Lib] Missing API Keys');
        return null;
    }

    let url: string;
    let headers: Record<string, string>;

    if (FASTLY_KEY) {
        url = `https://api.domainr.com/v2/status?domain=${domain}`;
        headers = { 'Fastly-Key': FASTLY_KEY };
    } else {
        url = `https://domainr.p.rapidapi.com/v2/status?domain=${domain}`;
        headers = {
            'x-rapidapi-key': DOMAINR_API_KEY!,
            'x-rapidapi-host': 'domainr.p.rapidapi.com'
        };
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Availability Lib] API returned ${response.status}`);
            return null;
        }

        const data = await response.json();
        const statusObj = data.status?.[0];

        if (!statusObj) return null;

        // Robust Availability Logic
        const rawStatus = statusObj.status || "";
        const s: string[] = Array.isArray(rawStatus)
            ? rawStatus
            : rawStatus.split(/\s+/).filter(Boolean);

        // 1. Standard Availability: "undelegated" status (primary signal for empty zone).
        // 2. Premium Availability: "marketed", "priced", "transferable", or "premium" (domain is for sale).
        const isStandardAvailable = s.includes("undelegated") || s.includes("inactive");
        const isPremiumAvailable = s.includes("marketed") || s.includes("priced") || s.includes("transferable") || s.includes("premium");

        // 3. Must NOT have any definitive blocking status like "reserved" or "pending".
        const isBlocked = s.includes("reserved") ||
            s.includes("pending") ||
            (s.includes("active") && !isPremiumAvailable) ||
            s.includes("clientTransferProhibited") ||
            s.includes("serverTransferProhibited");

        const available = (isStandardAvailable || isPremiumAvailable) && !isBlocked;
        const confidence = available ? "medium" : "high";

        return {
            domain: statusObj.domain,
            available,
            rawStatuses: s,
            confidence,
            status: statusObj.summary || ''
        };

    } catch (error) {
        console.error('[Availability Lib] Error:', error);
        return null;
    }
}
