'use server';
/**
 * @fileOverview Este arquivo implementa um fluxo Genkit para gerar recomendações de roupas personalizadas
 * e sugestões de looks completos baseados nas preferências do usuário e histórico de navegação.
 *
 * - generatePersonalizedRecommendations - Uma função que inicia o processo de recomendação.
 * - PersonalizedRecommendationsInput - O tipo de entrada para a função de recomendação.
 * - PersonalizedRecommendationsOutput - O tipo de retorno para a função de recomendação.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductDataSchema = z.object({
  id: z.string().describe('Identificador único do produto.'),
  name: z.string().describe('Nome do produto.'),
  description: z.string().describe('Descrição do produto.'),
  category: z.string().describe('Categoria do produto (ex: camisetas, calças, vestidos).'),
  price: z.number().describe('Preço do produto.'),
});

const PersonalizedRecommendationsInputSchema = z.object({
  preferences: z.array(z.string()).describe('Uma lista de preferências de estilo expressas pelo usuário.'),
  browsingHistory: z.array(ProductDataSchema).describe('Uma lista de produtos que o usuário visualizou recentemente.'),
  availableProducts: z.array(ProductDataSchema).describe('A lista de produtos disponíveis atualmente na loja para recomendação.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendedProducts: z.array(z.object({
    id: z.string(),
    reason: z.string().describe('Por que este produto foi recomendado para o usuário.'),
  })).describe('Uma lista de produtos recomendados individualmente.'),
  suggestedOutfits: z.array(z.object({
    outfitName: z.string().describe('Um nome cativante para o look sugerido.'),
    productIds: z.array(z.string()).describe('Os IDs dos produtos que compõem este look.'),
    styleNotes: z.string().describe('Notas sobre como usar ou por que este look funciona.'),
  })).describe('Sugestões de looks completos combinando múltiplos produtos.'),
  explanation: z.string().describe('Uma breve explicação geral de como essas recomendações se alinham ao estilo do usuário.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `Você é um Personal Stylist especializado em moda contemporânea. Sua tarefa é analisar as preferências do usuário, o histórico de navegação e os produtos disponíveis para criar recomendações altamente personalizadas e sugestões de looks completos.

Preferências do Usuário:
{{#each preferences}}
- {{{this}}}
{{/each}}

Produtos Visualizados Recentemente:
{{#each browsingHistory}}
- {{{name}}} ({{{category}}}): {{{description}}}
{{/each}}

Catálogo de Produtos Disponíveis:
{{#each availableProducts}}
- [ID: {{{id}}}] {{{name}}} ({{{category}}}): {{{description}}} - R$ {{{price}}}
{{/each}}

Com base nessas informações:
1. Recomende de 2 a 4 produtos individuais que combinem com o gosto do usuário.
2. Crie 2 sugestões de looks (outfits) completos usando os produtos do catálogo.
3. Forneça uma explicação estilística para suas escolhas.

Seja sofisticado, encorajador e focado em tendências modernas.`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
