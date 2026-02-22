import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  maxTokens = 300,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system,
    messages,
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
