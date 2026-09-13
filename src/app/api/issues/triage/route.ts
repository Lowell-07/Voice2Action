import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const departments = [
  "Electric Department",
  "Municipal Department",
  "Water & Sewerage",
  "Roads & Transport",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_url = '', title = '', description = '' } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json({
        is_valid: false,
        rejection_reason: 'Please provide a more detailed description of the civic problem.',
        suggested_department: null,
        severity: null,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an AI assistant for a civic issue reporting platform (Voice2Action).
Evaluate if the reported issue is a genuine civic issue (e.g., pothole, broken streetlight, water leakage, garbage overflow, drainage).
Allowed departments: ${departments.join(', ')}.

Title: ${title}
Description: ${description}
${image_url ? `Image URL: ${image_url}` : ''}

Respond in JSON with:
{
  "is_valid": boolean,
  "rejection_reason": string or null,
  "suggested_department": one of the allowed departments or closest match,
  "severity": integer from 1 to 10
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return NextResponse.json({
            is_valid: parsed.is_valid ?? true,
            rejection_reason: parsed.rejection_reason || null,
            suggested_department: parsed.suggested_department || 'Municipal Department',
            severity: parsed.severity || 5,
          });
        }
      } catch (geminiError) {
        console.warn('Gemini triage error, falling back to rule-based classification:', geminiError);
      }
    }

    // Heuristic rule-based fallback
    const text = `${title} ${description}`.toLowerCase();
    let suggestedDept = 'Municipal Department';

    if (text.match(/electric|power|wire|pole|streetlight|light|transformer|blackout|voltage|shock/)) {
      suggestedDept = 'Electric Department';
    } else if (text.match(/water|pipe|leak|drain|drainage|sewage|overflow|sewer|flood|tap/)) {
      suggestedDept = 'Water & Sewerage';
    } else if (text.match(/road|pothole|traffic|signal|street|footpath|pavement|asphalt|divider|bridge/)) {
      suggestedDept = 'Roads & Transport';
    } else if (text.match(/garbage|trash|waste|dump|clean|dustbin|park|dog|animal/)) {
      suggestedDept = 'Municipal Department';
    }

    return NextResponse.json({
      is_valid: true,
      rejection_reason: null,
      suggested_department: suggestedDept,
      severity: text.includes('emergency') || text.includes('danger') || text.includes('urgent') ? 8 : 5,
    });
  } catch (err: any) {
    return NextResponse.json(
      { is_valid: false, rejection_reason: err?.message || 'Failed to triage issue' },
      { status: 500 }
    );
  }
}
