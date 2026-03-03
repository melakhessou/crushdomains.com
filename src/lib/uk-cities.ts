/**
 * UK Cities Collection
 * Top cities in the UK with population data
 */

export interface UKCity {
    city: string;
    state: string; // Region/Country (England, Scotland, etc.)
    population: number;
    locId: number;
}

export const UK_CITIES: UKCity[] = [
    { city: "London", state: "England", population: 8908081, locId: 2826 },
    { city: "Birmingham", state: "England", population: 1137100, locId: 2826 },
    { city: "Leeds", state: "England", population: 789194, locId: 2826 },
    { city: "Glasgow", state: "Scotland", population: 635640, locId: 2826 },
    { city: "Sheffield", state: "England", population: 582506, locId: 2826 },
    { city: "Bristol", state: "England", population: 567111, locId: 2826 },
    { city: "Manchester", state: "England", population: 547627, locId: 2826 },
    { city: "Bradford", state: "England", population: 537173, locId: 2826 },
    { city: "Liverpool", state: "England", population: 513441, locId: 2826 },
    { city: "Edinburgh", state: "Scotland", population: 488050, locId: 2826 },
    { city: "Leicester", state: "England", population: 464395, locId: 2826 },
    { city: "Coventry", state: "England", population: 362690, locId: 2826 },
    { city: "Cardiff", state: "Wales", population: 361469, locId: 2826 },
    { city: "Wakefield", state: "England", population: 345038, locId: 2826 },
    { city: "Belfast", state: "Northern Ireland", population: 333871, locId: 2826 },
    { city: "Nottingham", state: "England", population: 289301, locId: 2826 },
    { city: "Newcastle upon Tyne", state: "England", population: 300196, locId: 2826 },
    { city: "Brighton and Hove", state: "England", population: 290395, locId: 2826 },
    { city: "Hull", state: "England", population: 260200, locId: 2826 },
    { city: "Plymouth", state: "England", population: 267918, locId: 2826 },
    { city: "Stoke-on-Trent", state: "England", population: 249008, locId: 2826 },
    { city: "Wolverhampton", state: "England", population: 250970, locId: 2826 },
    { city: "Derby", state: "England", population: 255394, locId: 2826 },
    { city: "Portsmouth", state: "England", population: 248440, locId: 2826 },
    { city: "Swansea", state: "Wales", population: 245508, locId: 2826 },
    { city: "Southampton", state: "England", population: 271173, locId: 2826 },
    { city: "Reading", state: "England", population: 162666, locId: 2826 },
    { city: "Milton Keynes", state: "England", population: 207057, locId: 2826 },
    { city: "Aberdeen", state: "Scotland", population: 200680, locId: 2826 },
    { city: "Norwich", state: "England", population: 195971, locId: 2826 },
    { city: "Luton", state: "England", population: 213052, locId: 2826 },
    { city: "York", state: "England", population: 208400, locId: 2826 },
    { city: "Peterborough", state: "England", population: 194000, locId: 2826 },
    { city: "Sunderland", state: "England", population: 277417, locId: 2826 },
    { city: "Northampton", state: "England", population: 212100, locId: 2826 },
    { city: "Ipswich", state: "England", population: 290000, locId: 2826 },
    { city: "Leeds-Bradford Urban Area", state: "England", population: 1500000, locId: 2826 },
    { city: "Cambridge", state: "England", population: 123867, locId: 2826 },
    { city: "Exeter", state: "England", population: 124180, locId: 2826 },
    { city: "Gloucester", state: "England", population: 145563, locId: 2826 },
    { city: "Chelmsford", state: "England", population: 177079, locId: 2826 },
    { city: "Canterbury", state: "England", population: 164553, locId: 2826 },
    { city: "Huddersfield", state: "England", population: 162949, locId: 2826 },
    { city: "Southend-on-Sea", state: "England", population: 160257, locId: 2826 },
    { city: "Newport", state: "Wales", population: 153302, locId: 2826 },
    { city: "Dundee", state: "Scotland", population: 148280, locId: 2826 },
    { city: "St Albans", state: "England", population: 147373, locId: 2826 },
    { city: "West Bromwich", state: "England", population: 146386, locId: 2826 },
    { city: "Poole", state: "England", population: 144800, locId: 2826 },
    { city: "Lancaster", state: "England", population: 144246, locId: 2826 },
    { city: "Telford", state: "England", population: 142723, locId: 2826 },
    { city: "Preston", state: "England", population: 141818, locId: 2826 },
    { city: "Middlesbrough", state: "England", population: 140545, locId: 2826 },
    { city: "Blackpool", state: "England", population: 139305, locId: 2826 },
    { city: "Stockport", state: "England", population: 139052, locId: 2826 },
    { city: "Brighton", state: "England", population: 134293, locId: 2826 },
    { city: "Winchester", state: "England", population: 124295, locId: 2826 },
    { city: "Carlisle", state: "England", population: 108387, locId: 2826 },
    { city: "Worcester", state: "England", population: 101891, locId: 2826 },
    { city: "Lincoln", state: "England", population: 97541, locId: 2826 },
    { city: "Bath", state: "England", population: 94782, locId: 2826 },
    { city: "Chester", state: "England", population: 87507, locId: 2826 },
    { city: "Derry", state: "Northern Ireland", population: 85016, locId: 2826 },
    { city: "Dudley", state: "England", population: 79379, locId: 2826 },
    { city: "Lisburn", state: "Northern Ireland", population: 71465, locId: 2826 },
    { city: "Walsall", state: "England", population: 67594, locId: 2826 },
    { city: "Hereford", state: "England", population: 63024, locId: 2826 },
    { city: "Durham", state: "England", population: 48069, locId: 2826 },
    { city: "Perth", state: "Scotland", population: 47430, locId: 2826 },
    { city: "Inverness", state: "Scotland", population: 47290, locId: 2826 },
    { city: "Salisbury", state: "England", population: 45477, locId: 2826 },
    { city: "Stirling", state: "Scotland", population: 37610, locId: 2826 },
    { city: "Lichfield", state: "England", population: 32877, locId: 2826 },
    { city: "Chichester", state: "England", population: 30925, locId: 2826 },
    { city: "Newry", state: "Northern Ireland", population: 27757, locId: 2826 },
    { city: "Truro", state: "England", population: 21555, locId: 2826 },
    { city: "Ely", state: "England", population: 20256, locId: 2826 },
    { city: "Bangor", state: "Wales", population: 18322, locId: 2826 },
    { city: "Ripon", state: "England", population: 15922, locId: 2826 },
    { city: "Armagh", state: "Northern Ireland", population: 14801, locId: 2826 },
    { city: "Wells", state: "England", population: 10536, locId: 2826 },
    { city: "St Asaph", state: "Wales", population: 3355, locId: 2826 },
    { city: "St Davids", state: "Wales", population: 1800, locId: 2826 }
];

/**
 * Get unique city names
 */
export function getUKCityNames(): string[] {
    const uniqueCities = new Set(UK_CITIES.map(c => c.city));
    return Array.from(uniqueCities);
}

/**
 * Get cities by state (Region/Country)
 */
export function getCitiesByState(state: string): UKCity[] {
    return UK_CITIES.filter(c => c.state === state);
}

/**
 * Find city by name and state
 */
export function findCity(city: string, state: string): UKCity | undefined {
    return UK_CITIES.find(c => c.city === city && c.state === state);
}

/**
 * Get top N cities by population
 */
export function getTopCities(n: number): UKCity[] {
    return [...UK_CITIES].sort((a, b) => b.population - a.population).slice(0, n);
}
