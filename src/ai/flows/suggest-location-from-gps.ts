// src/ai/flows/suggest-location-from-gps.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting location names based on GPS coordinates.
 *
 * - suggestLocationFromGPS - A function that takes latitude and longitude as input and returns a suggested location name.
 * - SuggestLocationFromGPSInput - The input type for the suggestLocationFromGPS function.
 * - SuggestLocationFromGPSOutput - The return type for the suggestLocationFromGPS function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLocationFromGPSInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type SuggestLocationFromGPSInput = z.infer<
  typeof SuggestLocationFromGPSInputSchema
>;

const SuggestLocationFromGPSOutputSchema = z.object({
  locationName: z
    .string()
    .describe('The suggested location name based on the GPS coordinates.'),
});
export type SuggestLocationFromGPSOutput = z.infer<
  typeof SuggestLocationFromGPSOutputSchema
>;

export async function suggestLocationFromGPS(
  input: SuggestLocationFromGPSInput
): Promise<SuggestLocationFromGPSOutput> {
  return suggestLocationFromGPSFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLocationFromGPSPrompt',
  input: {schema: SuggestLocationFromGPSInputSchema},
  output: {schema: SuggestLocationFromGPSOutputSchema},
  prompt: `You are a geolocation expert. Given the latitude and longitude, you will provide a suitable location name.

Latitude: {{{latitude}}}
Longitude: {{{longitude}}}

Location Name:`,
});

const suggestLocationFromGPSFlow = ai.defineFlow(
  {
    name: 'suggestLocationFromGPSFlow',
    inputSchema: SuggestLocationFromGPSInputSchema,
    outputSchema: SuggestLocationFromGPSOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
