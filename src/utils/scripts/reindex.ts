// src/services/reindexEmbeddings.ts

import { PrismaClient } from "@prisma/client";
import { generateEmbedding } from "../../services/embedding.service";
import { normalizar } from "../normalizaTexto";

const prisma = new PrismaClient();
export async function reindexEmbeddings() {
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
      const textoEmbedding = normalizar(`
        ${trabalho.titulo}

        ${trabalho.resumo}

        Departamento:
        ${trabalho.departamento?.nome ?? ""}

        Especialidades:
        ${trabalho.especialidades
          .map((e) => e.nome)
          .join(", ")}
      `);

      const embeddingRaw =
        await generateEmbedding(textoEmbedding);

      const embedding = Array.from(embeddingRaw);

      await prisma.trabalho.update({
        where: {
          id: trabalho.id,
        },
        data: {
          embedding,
        },
      });

      console.log(
        `✅ Trabalho ${trabalho.id} atualizado`
      );
    } catch (err) {
      console.error(
        `❌ Erro no trabalho ${trabalho.id}`,
        err
      );
    }
  }

  console.log("Reindexação concluída");
}