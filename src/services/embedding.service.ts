import { pipeline } from "@xenova/transformers";

let embedder: any = null;

export async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedder carregado");
  }
  return embedder;
}

export async function generateEmbedding(text: string) {
  const model = await getEmbedder();

  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });

  return output.data as number[];
}
