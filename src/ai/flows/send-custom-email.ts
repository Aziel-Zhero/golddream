
'use server';
/**
 * @fileOverview Fluxo Genkit para gerar conteúdo de e-mail estilizado.
 *
 * - sendCustomEmail - Gera o HTML e texto de um e-mail premium para clientes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendCustomEmailInputSchema = z.object({
  clienteNome: z.string().describe('O nome do cliente.'),
  clienteEmail: z.string().email().describe('O e-mail do cliente.'),
  tipo: z.enum(['confirmacao', 'boas_vindas', 'promocao']).describe('O tipo de e-mail a ser enviado.'),
  lojaLink: z.string().url().optional().describe('Link para a loja.'),
});
export type SendCustomEmailInput = z.infer<typeof SendCustomEmailInputSchema>;

const SendCustomEmailOutputSchema = z.object({
  subject: z.string().describe('O assunto do e-mail.'),
  htmlContent: z.string().describe('O conteúdo HTML estilizado do e-mail.'),
  textContent: z.string().describe('A versão em texto simples do e-mail.'),
});
export type SendCustomEmailOutput = z.infer<typeof SendCustomEmailOutputSchema>;

export async function sendCustomEmail(input: SendCustomEmailInput): Promise<SendCustomEmailOutput> {
  return sendCustomEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendCustomEmailPrompt',
  input: { schema: SendCustomEmailInputSchema },
  output: { schema: SendCustomEmailOutputSchema },
  prompt: `Você é o Diretor de Marketing da Gold Dream Multimarcas, uma loja de roupas premium.
Sua tarefa é criar um e-mail sofisticado e atraente para o cliente {{{clienteNome}}}.

O tipo de e-mail é: {{{tipo}}}.

Diretrizes:
- Use um tom elegante, exclusivo e convidativo.
- No HTML, use um design moderno com cores: Roxo Escuro (#6b21a8) e Branco.
- Inclua um botão de chamada para ação (CTA) estilizado.
- O e-mail deve parecer uma carta personalizada de uma marca de luxo.

Para o tipo 'confirmacao':
- Assunto: Gold Dream | Confirme seu e-mail e desbloqueie sua experiência VIP.
- Mensagem: Fale sobre a importância da segurança e o acesso a ofertas exclusivas.

Para o tipo 'boas_vindas':
- Assunto: Bem-vindo ao Universo Gold Dream, {{{clienteNome}}}.
- Mensagem: Celebre a entrada do cliente no mundo da moda premium.

Retorne o Assunto, o HTML completo (incluindo tags <style> inline) e o texto simples.`,
});

const sendCustomEmailFlow = ai.defineFlow(
  {
    name: 'sendCustomEmailFlow',
    inputSchema: SendCustomEmailInputSchema,
    outputSchema: SendCustomEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
