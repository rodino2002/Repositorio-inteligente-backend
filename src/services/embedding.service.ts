// import { pipeline } from "@xenova/transformers";

// let embedder: any = null;

// export async function getEmbedder() {
//   if (!embedder) {
//     embedder = await pipeline(
//       "feature-extraction",
//       "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
//     );
    
//     console.log("✅ Embedder carregado");
//   }
//   return embedder;
// }

// export async function generateEmbedding(text: string) {
//   const model = await getEmbedder();

//   const output = await model(text, {
//     pooling: "mean",
//     normalize: true,
//   });

//   return output.data as number[];
// }
// let embedder: any = null;

// export async function getEmbedder() {
//   if (!embedder) {
//     const { env, pipeline } = await import("@xenova/transformers");

//     env.backends.onnx.wasm.numThreads = 1;
    
//     embedder = await pipeline(
//       "feature-extraction",
//       "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
//     );
//     console.log("✅ Embedder carregado");
//   }
//   return embedder;
// }

// export async function generateEmbedding(text: string) {
//   const model = await getEmbedder();
//   const output = await model(text, {
//     pooling: "mean",
//     normalize: true,
//   });
//   return output.data as number[];
// }

import { createHash } from "node:crypto";

let embedder: any = null;

const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

export async function getEmbedder() {
  if (!embedder) {
    const { env, pipeline } = await import("@xenova/transformers");

    // Optimização para o runtime Node.js local.
    env.backends.onnx.wasm.numThreads = 1;

    embedder = await pipeline("feature-extraction", MODEL_NAME);

    console.log("✅ Embedder MiniLM carregado");
  }

  return embedder;
}

async function generateLocalEmbedding(text: string): Promise<number[]> {
  const model = await getEmbedder();

  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

async function generateRemoteEmbedding(text: string): Promise<number[]> {
  const serviceUrl = process.env.EMBEDDINGS_SERVICE_URL;
  const serviceToken = process.env.EMBEDDINGS_SERVICE_TOKEN;

  
  if (!serviceUrl || !serviceToken) {
    throw new Error("Serviço de embeddings não configurado no Worker.");
  }
  console.log(
  "[Embedding Client] Token fingerprint:",
  createHash("sha256")
    .update(serviceToken)
    .digest("hex")
    .slice(0, 12)
);
  

  const response = await fetch(
    `${serviceUrl.replace(/\/+$/, "")}/v1/embeddings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Serviço de embeddings respondeu ${response.status}: ${details}`
    );
  }

  const result = (await response.json()) as {
    embedding: number[];
  };

  if (
    !Array.isArray(result.embedding) ||
    result.embedding.length !== 384 ||
    !result.embedding.every(Number.isFinite)
  ) {
    throw new Error("O serviço devolveu um embedding inválido.");
  }

  return result.embedding;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.CLOUDFLARE_WORKER_RUNTIME === "true") {
    return generateRemoteEmbedding(text);
  }

  return generateLocalEmbedding(text);
}
