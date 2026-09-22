"use strict";
// src/services/reindexEmbeddings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.reindexEmbeddings = reindexEmbeddings;
const client_1 = require("@prisma/client");
const embedding_service_1 = require("../../services/embedding.service");
const normalizaTexto_1 = require("../normalizaTexto");
const prisma = new client_1.PrismaClient();
async function reindexEmbeddings() {
    console.log("Iniciando reindexação...");
    const trabalhos = await prisma.trabalho.findMany({
        include: {
            departamento: true,
            especialidades: true,
        },
    });
    console.log(`Total encontrados: ${trabalhos.length}`);
    for (const trabalho of trabalhos) {
        try {
            const textoEmbedding = (0, normalizaTexto_1.normalizar)(`
        ${trabalho.titulo}

        ${trabalho.resumo}

        Departamento:
        ${trabalho.departamento?.nome ?? ""}

        Especialidades:
        ${trabalho.especialidades
                .map((e) => e.nome)
                .join(", ")}
      `);
            const embeddingRaw = await (0, embedding_service_1.generateEmbedding)(textoEmbedding);
            const embedding = Array.from(embeddingRaw);
            await prisma.trabalho.update({
                where: {
                    id: trabalho.id,
                },
                data: {
                    embedding,
                },
            });
            console.log(`✅ Trabalho ${trabalho.id} atualizado`);
        }
        catch (err) {
            console.error(`❌ Erro no trabalho ${trabalho.id}`, err);
        }
    }
    console.log("Reindexação concluída");
}
