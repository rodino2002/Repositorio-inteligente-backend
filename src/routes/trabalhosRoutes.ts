import { Router, Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { Role } from "../types/role";
import { TrabalhoStatus } from "@prisma/client";
import { generateEmbedding } from "../services/embedding.service";
import { normalizar } from "../utils/normalizaTexto";
import { redis } from "../lib/redis";
import crypto from "crypto"
import { calcularScore } from "../services/calcularScore.service";


const prisma = new PrismaClient();
const router = Router();


// ============================
// TIPOS DE TRABALHO
// ============================
 router.get("/tipos_de_trabalhos", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tipos = await prisma.tipoTrabalho.findMany({
      select: {
        id: true,
        nome : true,
      }
    });
    res.status(200).json({ sucesso: true, dados: tipos });
  } catch (e: any) {
    console.error("ERRO AO BUSCAR TIPOS DE TRABALHO:", e);
    res.status(500).json({ sucesso: false, erro: e.message });
  }
});


// post do trabalho
router.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        titulo,
        resumo,
        fileUrl,
        departamentoId,
        especialidadesIds,
        tipoTrabalhoId,
      } = req.body;

      const autorId = (req as any).usuario.id;

      // Buscar departamento
      const departamento = departamentoId
        ? await prisma.departamento.findUnique({
          where: { id: departamentoId },
          select: { nome: true },
        })
        : null;

      // Buscar especialidades
      const especialidades = especialidadesIds?.length
        ? await prisma.especialidade.findMany({
          where: {
            id: {
              in: especialidadesIds,
            },
          },
          select: {
            nome: true,
          },
        })
        : [];

        const trabalhoTipo = tipoTrabalhoId
        ? await prisma.tipoTrabalho.findUnique({
          where: { id: tipoTrabalhoId },
          select: { nome: true },
        })
        : null;

      // Texto rico para embedding
      const textoEmbedding = normalizar(`
        Título: ${titulo}
        Resumo: ${resumo}
        Departamento: ${departamento?.nome ?? ""}
        Especialidades: ${especialidades.map((e) => e.nome).join(", ")}
        Tipo de Trabalho: ${trabalhoTipo?.nome ?? ""}
      `);

      // Gerar embedding
      const embeddingRaw = await generateEmbedding(textoEmbedding);

      const embedding: number[] = Array.from(embeddingRaw);

      // Criar trabalho
      const novo = await prisma.trabalho.create({
        data: {
          titulo,
          resumo,
          fileUrl,
          autorId,
          tipoTrabalhoId: tipoTrabalhoId ?? null,
          departamentoId: departamentoId ?? null,
          especialidades: {
            connect:
              especialidadesIds?.map((id: number) => ({
                id,
              })) ?? [],
          },
          embedding,

        },
        select: {
          id: true,
          titulo: true,
          resumo: true,
          fileUrl: true,
          autorId: true,
          departamentoId: true,
          tipoTrabalhoId: true,
          autor: true,
          departamento: true,
          tipoTrabalho: true,
          especialidades: true,
          createdAt: true,
          atualizadoEm: true,
        },
      });

      // invalidar TODOS os caches relacionados
      const keys = await redis.keys("trabalhos:list:*");

      if (keys.length) {
        await redis.del(keys);
      }

      return res.status(201).json({
        sucesso: true,
        dados: novo,
      });
    } catch (e: any) {
      console.error("ERRO CRIAR TRABALHO:", e);

      return res.status(500).json({
        sucesso: false,
        erro: e.message,
      });
    }
  }
);

// ============================
// LIST - Listar Trabalhos
// ============================
router.get("/", authMiddleware, async (req: Request, res: Response) => {

  const {
    departamentoId,
    autorNome,
    especialidadeId,
    status,
    start_date,
    end_date,
    page,
    per_page,
    tipoTrabalhoId,
    tag, // palavra-chave para busca no título ou resumo,
  } = req.query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(per_page) || 20;

  const startDate = start_date
    ? new Date(String(start_date))
    : undefined;

  const endDate = end_date
    ? new Date(String(end_date))
    : undefined;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const skip = (pageNumber - 1) * limitNumber;
  const cacheKey =
    `trabalhos:list:` +
    `dep=${departamentoId ?? "all"}:` +
    `autor=${autorNome ?? "all"}:` +
    `esp=${especialidadeId ?? "all"}:` +
    `status=${status ?? "all"}:` +
    `start=${start_date ?? "none"}:` +
    `tipo=${tipoTrabalhoId ?? "all"}:` +
    `end=${end_date ?? "none"}:` +
    `page=${pageNumber}:` +
    `per_page=${limitNumber}`;

  let cachedData: string | null = null

  try {
    cachedData = await redis.get(cacheKey)

    if (cachedData) {
      return res.json(JSON.parse(cachedData))
    }

  } catch (err) {
    console.warn("Redis indisponível, seguindo sem cache")
  }

  try {
    const where: Prisma.TrabalhoWhereInput = {
      tipoTrabalhoId: tipoTrabalhoId
        ? Number(tipoTrabalhoId)
        : undefined,
        
      departamentoId: departamentoId
        ? Number(departamentoId)
        : undefined,

      autor: autorNome
        ? {
          nome: {
            contains: String(autorNome),
            mode: "insensitive",
          },
        }
        : undefined,

      especialidades: especialidadeId
        ? {
          some: {
            id: Number(especialidadeId),
          },
        }
        : undefined,

      status: status
        ? (status as TrabalhoStatus)
        : undefined,

      createdAt:
        startDate || endDate
          ? {
            gte: startDate,
            lte: endDate,
          }
          : undefined,
    };

    const trabalhos = await prisma.trabalho.findMany({
      where,
      skip,
      take: limitNumber,

      select: {
        id: true,
        titulo: true,
        resumo: true,
        fileUrl: true,
        status: true,
        dataPublicacao: true,
        createdAt: true,
        atualizadoEm: true,
        autor: {
          select: {
            nome: true,
          },
        },
        departamento: {
          select: {
            nome: true,
          },
        },
        especialidades: {
          select: {
            nome: true,
          }
        },
        motivoRejeicao: true,
        tipoTrabalho:  {
          select: {
            nome: true,
          }
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prisma.trabalho.count({
      where
    });

    const responsePayload = {
      sucesso: true,

      paginacao: {
        totalItems: total,
        totalPaginas: Math.ceil(total / limitNumber),
        paginaAtual: pageNumber,
        itensPorPagina: limitNumber,
        totalItemsNaPagina: trabalhos.length,
      },

      dados: trabalhos,
    };

    await redis.set(cacheKey, JSON.stringify(responsePayload), {
      EX: 60,
    }) // cache por 60 segundos no redis

    return res.json(responsePayload)


  } catch (e: any) {
    res.status(500).json({ sucesso: false, erro: e.message });
  }
});

// ============================
// READ - Trabalho por ID
// ============================
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
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


      // invalidar TODOS os caches relacionados
      const keys = await redis.keys("trabalhos:list:*");

      if (keys.length) {
        await redis.del(keys);
      }

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

      // invalidar TODOS os caches relacionados
      const keys = await redis.keys("trabalhos:list:*");

      if (keys.length) {
        await redis.del(keys);
      }

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

      // invalidar TODOS os caches relacionados
      const keys = await redis.keys("trabalhos:list:*");

      if (keys.length) {
        await redis.del(keys);
      }

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

      //  invalidar TODOS os caches relacionados
      const keys = await redis.keys("trabalhos:list:*");

      if (keys.length) {
        await redis.del(keys);
      }

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

// ============================
// BUSCA INTELIGENTE - Similaridade de cosseno com embeddings
// ============================
router.post(
  "/buscar-inteligente",
  authMiddleware,
  async (req: Request, res: Response) => {

    const { query, threshold = 0.4 } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({
        sucesso: false,
        erro: "Query é obrigatória",
      });
    }

    const hash = crypto.createHash("md5").update(JSON.stringify(req.body)).digest("hex")
    const cacheKey = `trabalhos:busca-inteligente:${hash}`

    let cachedData: string | null = null

    try {

      cachedData = await redis.get(cacheKey)

      if (cachedData) {
        return res.json(JSON.parse(cachedData))
      }

    } catch (error) {
      console.warn("Redis indisponível, seguindo sem cache")
    }

    try {

      //const textoQuery = normalizar(`Titulo: ${query}\nResumo: ${query}`);
      const textoQuery = normalizar(query);

      // 🔹 Geração do embedding da query
      const queryEmbedding = await generateEmbedding(textoQuery);

      //console.log("🔹 Query embedding gerado. Dimensão:", queryEmbedding.length);

      // 🔹 Transformar embedding em array para SQL
      const embeddingSql = `ARRAY[${queryEmbedding.map(n => n.toFixed(6)).join(",")}]::float8[]`;

      // 🔹 Buscar TCCs com similaridade de cosseno
      const resultadosRaw = await prisma.$queryRawUnsafe(`
  SELECT
    t.id,
    t.titulo,
    t.resumo,
    t."fileUrl",
    t.status,
    t."createdAt",

    cosine_similarity(t.embedding, ${embeddingSql}) AS similarity,

    json_build_object(
      'id', u.id,
      'nome', u.nome
    ) AS autor,

    json_build_object(
      'id', d.id,
      'nome', d.nome
    ) AS departamento,

    COALESCE(
      json_agg(
        json_build_object(
          'id', e.id,
          'nome', e.nome,
          'descricao', e.descricao
        )
      ) FILTER (WHERE e.id IS NOT NULL),
      '[]'
    ) AS especialidades

  FROM "Trabalho" t

  LEFT JOIN "Usuario" u
    ON u.id = t."autorId"

  LEFT JOIN "Departamento" d
    ON d.id = t."departamentoId"

  LEFT JOIN "_TrabalhoEspecialidade" te
  ON te."B" = t.id

  LEFT JOIN "Especialidade" e
  ON e.id = te."A"

  WHERE t.embedding IS NOT NULL
    AND t.status = 'APROVADO'

  GROUP BY t.id, u.id, d.id

  ORDER BY similarity DESC
  LIMIT 10;
`);

      const ranked = (resultadosRaw as any[])
        .map(item => ({
          ...item,
          score: calcularScore(query, item),
        }))
        .sort((a, b) => b.score - a.score);

      const resultadosFiltrados = ranked.filter(
        r => r.score >= threshold // antes  r => r.similarity >= threshold
      );

      const payload = {
        sucesso: true,
        query,
        threshold,
        totalEncontrados: resultadosFiltrados.length,
        resultados: resultadosFiltrados,
      };

      // adicionando no cache para acelerar buscas futuras idênticas
      try {
        await redis.set(cacheKey, JSON.stringify(payload), { EX: 60 })
      } catch {
        console.warn("Não foi possível salvar no cache")
      }

      return res.json(payload);

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
