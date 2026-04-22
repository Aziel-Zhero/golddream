'use server';
/**
 * @fileOverview A Genkit flow that processes natural language queries to extract structured product search parameters.
 *
 * - naturalLanguageProductSearch - A function that processes the natural language query.
 * - NaturalLanguageProductSearchInput - The input type for the naturalLanguageProductSearch function.
 * - NaturalLanguageProductSearchOutput - The return type for the naturalLanguageProductSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NaturalLanguageProductSearchInputSchema = z.object({
  query: z.string().describe('The natural language query from the user (e.g., "a cozy sweater for winter", "a stylish dress for a wedding").'),
});
export type NaturalLanguageProductSearchInput = z.infer<typeof NaturalLanguageProductSearchInputSchema>;

const NaturalLanguageProductSearchOutputSchema = z.object({
  keywords: z.array(z.string()).describe('A list of general keywords extracted from the query.'),
  category: z.string().nullable().describe('The product category (e.g., "sweater", "dress", "t-shirt"). Returns null if not specified or inferable.'),
  occasion: z.string().nullable().describe('The occasion for the product (e.g., "winter", "wedding", "casual", "work"). Returns null if not specified or inferable.'),
  style: z.string().nullable().describe('The style of the product (e.g., "cozy", "stylish", "formal", "sporty", "minimalist"). Returns null if not specified or inferable.'),
  colors: z.array(z.string()).describe('A list of colors mentioned in the query (e.g., "red", "blue", "black").'),
  materials: z.array(z.string()).describe('A list of materials mentioned in the query (e.g., "cotton", "wool", "silk").'),
  minPrice: z.number().nullable().describe('The minimum price mentioned in the query. Returns null if not specified.'),
  maxPrice: z.number().nullable().describe('The maximum price mentioned in the query. Returns null if not specified.'),
});
export type NaturalLanguageProductSearchOutput = z.infer<typeof NaturalLanguageProductSearchOutputSchema>;

export async function naturalLanguageProductSearch(
  input: NaturalLanguageProductSearchInput
): Promise<NaturalLanguageProductSearchOutput> {
  return naturalLanguageProductSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageProductSearchPrompt',
  input: { schema: NaturalLanguageProductSearchInputSchema },
  output: { schema: NaturalLanguageProductSearchOutputSchema },
  prompt: `You are an expert e-commerce product search assistant. Your task is to extract structured search parameters from a user's natural language query for clothing items.

Carefully read the user's query and identify the following:
- **keywords**: General descriptive words.
- **category**: The type of clothing (e.g., 'dress', 'sweater', 'jeans', 'shirt').
- **occasion**: When or where the item would be worn (e.g., 'winter', 'wedding', 'casual', 'work', 'party').
- **style**: Descriptive adjectives for the look or feel (e.g., 'cozy', 'stylish', 'formal', 'sporty', 'minimalist', 'boho').
- **colors**: Any specific colors mentioned.
- **materials**: Any specific fabric types (e.g., 'cotton', 'wool', 'silk', 'denim').
- **minPrice**: A minimum price if specified (e.g., 'more than $50').
- **maxPrice**: A maximum price if specified (e.g., 'under $100', 'less than $75').

If a parameter is not explicitly mentioned or clearly inferable from the query, it should be returned as 'null' (for single values) or an empty array (for lists).
For price values, extract the numerical value.

User Query: {{{query}}}`,
});

const naturalLanguageProductSearchFlow = ai.defineFlow(
  {
    name: 'naturalLanguageProductSearchFlow',
    inputSchema: NaturalLanguageProductSearchInputSchema,
    outputSchema: NaturalLanguageProductSearchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
