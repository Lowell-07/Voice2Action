'use server';

export async function getLocationSuggestion(coordinates: {latitude: number, longitude: number}): Promise<{success: boolean, locationName?: string, state?: string, error?: string}> {
  try {
    const { latitude, longitude } = coordinates;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Voice2Action App'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from OpenStreetMap: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
       return { success: true, locationName: data.display_name, state: data.address?.state };
    } else {
       return { success: false, error: 'Could not find a location name for the given coordinates.' };
    }
  } catch (error) {
    console.error('Error suggesting location:', error);
    return { success: false, error: 'Failed to get location suggestion.' };
  }
}

export async function getDepartmentSuggestion(description: string, title: string = "", imageUrl: string = ""): Promise<{success: boolean, suggestedDepartment?: string, error?: string}> {
    if (!description || description.trim().length < 10) {
        return { success: false, error: 'Please provide a more detailed description for an accurate suggestion.'}
    }
    
    try {
        const res = await fetch('http://localhost:8000/api/issues/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl, title, description })
        });
        const data = await res.json();
        
        if (data.is_valid && data.suggested_department) {
            return { success: true, suggestedDepartment: data.suggested_department };
        } else {
            return { success: false, error: data.rejection_reason || 'Could not determine a suitable department.' };
        }
    } catch (error) {
        console.error('Error suggesting department:', error);
        return { success: false, error: 'Failed to get department suggestion.' };
    }
}

export async function checkDuplicateIssues(title: string, description: string, lat: number, lng: number) {
    try {
        const res = await fetch('http://localhost:8000/api/issues/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, lat, lng })
        });
        const data = await res.json();
        return { success: true, duplicates: data };
    } catch (error) {
        console.error('Error checking duplicates:', error);
        return { success: false, error: 'Failed to check duplicates.' };
    }
}

export async function getAddressCompletions(query: string): Promise<{success: boolean, suggestions?: string[], error?: string}> {
    if (!query || query.trim().length < 3) {
        return { success: true, suggestions: [] };
    }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, { 
            headers: { 'User-Agent': 'Voice2Action App' } 
        });
        const data = await res.json();
        const suggestions = data.map((d: any) => d.display_name);
        return { success: true, suggestions };
    } catch (error) {
        console.error('Error getting address completions:', error);
        return { success: false, error: 'Failed to get address suggestions.' };
    }
}
