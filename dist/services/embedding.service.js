"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbedder = getEmbedder;
exports.generateEmbedding = generateEmbedding;
const transformers_1 = require("@xenova/transformers");
let embedder = null;
async function getEmbedder() {
    if (!embedder) {
        embedder = await (0, transformers_1.pipeline)("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
        console.log("✅ Embedder carregado");
    }
    return embedder;
}
async function generateEmbedding(text) {
    const model = await getEmbedder();
    const output = await model(text, {
        pooling: "mean",
        normalize: true,
    });
    return output.data;
}
