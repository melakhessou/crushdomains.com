/**
 * Canadian Cities Collection
 * Top 100 cities in Canada with population data
 */

export interface CanadaCity {
    city: string;
    state: string; // Province
    population: number;
    locId: number;
}

export const CANADA_CITIES: CanadaCity[] = [
    { "city": "Toronto", "state": "ON", "population": 3273119, locId: 2124 },
    { "city": "Montreal", "state": "QC", "population": 1945359, locId: 2124 },
    { "city": "Calgary", "state": "AB", "population": 1569133, locId: 2124 },
    { "city": "Edmonton", "state": "AB", "population": 1190458, locId: 2124 },
    { "city": "Ottawa", "state": "ON", "population": 1017449, locId: 2124 },
    { "city": "Winnipeg", "state": "MB", "population": 749607, locId: 2124 },
    { "city": "Vancouver", "state": "BC", "population": 662248, locId: 2124 },
    { "city": "Mississauga", "state": "ON", "population": 717961, locId: 2124 },
    { "city": "Brampton", "state": "ON", "population": 656480, locId: 2124 },
    { "city": "Hamilton", "state": "ON", "population": 569353, locId: 2124 },
    { "city": "Quebec City", "state": "QC", "population": 549459, locId: 2124 },
    { "city": "Surrey", "state": "BC", "population": 568322, locId: 2124 },
    { "city": "Laval", "state": "QC", "population": 451958, locId: 2124 },
    { "city": "Halifax", "state": "NS", "population": 448544, locId: 2124 },
    { "city": "London", "state": "ON", "population": 422324, locId: 2124 },
    { "city": "Markham", "state": "ON", "population": 338503, locId: 2124 },
    { "city": "Gatineau", "state": "QC", "population": 291041, locId: 2124 },
    { "city": "Vaughan", "state": "ON", "population": 323103, locId: 2124 },
    { "city": "Longueuil", "state": "QC", "population": 254483, locId: 2124 },
    { "city": "Windsor", "state": "ON", "population": 233763, locId: 2124 },
    { "city": "Kitchener", "state": "ON", "population": 256885, locId: 2124 },
    { "city": "Burnaby", "state": "BC", "population": 249197, locId: 2124 },
    { "city": "Saskatoon", "state": "SK", "population": 266141, locId: 2124 },
    { "city": "Regina", "state": "SK", "population": 226404, locId: 2124 },
    { "city": "Richmond", "state": "BC", "population": 209937, locId: 2124 },
    { "city": "Oakville", "state": "ON", "population": 213759, locId: 2124 },
    { "city": "Burlington", "state": "ON", "population": 186948, locId: 2124 },
    { "city": "Richmond Hill", "state": "ON", "population": 202022, locId: 2124 },
    { "city": "Greater Sudbury", "state": "ON", "population": 170605, locId: 2124 },
    { "city": "Sherbrooke", "state": "QC", "population": 172950, locId: 2124 },
    { "city": "Saguenay", "state": "QC", "population": 144723, locId: 2124 },
    { "city": "Oshawa", "state": "ON", "population": 175383, locId: 2124 },
    { "city": "St. Catharines", "state": "ON", "population": 133113, locId: 2124 },
    { "city": "Levis", "state": "QC", "population": 149683, locId: 2124 },
    { "city": "Barrie", "state": "ON", "population": 153356, locId: 2124 },
    { "city": "Trois-Rivieres", "state": "QC", "population": 139163, locId: 2124 },
    { "city": "Abbotsford", "state": "BC", "population": 153569, locId: 2124 },
    { "city": "Cambridge", "state": "ON", "population": 138479, locId: 2124 },
    { "city": "Kingston", "state": "ON", "population": 132485, locId: 2124 },
    { "city": "Guelph", "state": "ON", "population": 143740, locId: 2124 },
    { "city": "Whitby", "state": "ON", "population": 138501, locId: 2124 },
    { "city": "Thunder Bay", "state": "ON", "population": 108843, locId: 2124 },
    { "city": "Saanich", "state": "BC", "population": 117735, locId: 2124 },
    { "city": "Chatham-Kent", "state": "ON", "population": 102042, locId: 2124 },
    { "city": "Kelowna", "state": "BC", "population": 144576, locId: 2124 },
    { "city": "Cape Breton", "state": "NS", "population": 93000, locId: 2124 },
    { "city": "St. John’s", "state": "NL", "population": 110525, locId: 2124 },
    { "city": "Waterloo", "state": "ON", "population": 121436, locId: 2124 },
    { "city": "Delta", "state": "BC", "population": 111281, locId: 2124 },
    { "city": "Terrebonne", "state": "QC", "population": 119944, locId: 2124 },
    { "city": "Langley", "state": "BC", "population": 132603, locId: 2124 },
    { "city": "Brantford", "state": "ON", "population": 104688, locId: 2124 },
    { "city": "Ajax", "state": "ON", "population": 126666, locId: 2124 },
    { "city": "Pickering", "state": "ON", "population": 99486, locId: 2124 },
    { "city": "Saint-Jean-sur-Richelieu", "state": "QC", "population": 101531, locId: 2124 },
    { "city": "Red Deer", "state": "AB", "population": 100844, locId: 2124 },
    { "city": "North Vancouver", "state": "BC", "population": 58120, locId: 2124 },
    { "city": "Strathcona County", "state": "AB", "population": 99325, locId: 2124 },
    { "city": "Niagara Falls", "state": "ON", "population": 94915, locId: 2124 },
    { "city": "Kamloops", "state": "BC", "population": 97802, locId: 2124 },
    { "city": "Nanaimo", "state": "BC", "population": 99240, locId: 2124 },
    { "city": "Victoria", "state": "BC", "population": 91867, locId: 2124 },
    { "city": "Clarington", "state": "ON", "population": 105000, locId: 2124 },
    { "city": "Repentigny", "state": "QC", "population": 84865, locId: 2124 },
    { "city": "Sault Ste. Marie", "state": "ON", "population": 73368, locId: 2124 },
    { "city": "Peterborough", "state": "ON", "population": 83943, locId: 2124 },
    { "city": "Lethbridge", "state": "AB", "population": 101482, locId: 2124 },
    { "city": "Kawartha Lakes", "state": "ON", "population": 75423, locId: 2124 },
    { "city": "Newmarket", "state": "ON", "population": 87942, locId: 2124 },
    { "city": "Sarnia", "state": "ON", "population": 71594, locId: 2124 },
    { "city": "Brossard", "state": "QC", "population": 85721, locId: 2124 },
    { "city": "Prince George", "state": "BC", "population": 74343, locId: 2124 },
    { "city": "Chilliwack", "state": "BC", "population": 83790, locId: 2124 },
    { "city": "Maple Ridge", "state": "BC", "population": 91879, locId: 2124 },
    { "city": "Saint John", "state": "NB", "population": 69795, locId: 2124 },
    { "city": "Drummondville", "state": "QC", "population": 79487, locId: 2124 },
    { "city": "Moncton", "state": "NB", "population": 79470, locId: 2124 },
    { "city": "Saint-Jerome", "state": "QC", "population": 80213, locId: 2124 },
    { "city": "Norfolk County", "state": "ON", "population": 64644, locId: 2124 },
    { "city": "New Westminster", "state": "BC", "population": 78916, locId: 2124 },
    { "city": "St. Albert", "state": "AB", "population": 68658, locId: 2124 },
    { "city": "Caledon", "state": "ON", "population": 76681, locId: 2124 },
    { "city": "Medicine Hat", "state": "AB", "population": 63260, locId: 2124 },
    { "city": "Halton Hills", "state": "ON", "population": 62151, locId: 2124 },
    { "city": "North Bay", "state": "ON", "population": 51553, locId: 2124 },
    { "city": "Milton", "state": "ON", "population": 132979, locId: 2124 },
    { "city": "Port Coquitlam", "state": "BC", "population": 61258, locId: 2124 },
    { "city": "Shawinigan", "state": "QC", "population": 50860, locId: 2124 },
    { "city": "Saint-Hyacinthe", "state": "QC", "population": 57139, locId: 2124 },
    { "city": "Wood Buffalo", "state": "AB", "population": 71589, locId: 2124 },
    { "city": "Fredericton", "state": "NB", "population": 58220, locId: 2124 },
    { "city": "Welland", "state": "ON", "population": 55293, locId: 2124 },
    { "city": "Dollard-des-Ormeaux", "state": "QC", "population": 48993, locId: 2124 },
    { "city": "Belleville", "state": "ON", "population": 55718, locId: 2124 },
    { "city": "Granby", "state": "QC", "population": 69025, locId: 2124 },
    { "city": "Aurora", "state": "ON", "population": 62979, locId: 2124 },
    { "city": "Grande Prairie", "state": "AB", "population": 66973, locId: 2124 },
    { "city": "Blainville", "state": "QC", "population": 59494, locId: 2124 },
    { "city": "Cornwall", "state": "ON", "population": 46589, locId: 2124 }
];

/**
 * Get unique city names
 */
export function getCanadaCityNames(): string[] {
    const uniqueCities = new Set(CANADA_CITIES.map(c => c.city));
    return Array.from(uniqueCities);
}

/**
 * Get cities by state (Province)
 */
export function getCitiesByState(state: string): CanadaCity[] {
    return CANADA_CITIES.filter(c => c.state === state);
}

/**
 * Find city by name and state
 */
export function findCity(city: string, state: string): CanadaCity | undefined {
    return CANADA_CITIES.find(c => c.city === city && c.state === state);
}

/**
 * Get top N cities by population
 */
export function getTopCities(n: number): CanadaCity[] {
    return [...CANADA_CITIES].sort((a, b) => b.population - a.population).slice(0, n);
}
