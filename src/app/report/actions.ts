'use server';

import { suggestLocationFromGPS } from '@/ai/flows/suggest-location-from-gps';

export async function getLocationSuggestion(): Promise<{success: boolean, locationName?: string, error?: string}> {
  // Hardcoded GPS for demonstration purposes (New Delhi)
  const coordinates = {
    latitude: 28.6139,
    longitude: 77.2090,
  };

  try {
    const result = await suggestLocationFromGPS(coordinates);
    return { success: true, locationName: result.locationName };
  } catch (error) {
    console.error('Error suggesting location:', error);
    return { success: false, error: 'Failed to get location suggestion.' };
  }
}
