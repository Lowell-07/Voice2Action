'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting a department based on a problem description.
 *
 * - suggestDepartment - A function that takes a problem description and a list of departments and returns a suggested department.
 * - SuggestDepartmentInput - The input type for the suggestDepartment function.
 * - SuggestDepartmentOutput - The return type for the suggestDepartment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDepartmentInputSchema = z.object({
  description: z.string().describe('The description of the problem.'),
  departments: z.array(z.string()).describe('The list of available departments.'),
});
export type SuggestDepartmentInput = z.infer<typeof SuggestDepartmentInputSchema>;

const SuggestDepartmentOutputSchema = z.object({
    suggestedDepartment: z.string().describe('The suggested department from the provided list. If no department is relevant, this will be empty.'),
});
export type SuggestDepartmentOutput = z.infer<typeof SuggestDepartmentOutputSchema>;

export async function suggestDepartment(input: SuggestDepartmentInput): Promise<SuggestDepartmentOutput> {
  return suggestDepartmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDepartmentPrompt',
  input: {schema: SuggestDepartmentInputSchema},
  output: {schema: SuggestDepartmentOutputSchema},
  prompt: `You are an expert at routing civic issues to the correct department.
Based on the problem description, choose the most relevant department from the following list.
The available departments are: {{{departments}}}.

Problem Description:
"{{{description}}}"

If the description is too vague or does not seem to relate to any of the departments, return an empty string for the suggestedDepartment.
Otherwise, return the name of the most appropriate department.`,
});

const suggestDepartmentFlow = ai.defineFlow(
  {
    name: 'suggestDepartmentFlow',
    inputSchema: SuggestDepartmentInputSchema,
    outputSchema: SuggestDepartmentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
