import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { Role } from "../types/role";
import { TrabalhoStatus } from "@prisma/client";
import { generateEmbedding } from "../services/embedding.service";


const prisma = new PrismaClient();
const router = Router();

// post do trabalho

router.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { titulo, resumo, fileUrl, departamentoId, especialidadesIds } = req.body;
      const autorId = (req as any).usuario.id;

      // Texto rico para gerar embedding
      const textoEmbedding = `Titulo: ${titulo}\nResumo: ${resumo}`;

      // Gerar embedding
      const embeddingRaw = await generateEmbedding(textoEmbedding);

      // Converte para array JS
      const embedding: number[] = Array.from(embeddingRaw);

      // Criar trabalho direto com embedding
      const novo = await prisma.trabalho.create({
        data: {
          titulo,
          resumo,
          fileUrl,
          autorId,
          departamentoId: departamentoId ?? null,
          especialidades: {
            connect: especialidadesIds?.map((id: number) => ({ id })) ?? [],
          },
          embedding, // aqui já insere direto
        },
        select: {
          id: true,
          titulo: true,
          resumo: true,
          fileUrl: true,
          autorId: true,
          departamentoId: true,
          autor: true,
          departamento: true,
          especialidades: true,
          createdAt: true,
          atualizadoEm: true
        }
      });

      return res.status(201).json({ sucesso: true, dados: novo });
    } catch (e: any) {
      console.error("ERRO CRIAR TRABALHO:", e);
      return res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

// ============================
// LIST - Listar Trabalhos
// ============================
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { departamentoId, autorId, especialidadeId } = req.query;

    const trabalhos = await prisma.trabalho.findMany({
      where: {
        departamentoId: departamentoId ? Number(departamentoId) : undefined,
        autorId: autorId ? Number(autorId) : undefined,
        especialidades: especialidadeId
          ? { some: { id: Number(especialidadeId) } }
          : undefined,
      },
      select: {
        id: true,
        titulo: true,
        resumo: true,
        fileUrl: true,
        status: true,
        dataPublicacao: true,
        autorId: true,
        departamentoId: true,
        createdAt: true,
        atualizadoEm: true,
        autor: true,
        departamento: true,
        especialidades: true,

        // 🚫 embedding NÃO pode aparecer
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ sucesso: true, total: trabalhos?.length, dados: trabalhos });
  } catch (e: any) {
    res.status(500).json({ sucesso: false, erro: e.message });
  }
});

// ============================
// READ - Trabalho por ID
// ============================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const item = await prisma.trabalho.findUnique({
      where: { id },
      include: {
        autor: true,
        departamento: true,
        especialidades: true,
      },
    });

    if (!item) return res.status(404).json({ erro: "Trabalho não encontrado" });

    res.json({ sucesso: true, dados: item });
  } catch (e: any) {
    res.status(500).json({ sucesso: false, erro: e.message });
  }
});

// ============================
// UPDATE - Atualizar trabalho
// ============================
router.put(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const usuarioId = (req as any).usuario.id;

      const trabalho = await prisma.trabalho.findUnique({ where: { id } });
      if (!trabalho) return res.status(404).json({ erro: "Trabalho não encontrado" });

      // Apenas autor ou admin pode editar
      if (trabalho.autorId !== usuarioId && (req as any).usuario.role !== Role.ADMIN) {
        return res.status(403).json({ erro: "Sem permissão para editar" });
      }

      const { titulo, resumo, fileUrl, departamentoId, especialidadesIds } = req.body;

      const atualizado = await prisma.trabalho.update({
        where: { id },
        data: {
          titulo,
          resumo,
          fileUrl,
          departamentoId,
          especialidades: {
            set: [], // limpa
            connect: especialidadesIds?.map((id: number) => ({ id })) ?? [],
          },
        },
        include: {
          autor: true,
          departamento: true,
          especialidades: true,
        },
      });

      res.json({ sucesso: true, dados: atualizado });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

// ============================
// DELETE - Deletar trabalho
// ============================
router.delete(
  "/:id",
  authMiddleware,
  allowRoles(Role.ADMIN), // somente ADMIN pode deletar
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      await prisma.trabalho.delete({ where: { id } });

      res.json({ sucesso: true, mensagem: "Trabalho deletado com sucesso" });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

// PUBLICAR — muda para APROVADO
router.patch(
  "/:id/publicar",
  authMiddleware,
  allowRoles(Role.ADMIN, Role.AVALIADOR),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const trabalho = await prisma.trabalho.update({
        where: { id },
        data: { status: TrabalhoStatus.APROVADO },
      });

      res.json({ sucesso: true, dados: trabalho });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

// RECUSAR — muda para RECUSADO
router.patch(
  "/:id/recusar",
  authMiddleware,
  allowRoles(Role.ADMIN, Role.AVALIADOR),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { motivo } = req.body;

      const trabalho = await prisma.trabalho.update({
        where: { id },
        data: { status: TrabalhoStatus.RECUSADO, motivoRejeicao: motivo ?? null },
      });

      res.json({ sucesso: true, dados: trabalho });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);


// EM REVISÃO — muda para EM_REVISAO
router.patch(
  "/:id/revisar",
  authMiddleware,
  allowRoles(Role.ADMIN, Role.AVALIADOR),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const trabalho = await prisma.trabalho.update({
        where: { id },
        data: { status: TrabalhoStatus.EM_REVISAO },
      });

      res.json({ sucesso: true, dados: trabalho });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

// PENDENTE — volta para PENDENTE (caso pedirem revisão)
router.patch(
  "/:id/pendente",
  authMiddleware,
  allowRoles(Role.ADMIN, Role.AVALIADOR),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const trabalho = await prisma.trabalho.update({
        where: { id },
        data: { status: TrabalhoStatus.PENDENTE },
      });

      res.json({ sucesso: true, dados: trabalho });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  }
);

router.post(
  "/buscar-inteligente",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { query, threshold = 0.5 } = req.body;

      if (!query?.trim()) {
        return res.status(400).json({
          sucesso: false,
          erro: "Query é obrigatória",
        });
      }

      // 🔹 Normalização básica
      const normalizar = (t: string) =>
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .trim();

      const textoQuery = normalizar(`Titulo: ${query}\nResumo: ${query}`);

      // 🔹 Geração do embedding da query
      const queryEmbedding = await generateEmbedding(textoQuery);


      //console.log("🔹 Query embedding gerado. Dimensão:", queryEmbedding.length);

      // 🔹 Transformar embedding em array para SQL
      const embeddingSql = `ARRAY[${queryEmbedding.map(n => n.toFixed(6)).join(",")}]::float8[]`;

      // 🔹 Buscar TCCs com similaridade de cosseno
      const resultadosRaw = await prisma.$queryRawUnsafe(`
        SELECT
          id,
          titulo,
          resumo,
          "fileUrl",
          cosine_similarity(embedding, ${embeddingSql}) AS similarity
        FROM "Trabalho"
        WHERE embedding IS NOT NULL
          AND status = 'APROVADO'
        ORDER BY similarity DESC
        LIMIT 10;
      `);

      // 🔹 Filtrar pelo threshold, se desejado
      const resultadosFiltrados = (resultadosRaw as any[]).filter(
        r => r.similarity >= threshold
      );

      console.log(
        " Resultados após filtro threshold:",
        resultadosFiltrados.map(r => ({
          id: r.id,
          titulo: r.titulo,
          similarity: r.similarity,
        }))
      );

      return res.json({
        sucesso: true,
        query,
        threshold,
        totalEncontrados: resultadosFiltrados.length,
        resultados: resultadosFiltrados,
      });
    } catch (error) {
      console.error(" ERRO BUSCAR-INTELIGENTE:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : error,
      });
    }
  }
);

export default router;
