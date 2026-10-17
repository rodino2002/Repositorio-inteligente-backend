
import "dotenv/config";
import express from "express";
import { generateEmbedding } from "./services/embedding.service";
import { createHash } from "node:crypto";

const app = express();
const port = Number(3001);
const serviceToken = process.env.EMBEDDINGS_SERVICE_TOKEN;


if (!serviceToken) {
  throw new Error("EMBEDDINGS_SERVICE_TOKEN não configurado.");
}

app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "embeddings",
    model: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    dimensions: 384,
  });
});

app.post("/v1/embeddings", async (req, res) => {
  const authorization = req.headers.authorization;

const receivedToken = authorization?.startsWith("Bearer ")
  ? authorization.slice(7)
  : "";

const fingerprint = (value: string) =>
  createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, 12);

console.log("Token esperado:", fingerprint(serviceToken));
console.log("Token recebido:", fingerprint(receivedToken));
console.log(
  "Token do serviço carregado:",
  Boolean(process.env.EMBEDDINGS_SERVICE_TOKEN),
  "Comprimento:",
  process.env.EMBEDDINGS_SERVICE_TOKEN?.length
);
console.log(
  "[Embedding Client] Token configurado:",
  Boolean(serviceToken),
  "Comprimento:",
  serviceToken?.length
);

if (authorization !== `Bearer ${serviceToken}`) {
  res.status(401).json({
    success: false,
    error: "Não autorizado.",
  });
  return;
}

  const text = req.body?.text;

  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 10000
  ) {
    res.status(400).json({
      success: false,
      error: "O texto deve ter entre 1 e 10000 caracteres.",
    });
    return;
  }

  try {
    const embedding = await generateEmbedding(text);

    res.json({ embedding });
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);

    res.status(500).json({
      success: false,
      error: "Não foi possível gerar o embedding.",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Serviço de embeddings disponível na porta ${port}`);
});
