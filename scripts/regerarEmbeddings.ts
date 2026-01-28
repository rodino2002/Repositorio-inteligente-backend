import { PrismaClient } from "@prisma/client";
import { gerarEmbedding } from "../src/services/openAi.service";

const prisma = new PrismaClient();

async function regerarEmbeddings() {
  const trabalhos = await prisma.trabalho.findMany({
    select: {
      id: true,
      titulo: true,
      resumo: true,
      departamento: { select: { nome: true } },
      especialidades: { select: { nome: true } }
    }
  });

  for (const t of trabalhos) {
    const texto = `
Título: ${t.titulo}
Resumo: ${t.resumo ?? "Não informado"}
Departamento: ${t.departamento?.nome ?? "Não informado"}
Especialidades: ${t.especialidades.map(e => e.nome).join(", ") || "Nenhuma"}
Tipo de documento: Trabalho acadêmico
`;

    const embedding = await gerarEmbedding(texto);

    await prisma.$executeRaw`
      UPDATE "Trabalho"
      SET embedding = ${embedding}::vector
      WHERE id = ${t.id};
    `;

    console.log("Regerado:", t.id);
  }

  console.log("✅ Todos os embeddings foram atualizados!");
}

// Chama a função imediatamente
regerarEmbeddings()
  .catch((err) => {
    console.error("Erro ao regerar embeddings:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
