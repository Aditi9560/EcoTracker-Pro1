// Carbon emission factors in kg CO2 per unit
// Sources: EPA, DEFRA, various environmental agencies

export const EMISSION_FACTORS: Record<string, Record<string, { factor: number; unit: string }>> = {
  transport: {
    car_petrol: { factor: 0.21, unit: "km" },          // kg CO2 per km
    car_diesel: { factor: 0.17, unit: "km" },
    car_electric: { factor: 0.05, unit: "km" },
    bus: { factor: 0.089, unit: "km" },
    train: { factor: 0.041, unit: "km" },
    plane_domestic: { factor: 0.255, unit: "km" },
    plane_international: { factor: 0.195, unit: "km" },
    bicycle: { factor: 0, unit: "km" },
    walking: { factor: 0, unit: "km" },
    motorcycle: { factor: 0.113, unit: "km" },
  },
  energy: {
    electricity: { factor: 0.233, unit: "kWh" },       // kg CO2 per kWh
    natural_gas: { factor: 2.0, unit: "m3" },           // kg CO2 per m3
    heating_oil: { factor: 2.54, unit: "liter" },
    solar: { factor: 0, unit: "kWh" },
    wind: { factor: 0, unit: "kWh" },
  },
  food: {
    beef: { factor: 27.0, unit: "kg" },                 // kg CO2 per kg food
    pork: { factor: 12.1, unit: "kg" },
    chicken: { factor: 6.9, unit: "kg" },
    fish: { factor: 6.1, unit: "kg" },
    dairy: { factor: 3.2, unit: "kg" },
    vegetables: { factor: 2.0, unit: "kg" },
    fruits: { factor: 1.1, unit: "kg" },
    grains: { factor: 1.4, unit: "kg" },
    plant_based_meal: { factor: 0.7, unit: "meal" },
    mixed_meal: { factor: 2.5, unit: "meal" },
  },
  shopping: {
    clothing: { factor: 15.0, unit: "item" },
    electronics: { factor: 50.0, unit: "item" },
    furniture: { factor: 30.0, unit: "item" },
    general: { factor: 5.0, unit: "item" },
  },
  waste: {
    general_waste: { factor: 0.587, unit: "kg" },
    recycling: { factor: 0.021, unit: "kg" },
    compost: { factor: 0.01, unit: "kg" },
  },
};

export function calculateEmission(category: string, type: string, value: number): number {
  const categoryFactors = EMISSION_FACTORS[category];
  if (!categoryFactors) {
    throw new Error(`Unknown category: ${category}`);
  }

  const typeInfo = categoryFactors[type];
  if (!typeInfo) {
    throw new Error(`Unknown type '${type}' for category '${category}'`);
  }

  return Math.round(value * typeInfo.factor * 1000) / 1000; // Round to 3 decimal places
}

export function getAvailableTypes(category: string): string[] {
  const categoryFactors = EMISSION_FACTORS[category];
  return categoryFactors ? Object.keys(categoryFactors) : [];
}

export function getCategories(): string[] {
  return Object.keys(EMISSION_FACTORS);
}
