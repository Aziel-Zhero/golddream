'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized clothing recommendations
 * and complete outfit suggestions based on user preferences and browsing history.
 *
 * - generatePersonalizedRecommendations - A function that initiates the recommendation process.
 * - PersonalizedRecommendationsInput - The input type for the recommendation function.
 * - PersonalizedRecommendationsOutput - The return type for the recommendation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductDataSchema = z.object({
  id: z.string().describe('Unique identifier of the product.'),
  name: z.string().describe('Name of the product.'),
  description: z.string().describe('Description of the product.'),
  category: z.string().describe('Category of the product (e.g., 