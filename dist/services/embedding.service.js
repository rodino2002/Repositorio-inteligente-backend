"use strict";
// import { pipeline } from "@xenova/transformers";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbedder = getEmbedder;
exports.generateEmbedding = generateEmbedding;
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
let embedder = null;
async function getEmbedder() {
    if (!embedder) {
        const { pipeline } = await Promise.resolve().then(() => __importStar(require("@xenova/transformers")));
        embedder = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
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
