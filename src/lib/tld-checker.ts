/**
 * TLD Registration Checker
 * 
 * For a given domain name (SLD), checks multiple TLDs via Domainr API
 * to determine which are already registered.
 */

const DEFAULT_TLDS = ['com', 'net', 'org', 'io', 'ai', 'co', 'xyz', 'app', 'dev', 'tech'];

export interface TldCheckResult {
    tlds_registered_count: number;
    registered_tlds: string[];
    tlds_available_count: number;
    available_tlds: string[];
}

export async function checkTldRegistrations(
    domain: string,
    tlds?: string[]
): Promise<TldCheckResult> {
    const FASTLY_KEY = process.env.FASTLY_KEY;
    const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

    if (!FASTLY_KEY && !DOMAINR_API_KEY) {
        console.warn('[TLD Check] No API key configured');
        return { tlds_registered_count: 0, registered_tlds: [], tlds_available_count: 0, available_tlds: [] };
    }

    // Extract SLD (second-level domain name without TLD)
    const parts = domain.split('.');
    const sld = parts[0];
    const tldsToCheck = tlds || DEFAULT_TLDS;

    const registered: string[] = [];
    const available: string[] = [];

    // Check each TLD — use sequential calls with small delay to respect rate limits
    for (const tld of tldsToCheck) {
        try {
            const fullDomain = `${sld}.${tld}`;

            let url: string;
            let headers: Record<string, string>;

            if (FASTLY_KEY) {
                url = `https://api.domainr.com/v2/status?domain=${fullDomain}`;
                headers = { 'Fastly-Key': FASTLY_KEY };
            } else {
                url = `https://domainr.p.rapidapi.com/v2/status?domain=${fullDomain}`;
                headers = {
                    'x-rapidapi-key': DOMAINR_API_KEY!,
                    'x-rapidapi-host': 'domainr.p.rapidapi.com'
                };
            }

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store'
            });

            if (!response.ok) {
                console.warn(`[TLD Check] ${fullDomain}: HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const status = data.status?.[0];

            if (!status) continue;

            // 'active' = registered, 'undelegated'/'inactive' = available
            if (status.summary === 'undelegated' || status.summary === 'inactive') {
                available.push(tld);
            } else {
                registered.push(tld);
            }

            // Small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 80));

        } catch (err: any) {
            console.warn(`[TLD Check] Error checking ${sld}.${tld}: ${err.message}`);
        }
    }

    return {
        tlds_registered_count: registered.length,
        registered_tlds: registered,
        tlds_available_count: available.length,
        available_tlds: available,
    };
}
