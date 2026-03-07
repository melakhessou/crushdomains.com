import Papa from 'papaparse';

export type NamejetSource = 'deleting' | 'preorder' | 'live';

export interface NamejetDomain {
    source: NamejetSource;
    domainName: string; // Maintain consistency with existing Domain interface
    tld: string;
    length: number;
    currentBid: number | null;
    closingDate: Date | null;
    rawRow: Record<string, string>;
}

/**
 * Detects the type of NameJet CSV based on header keys.
 */
function detectSchema(headers: string[]): NamejetSource | null {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    if (normalizedHeaders.includes('release date')) {
        return 'preorder';
    }
    if (normalizedHeaders.includes('auction end date')) {
        return 'live';
    }
    // Deleting domains usually have "Join By Date (ET)" or similar
    if (normalizedHeaders.includes('join by date (et)') || normalizedHeaders.includes('prereleasedate')) {
        return 'deleting';
    }
    // Fallback detection for deleting if headers are slightly different but contain domain
    if (normalizedHeaders.includes('domain') && !normalizedHeaders.includes('release date') && !normalizedHeaders.includes('auction end date')) {
        return 'deleting';
    }

    return null;
}

/**
 * Parses a numeric bid string into a number or null.
 */
function parseBid(bid: string | undefined): number | null {
    if (!bid) return null;
    const cleaned = bid.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Parses Date strings in MM/DD/YYYY [HH:mm] format.
 */
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;

    // Simple parsing for MM/DD/YYYY HH:mm or MM/DD/YYYY
    const [datePart, timePart] = dateStr.trim().split(' ');
    const [month, day, year] = datePart.split('/').map(Number);

    if (!month || !day || !year) return null;

    const date = new Date(year, month - 1, day);

    if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number);
        if (!isNaN(hours)) date.setHours(hours);
        if (!isNaN(minutes)) date.setMinutes(minutes);
    }

    return isNaN(date.getTime()) ? null : date;
}

/**
 * Find a value in a row by multiple potential header names.
 */
function findValue(row: Record<string, string>, targets: string[]): string {
    const keys = Object.keys(row);
    for (const target of targets) {
        const normalizedTarget = target.toLowerCase().trim();
        const key = keys.find(k => k.toLowerCase().trim() === normalizedTarget);
        if (key) return row[key];
    }
    return '';
}

/**
 * Robust NameJet CSV Parser.
 */
export function parseNamejetCsv(csvContent: string): NamejetDomain[] {
    // 1. Pre-process: Find the actual header row by skipping "Important:" lines or empty lines
    const lines = csvContent.split(/\r?\n/);
    let dataStartIndex = 0;
    let headers: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith('important:')) continue;

        // Check if this looks like a header row (contains "domain")
        if (line.toLowerCase().includes('domain')) {
            const result = Papa.parse<string[]>(line, { skipEmptyLines: true });
            if (result.data && result.data[0]) {
                headers = result.data[0];
                dataStartIndex = i + 1;
                break;
            }
        }
    }

    if (headers.length === 0) return [];

    const schema = detectSchema(headers);
    if (!schema) return [];

    // Parse the rest of the file using PapaParse from the identified start
    const result = Papa.parse<Record<string, string>>(lines.slice(dataStartIndex).join('\n'), {
        header: false, // We'll map them manually to be safe
        skipEmptyLines: true,
    });

    return result.data.map((dataArray: any) => {
        // Map array back to object using our detected headers
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = dataArray[idx] || '';
        });

        const domainName = findValue(row, ['Domain name', 'Domain', 'domain']);
        if (!domainName) return null;

        const parts = domainName.split('.');
        const tld = parts.length > 1 ? parts.pop() || '' : '';
        const nameWithoutTld = parts.join('.');

        let bid: number | null = null;
        let closingDate: Date | null = null;

        if (schema === 'preorder') {
            bid = parseBid(findValue(row, ['Current bid']));
            closingDate = parseDate(findValue(row, ['Release date']));
        } else if (schema === 'live') {
            bid = parseBid(findValue(row, ['Current bid']));
            closingDate = parseDate(findValue(row, ['Auction end date']));
        } else {
            // Deleting
            bid = null; // Usually no bid in deleting CSV, or it's a fixed price
            closingDate = parseDate(findValue(row, ['Join By Date (ET)', 'PreReleaseDate', 'delete_date', 'Date']));
        }

        return {
            source: schema,
            domainName,
            tld: tld.toLowerCase(),
            length: nameWithoutTld.length,
            currentBid: bid,
            closingDate,
            rawRow: row
        };
    }).filter((d): d is NamejetDomain => d !== null);
}
