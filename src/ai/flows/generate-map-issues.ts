'use server';
/**
 * @fileOverview A Genkit flow to generate sample civic issues for the map.
 *
 * - generateMapIssues - A function that generates a list of sample problems.
 * - GenerateMapIssuesInput - The input type for the generateMapIssues function.
 * - GenerateMapIssuesOutput - The return type for the generateMapIssues function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { departments } from '@/lib/data';

const issueTypes = ["Frequent Power Cuts", "Broken Streetlight", "Damaged Transformer", "Billing Issue", "Pothole", "Garbage Overflow", "Water Leakage", "Other"];
const statuses = ['Awaiting Approval', 'Registered', 'In Progress', 'Resolved', 'Rejected'];

const GenerateMapIssuesInputSchema = z.object({
  southWest: z.object({ lat: z.number(), lng: z.number() }),
  northEast: z.object({ lat: z.number(), lng: z.number() }),
  count: z.number().min(1).max(10),
});
export type GenerateMapIssuesInput = z.infer<typeof GenerateMapIssuesInputSchema>;

const GeneratedIssueSchema = z.object({
  id: z.string().describe("A unique ID for the problem, e.g., 'ai-prob-1'"),
  title: z.string().describe("A short, descriptive title for the issue."),
  description: z.string().describe("A brief description of the issue."),
  department: z.enum(departments as [string, ...string[]]).describe("The relevant municipal department."),
  issueType: z.string().describe("The type of issue."),
  status: z.enum(statuses as [string, ...string[]]).describe("The current status of the report."),
  location: z.object({
    address: z.string().describe("A plausible street address for the location."),
    state: z.string().describe("The Indian state for the location."),
    city: z.string().describe("The city for the location."),
    coordinates: z.object({
      lat: z.number().describe("Latitude, must be between the provided south-west and north-east bounds."),
      lng: z.number().describe("Longitude, must be between the provided south-west and north-east bounds."),
    }),
  }),
});

const GenerateMapIssuesOutputSchema = z.object({
    issues: z.array(GeneratedIssueSchema),
});
export type GenerateMapIssuesOutput = z.infer<typeof GenerateMapIssuesOutputSchema>;


export async function generateMapIssues(input: GenerateMapIssuesInput): Promise<GenerateMapIssuesOutput> {
  return generateMapIssuesFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateMapIssuesPrompt',
  input: {schema: GenerateMapIssuesInputSchema},
  output: {schema: GenerateMapIssuesOutputSchema},
  prompt: `You are an AI assistant that generates realistic sample data for a civic issue reporting app in India.
Generate {{{count}}} sample civic issues. Each issue must have coordinates within the following bounding box:
South-West corner: (lat: {{{southWest.lat}}}, lng: {{{southWest.lng}}})
North-East corner: (lat: {{{northEast.lat}}}, lng: {{{northEast.lng}}})

For each issue, provide a realistic title, description, department, issue type, status, and location details including a plausible address.
Ensure the generated address loosely corresponds to the generated coordinates.

Available Departments: {{{departments}}}
Available Issue Types: {{{issueTypes}}}
Available Statuses: {{{statuses}}}
`,
  context: {
    departments: departments,
    issueTypes: issueTypes,
    statuses: statuses,
  }
});


const generateMapIssuesFlow = ai.defineFlow(
  {
    name: 'generateMapIssuesFlow',
    inputSchema: GenerateMapIssuesInputSchema,
    outputSchema: GenerateMapIssuesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
