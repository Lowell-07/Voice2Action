'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing address completion suggestions.
 *
 * - suggestAddressCompletions - A function that takes a partial address string and returns a list of completion suggestions.
 * - SuggestAddressCompletionsInput - The input type for the suggestAddressCompletions function.
 * - SuggestAddressCompletionsOutput - The return type for the suggestAddressCompletions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAddressCompletionsInputSchema = z.object({
  query: z.string().describe('The partial address query.'),
});
export type SuggestAddressCompletionsInput = z.infer<typeof SuggestAddressCompletionsInputSchema>;

const SuggestAddressCompletionsOutputSchema = z.object({
    suggestions: z.array(z.string()).describe('A list of up to 5 address completion suggestions.'),
});
export type SuggestAddressCompletionsOutput = z.infer<typeof SuggestAddressCompletionsOutputSchema>;

export async function suggestAddressCompletions(input: SuggestAddressCompletionsInput): Promise<SuggestAddressCompletionsOutput> {
  return suggestAddressCompletionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAddressCompletionsPrompt',
  input: {schema: SuggestAddressCompletionsInputSchema},
  output: {schema: SuggestAddressCompletionsOutputSchema},
  prompt: `You are a helpful assistant that provides address completion suggestions.
Based on the user's partial query, provide a list of up to 5 plausible address completions.
The user is likely in India.

Partial Query: "{{{query}}}"

Return only the suggestions in the specified format. Do not provide addresses that are too specific if the query is broad.
For example, if the query is "Bangalore", suggest different areas within Bangalore.
If the query is "Main Street, Bangalore", suggest more specific landmarks or building numbers on that street.
`,
});

const suggestAddressCompletionsFlow = ai.defineFlow(
  {
    name: 'suggestAddressCompletionsFlow',
    inputSchema: SuggestAddressCompletionsInputSchema,
    outputSchema: SuggestAddressCompletionsOutputSchema,
  },
  async (input) => {
    // In a real application, this would ideally query a mapping API like Google Places.
    // For this prototype, we'll use a generative model to simulate the suggestions.
    const {output} = await prompt(input);
    return output!;
  }
);
