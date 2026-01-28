// openAi.service.ts
import OpenAI from "openai";

let openai: OpenAI | null = null;

if (!process.env.MOCK_EMBEDDINGS || process.env.MOCK_EMBEDDINGS !== "true") {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não definida!");
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// função de gerar embedding
export async function gerarEmbedding(texto: string): Promise<number[]> {
  if (process.env.MOCK_EMBEDDINGS === "true") {
    // Embedding simulado
    return Array.from({ length: 1536 }, () => Math.random());
  }

  if (!openai) throw new Error("OpenAI client não inicializado");

  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: texto,
  });

  return response.data[0].embedding;
}
