import { getUSACityNames } from './usa-cities';

export type GeoCountry = {
    cities: string[];
    states: { name: string; code: string }[];
};

export const GEO_DATA: Record<string, GeoCountry> = {
    USA: {
        cities: getUSACityNames(), // 200 largest US cities from usa-cities.ts
        states: [
            { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' }, { name: 'Arkansas', code: 'AR' },
            { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' }, { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' },
            { name: 'Florida', code: 'FL' }, { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
            { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' }, { name: 'Kansas', code: 'KS' },
            { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' }, { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' },
            { name: 'Massachusetts', code: 'MA' }, { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
            { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' }, { name: 'Nevada', code: 'NV' },
            { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' }, { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' },
            { name: 'North Carolina', code: 'NC' }, { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
            { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' }, { name: 'South Carolina', code: 'SC' },
            { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' }, { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' },
            { name: 'Vermont', code: 'VT' }, { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
            { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }
        ]
    },
    Canada: {
        cities: [
            'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
            'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'St. John\'s', 'Barrie', 'Kelowna'
        ],
        states: [
            { name: 'Alberta', code: 'AB' }, { name: 'British Columbia', code: 'BC' }, { name: 'Manitoba', code: 'MB' },
            { name: 'New Brunswick', code: 'NB' }, { name: 'Newfoundland and Labrador', code: 'NL' }, { name: 'Nova Scotia', code: 'NS' },
            { name: 'Ontario', code: 'ON' }, { name: 'Prince Edward Island', code: 'PE' }, { name: 'Quebec', code: 'QC' }, { name: 'Saskatchewan', code: 'SK' }
        ]
    },
    Australia: {
        cities: [
            'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Geelong',
            'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Launceston', 'Mackay', 'Rockhampton'
        ],
        states: [
            { name: 'New South Wales', code: 'NSW' }, { name: 'Victoria', code: 'VIC' }, { name: 'Queensland', code: 'QLD' },
            { name: 'Western Australia', code: 'WA' }, { name: 'South Australia', code: 'SA' }, { name: 'Tasmania', code: 'TAS' },
            { name: 'Australian Capital Territory', code: 'ACT' }, { name: 'Northern Territory', code: 'NT' }
        ]
    },
    UK: {
        cities: [
            'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Southampton', 'Liverpool', 'Newcastle', 'Nottingham', 'Sheffield',
            'Bristol', 'Belfast', 'Leicester', 'Edinburgh', 'Cardiff', 'Coventry', 'Bradford', 'Hull', 'Stoke', 'Wolverhampton'
        ],
        states: [
            { name: 'England', code: 'ENG' }, { name: 'Scotland', code: 'SCT' }, { name: 'Wales', code: 'WLS' }, { name: 'Northern Ireland', code: 'NIR' }
        ]
    }
};
