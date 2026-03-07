/**
 * Verification Script for NameJet Parser logic
 * This script demonstrates how the parsing and filtering works.
 */

const preorderCsv = `Important: Final bids are processed at...
Domain name,Current bid,Release date
0-1-0-4.com,79,03/07/2026 13:45
cool-domain.com,200,03/08/2026 10:00
`;

const liveCsv = `Important: Live auctions...
Domain name,Current bid,Auction end date
008584.com,69,03/07/2026
premium.com,500,03/10/2026
`;

// Re-implementing the core logic for the verification script 
// (In production, you'd use the exported function from src/lib/namejet-parser.ts)

function parseBid(bid) {
    if (!bid) return null;
    const cleaned = String(bid).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    const [month, day, year] = parts[0].split('/').map(Number);
    if (!month || !day || !year) return null;
    const date = new Date(year, month - 1, day);
    if (parts[1]) {
        const [hours, minutes] = parts[1].split(':').map(Number);
        if (!isNaN(hours)) date.setHours(hours);
        if (!isNaN(minutes)) date.setMinutes(minutes);
    }
    return date;
}

function mockParseNamejetCsv(csvContent, type) {
    const lines = csvContent.split('\n').filter(l => l.trim() && !l.startsWith('Important:'));
    const headers = lines[0].split(',');
    const data = lines.slice(1);

    return data.map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((h, i) => row[h.trim()] = values[i]?.trim());

        const domainName = row['Domain name'] || row['Domain'];
        const parts = domainName.split('.');

        return {
            source: type,
            domainName,
            tld: parts[1],
            length: parts[0].length,
            currentBid: parseBid(row['Current bid']),
            closingDate: parseDate(row['Release date'] || row['Auction end date']),
        };
    });
}

// ─── DEMO ───

console.log('--- Parsing Preorder CSV ---');
const preorderData = mockParseNamejetCsv(preorderCsv, 'preorder');
console.table(preorderData);

console.log('\n--- Parsing Live CSV ---');
const liveData = mockParseNamejetCsv(liveCsv, 'live');
console.table(liveData);

// ─── FILTERING DEMO ───

const allData = [...preorderData, ...liveData];

console.log('\n--- Filtering for Source: Live ---');
const liveOnly = allData.filter(d => d.source === 'live');
console.table(liveOnly);

console.log('\n--- Filtering for Bid > 100 ---');
const highBids = allData.filter(d => d.currentBid > 100);
console.table(highBids);

console.log('\n--- Filtering for TLD: com ---');
const comOnly = allData.filter(d => d.tld === 'com');
console.table(comOnly);
