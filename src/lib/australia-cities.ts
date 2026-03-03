/**
 * Australian Cities Collection
 * Top cities in Australia with population data
 */

export interface AustraliaCity {
    city: string;
    state: string;
    population: number;
    locId: number;
}

export const AUSTRALIA_CITIES: AustraliaCity[] = [
    { city: "Sydney", state: "NSW", population: 5557233, locId: 2036 },
    { city: "Melbourne", state: "VIC", population: 5464920, locId: 2036 },
    { city: "Brisbane", state: "QLD", population: 2599740, locId: 2036 },
    { city: "Perth", state: "WA", population: 2195090, locId: 2036 },
    { city: "Adelaide", state: "SA", population: 1407600, locId: 2036 },
    { city: "Gold Coast–Tweed Heads", state: "QLD/NSW", population: 721687, locId: 2036 },
    { city: "Canberra–Queanbeyan", state: "ACT/NSW", population: 510641, locId: 2036 },
    { city: "Newcastle–Maitland", state: "NSW", population: 534033, locId: 2036 },
    { city: "Sunshine Coast", state: "QLD", population: 417982, locId: 2036 },
    { city: "Wollongong", state: "NSW", population: 313536, locId: 2036 },
    { city: "Geelong", state: "VIC", population: 285517, locId: 2036 },
    { city: "Hobart", state: "TAS", population: 233592, locId: 2036 },
    { city: "Townsville", state: "QLD", population: 189356, locId: 2036 },
    { city: "Cairns", state: "QLD", population: 163214, locId: 2036 },
    { city: "Toowoomba", state: "QLD", population: 144698, locId: 2036 },
    { city: "Darwin", state: "NT", population: 152489, locId: 2036 },
    { city: "Ballarat", state: "VIC", population: 114979, locId: 2036 },
    { city: "Bendigo", state: "VIC", population: 106022, locId: 2036 },
    { city: "Launceston", state: "TAS", population: 93194, locId: 2036 },
    { city: "Albury–Wodonga", state: "NSW/VIC", population: 101370, locId: 2036 },
    { city: "Mackay", state: "QLD", population: 80966, locId: 2036 },
    { city: "Rockhampton", state: "QLD", population: 79281, locId: 2036 },
    { city: "Bunbury", state: "WA", population: 75273, locId: 2036 },
    { city: "Bundaberg", state: "QLD", population: 70408, locId: 2036 },
    { city: "Hervey Bay", state: "QLD", population: 58400, locId: 2036 },
    { city: "Shepparton–Mooroopna", state: "VIC", population: 67456, locId: 2036 },
    { city: "Port Macquarie", state: "NSW", population: 49685, locId: 2036 },
    { city: "Tamworth", state: "NSW", population: 42100, locId: 2036 },
    { city: "Orange", state: "NSW", population: 42000, locId: 2036 },
    { city: "Dubbo", state: "NSW", population: 40700, locId: 2036 },
    { city: "Geraldton", state: "WA", population: 38600, locId: 2036 },
    { city: "Nowra–Bomaderry", state: "NSW", population: 37900, locId: 2036 },
    { city: "Bathurst", state: "NSW", population: 37700, locId: 2036 },
    { city: "Wagga Wagga", state: "NSW", population: 57700, locId: 2036 },
    { city: "Albany", state: "WA", population: 38000, locId: 2036 },
    { city: "Kalgoorlie–Boulder", state: "WA", population: 29500, locId: 2036 },
    { city: "Lismore", state: "NSW", population: 28000, locId: 2036 },
    { city: "Coffs Harbour", state: "NSW", population: 78000, locId: 2036 },
    { city: "Gladstone", state: "QLD", population: 36000, locId: 2036 },
    { city: "Mount Gambier", state: "SA", population: 28000, locId: 2036 },
    { city: "Whyalla", state: "SA", population: 21500, locId: 2036 },
    { city: "Goulburn", state: "NSW", population: 24000, locId: 2036 },
    { city: "Queanbeyan", state: "NSW", population: 41000, locId: 2036 },
    { city: "Armidale", state: "NSW", population: 24000, locId: 2036 },
    { city: "Warrnambool", state: "VIC", population: 35000, locId: 2036 },
    { city: "Mildura–Buronga", state: "VIC/NSW", population: 56000, locId: 2036 },
    { city: "Traralgon–Morwell", state: "VIC", population: 51000, locId: 2036 },
    { city: "Pakenham", state: "VIC", population: 56000, locId: 2036 },
    { city: "Frankston", state: "VIC", population: 37000, locId: 2036 },
    { city: "Ballina", state: "NSW", population: 27000, locId: 2036 },
    { city: "Gympie", state: "QLD", population: 23000, locId: 2036 },
    { city: "Emerald", state: "QLD", population: 15000, locId: 2036 },
    { city: "Karratha", state: "WA", population: 18000, locId: 2036 },
    { city: "Broome", state: "WA", population: 14500, locId: 2036 },
    { city: "Alice Springs", state: "NT", population: 27000, locId: 2036 },
    { city: "Palmerston", state: "NT", population: 35000, locId: 2036 },
    { city: "Mandurah", state: "WA", population: 89000, locId: 2036 },
    { city: "Logan City", state: "QLD", population: 348000, locId: 2036 },
    { city: "Ipswich", state: "QLD", population: 245000, locId: 2036 },
    { city: "Parramatta", state: "NSW", population: 265000, locId: 2036 },
    { city: "Penrith", state: "NSW", population: 215000, locId: 2036 }
];

/**
 * Get unique city names
 */
export function getAustraliaCityNames(): string[] {
    const uniqueCities = new Set(AUSTRALIA_CITIES.map(c => c.city));
    return Array.from(uniqueCities);
}

/**
 * Get cities by state
 */
export function getCitiesByState(state: string): AustraliaCity[] {
    return AUSTRALIA_CITIES.filter(c => c.state === state);
}

/**
 * Find city by name and state
 */
export function findCity(city: string, state: string): AustraliaCity | undefined {
    return AUSTRALIA_CITIES.find(c => c.city === city && c.state === state);
}

/**
 * Get top N cities by population
 */
export function getTopCities(n: number): AustraliaCity[] {
    return [...AUSTRALIA_CITIES].sort((a, b) => b.population - a.population).slice(0, n);
}
