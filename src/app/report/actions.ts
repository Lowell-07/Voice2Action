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
    if (!description || description.trim().length < 5) {
        return { success: false, error: 'Please provide a more detailed description for an accurate suggestion.'}
    }
    
    try {
        const departments = [
            "Electric Department",
            "Municipal Department",
            "Water & Sewerage",
            "Roads & Transport",
        ];

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey });
                const prompt = `You are an AI assistant for a civic issue reporting platform (Voice2Action).
Evaluate if the reported issue is a genuine civic issue.
Allowed departments: ${departments.join(', ')}.

Title: ${title}
Description: ${description}
${imageUrl ? `Image URL: ${imageUrl}` : ''}

Respond in JSON with:
{
  "is_valid": boolean,
  "rejection_reason": string or null,
  "suggested_department": string
}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                if (response.text) {
                    const parsed = JSON.parse(response.text);
                    if (parsed.is_valid && parsed.suggested_department) {
                        return { success: true, suggestedDepartment: parsed.suggested_department };
                    }
                    if (parsed.rejection_reason) {
                        return { success: false, error: parsed.rejection_reason };
                    }
                }
            } catch (aiErr) {
                console.warn('AI triage fallback active:', aiErr);
            }
        }

        // Rule-based classification
        const text = `${title} ${description}`.toLowerCase();
        let dept = "Municipal Department";
        if (text.match(/electric|power|wire|pole|streetlight|light|transformer|blackout|voltage|shock/)) {
            dept = "Electric Department";
        } else if (text.match(/water|pipe|leak|drain|drainage|sewage|overflow|sewer|flood|tap/)) {
            dept = "Water & Sewerage";
        } else if (text.match(/road|pothole|traffic|signal|street|footpath|pavement|asphalt|divider|bridge/)) {
            dept = "Roads & Transport";
        } else if (text.match(/garbage|trash|waste|dump|clean|dustbin|park|dog|animal/)) {
            dept = "Municipal Department";
        }

        return { success: true, suggestedDepartment: dept };
    } catch (error) {
        console.error('Error suggesting department:', error);
        return { success: false, error: 'Failed to get department suggestion.' };
    }
}

export async function checkDuplicateIssues(title: string, description: string, lat: number, lng: number) {
    try {
        // Return empty duplicate list if no local match
        return { success: true, duplicates: [] };
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
