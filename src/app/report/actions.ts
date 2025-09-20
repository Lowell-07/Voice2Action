'use server';

import { suggestDepartment } from '@/ai/flows/suggest-department';
import { suggestAddressCompletions } from '@/ai/flows/suggest-address-completions';
import { departments } from '@/lib/data';

export async function getLocationSuggestion(coordinates: {latitude: number, longitude: number}): Promise<{success: boolean, locationName?: string, error?: string}> {
  try {
    const { latitude, longitude } = coordinates;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Voice2Action App' // OSM requires a user agent
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from OpenStreetMap: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
       return { success: true, locationName: data.display_name };
    } else {
       return { success: false, error: 'Could not find a location name for the given coordinates.' };
    }
  } catch (error) {
    console.error('Error suggesting location:', error);
    return { success: false, error: 'Failed to get location suggestion.' };
  }
}

export async function getDepartmentSuggestion(description: string): Promise<{success: boolean, suggestedDepartment?: string, error?: string}> {
    if (!description || description.trim().length < 10) {
        return { success: false, error: 'Please provide a more detailed description for an accurate suggestion.'}
    }
    
    try {
        const result = await suggestDepartment({ description, departments });
        if (result.suggestedDepartment) {
            return { success: true, suggestedDepartment: result.suggestedDepartment };
        } else {
            return { success: false, error: 'Could not determine a suitable department. Please select one manually.' };
        }
    } catch (error) {
        console.error('Error suggesting department:', error);
        return { success: false, error: 'Failed to get department suggestion.' };
    }
}

export async function getAddressCompletions(query: string): Promise<{success: boolean, suggestions?: string[], error?: string}> {
    if (!query || query.trim().length < 3) {
        return { success: true, suggestions: [] };
    }

    try {
        const result = await suggestAddressCompletions({ query });
        return { success: true, suggestions: result.suggestions };
    } catch (error) {
        console.error('Error getting address completions:', error);
        return { success: false, error: 'Failed to get address suggestions.' };
    }
}
