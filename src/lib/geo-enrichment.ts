/**
 * Geo Domain Enrichment Utility
 * Joins geo domain results with city data from usa_cities collection
 */

import { USA_CITIES, type USACity } from './usa-cities';

export interface GeoDomainResult {
    domain: string;
    city?: string;
    score: number;
    style: string;
}

export interface EnrichedGeoDomain {
    domain: string;
    city: string;
    state: string | null;
    population: number | null;
    score: number;
    style: string;
}

/**
 * Normalize city name for matching
 * Handles: case, hyphens, spaces, accents
 */
function normalizeCityName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[-\s]+/g, '')          // Remove hyphens and spaces
        .replace(/[^a-z]/g, '');          // Keep only letters
}

/**
 * Build a lookup map for fast city matching
 */
const cityLookupMap = new Map<string, USACity>();

// Initialize lookup map with normalized city names
USA_CITIES.forEach(cityData => {
    const normalizedName = normalizeCityName(cityData.city);
    // Only add if not already present (first match wins for duplicates like Aurora)
    if (!cityLookupMap.has(normalizedName)) {
        cityLookupMap.set(normalizedName, cityData);
    }
});

/**
 * Find city data by name with tolerant matching
 */
export function findCityData(cityName: string): USACity | null {
    const normalized = normalizeCityName(cityName);
    return cityLookupMap.get(normalized) ?? null;
}

/**
 * Extract city name from geo domain
 * e.g., "newyorkdental.com" with keyword "dental" -> "newyork" -> "New York"
 */
export function extractCityFromDomain(
    domain: string,
    keyword: string,
    position: 'before' | 'after'
): string | null {
    // Remove .com/.net/etc
    const domainName = domain.split('.')[0].toLowerCase();
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');

    let cityPart: string;

    if (position === 'after') {
        // City + Keyword: e.g., "newyorkdental" -> "newyork"
        if (domainName.endsWith(cleanKeyword)) {
            cityPart = domainName.slice(0, -cleanKeyword.length);
        } else {
            return null;
        }
    } else {
        // Keyword + City: e.g., "dentalnewyork" -> "newyork"
        if (domainName.startsWith(cleanKeyword)) {
            cityPart = domainName.slice(cleanKeyword.length);
        } else {
            return null;
        }
    }

    // Find matching city
    const cityData = findCityData(cityPart);
    return cityData?.city ?? null;
}

/**
 * Enrich a list of geo domain results with city/state/population data
 */
export function enrichGeoDomains(
    domains: GeoDomainResult[],
    keyword: string,
    position: 'before' | 'after' = 'after'
): EnrichedGeoDomain[] {
    return domains.map(d => {
        // Try to extract city from domain
        const cityName = d.city || extractCityFromDomain(d.domain, keyword, position);

        if (!cityName) {
            return {
                ...d,
                city: 'Unknown',
                state: null,
                population: null,
            };
        }

        // Look up city data
        const cityData = findCityData(cityName);

        if (cityData) {
            return {
                ...d,
                city: cityData.city,
                state: cityData.state,
                population: cityData.population,
            };
        }

        // No match found
        return {
            ...d,
            city: cityName,
            state: null,
            population: null,
        };
    });
}

/**
 * Sort enriched geo domains by population (descending)
 */
export function sortByPopulation(domains: EnrichedGeoDomain[]): EnrichedGeoDomain[] {
    return [...domains].sort((a, b) => {
        // Nulls go to the end
        if (a.population === null && b.population === null) return 0;
        if (a.population === null) return 1;
        if (b.population === null) return -1;
        return b.population - a.population;
    });
}

/**
 * Format population with thousands separator
 */
export function formatPopulation(population: number | null): string {
    if (population === null) return 'N/A';
    return population.toLocaleString('en-US');
}
