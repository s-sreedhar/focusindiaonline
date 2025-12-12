export type Zone = 'A' | 'B' | 'C' | 'D' | 'E';

interface ZoneRate {
    base: number; // Charge for first 0.5kg
    step0_5: number; // Charge for 0.5kg
    step1: number;   // Charge for 1kg
    step2: number;   // Charge for 2kg
    step3: number;   // Charge for 3kg
    step5: number;   // Charge for 5kg
    extraPerKg: number; // Charge for every extra kg beyond last step (assuming 5kg for now, pattern needs clarification but using 5kg column as max base)
}

// Based on the provided image
const SHIPPING_RATES: Record<Zone, {
    '0.5': number;
    '1': number;
    '2': number;
    '3': number;
    '5': number;
    'extra': number;
}> = {
    'A': { '0.5': 45, '1': 60, '2': 90, '3': 120, '5': 160, 'extra': 40 },
    'B': { '0.5': 55, '1': 75, '2': 110, '3': 145, '5': 185, 'extra': 45 },
    'C': { '0.5': 65, '1': 85, '2': 130, '3': 160, '5': 210, 'extra': 50 },
    'D': { '0.5': 75, '1': 95, '2': 150, '3': 180, '5': 235, 'extra': 55 },
    'E': { '0.5': 85, '1': 110, '2': 165, '3': 195, '5': 260, 'extra': 60 },
};

const STATE_ZONES: Record<string, Zone> = {
    // Zone A
    'Telangana': 'A',
    'Andhra Pradesh': 'A',

    // Zone B
    'Karnataka': 'B',
    'Tamil Nadu': 'B',
    'Kerala': 'B',

    // Zone C
    'Maharashtra': 'C',
    'Gujarat': 'C',
    'Madhya Pradesh': 'C',
    'Chhattisgarh': 'C',

    // Zone D
    'Delhi': 'D',
    'Haryana': 'D',
    'Punjab': 'D',
    'Uttar Pradesh': 'D',
    'Rajasthan': 'D',
    'Uttarakhand': 'D',

    // Zone E
    'West Bengal': 'E',
    'Bihar': 'E',
    'Jharkhand': 'E',
    'Odisha': 'E',
    'Assam': 'E',
    'Meghalaya': 'E',
    'Manipur': 'E',
    'Nagaland': 'E',
    'Tripura': 'E',
    'Arunachal Pradesh': 'E',
    'Mizoram': 'E',
    'Sikkim': 'E',
};

// Default mapping for unlisted states/UTs (Mapping to nearest/safest zone - usually D or E for remote, C for central)
// The chart doesn't cover all UTs explicitly, mapping reasonable defaults
const DEFAULT_ZONE: Zone = 'D';

export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const getZoneForState = (state: string): Zone => {
    // Simple check, in real app might need fuzzy match or dropdown guarantees exact string
    const normalizedState = state.trim();
    // Check known mappings
    for (const [key, zone] of Object.entries(STATE_ZONES)) {
        if (key.toLowerCase() === normalizedState.toLowerCase()) return zone;
    }
    // Hardcoded Logic for missing ones to be safe
    if (normalizedState.includes('Jammu') || normalizedState.includes('Kashmir') || normalizedState.includes('Ladakh')) return 'D';
    if (normalizedState.includes('Goa')) return 'C';

    return DEFAULT_ZONE;
};

export const calculateShippingCharges = (weightInGrams: number, state: string): { charges: number, zone: Zone, weightUsed: number } => {
    const zone = getZoneForState(state);
    const rates = SHIPPING_RATES[zone];

    // Convert to KG, Round up to nearest 0.5?? 
    // The chart has discrete steps: 0.5, 1, 2, 3, 5.
    // "Extra / kg" implies logic for > 5kg.
    // Logic for intermediate weights (e.g. 1.2kg)? Usually simple interpolation or ceiling. 
    // Carrier logic is usually "next bracket". 
    // 0-0.5 -> 0.5 rate
    // 0.5-1 -> 1 rate
    // 1-2 -> 2 rate
    // 2-3 -> 3 rate
    // 3-5 -> 5 rate
    // >5 -> 5 rate + (extra * ceil(weight - 5))

    const weightInKg = Math.max(0.1, weightInGrams / 1000);
    let charges = 0;

    if (weightInKg <= 0.5) charges = rates['0.5'];
    else if (weightInKg <= 1.0) charges = rates['1'];
    else if (weightInKg <= 2.0) charges = rates['2'];
    else if (weightInKg <= 3.0) charges = rates['3'];
    else if (weightInKg <= 5.0) charges = rates['5'];
    else {
        // Over 5kg
        const extraWeight = Math.ceil(weightInKg - 5);
        charges = rates['5'] + (extraWeight * rates['extra']);
    }

    return { charges, zone, weightUsed: weightInKg };
};
