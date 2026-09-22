import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import { redis } from "../lib/redis";
import crypto from "crypto"
import { normalizar } from "../utils/normalizaTexto";
import { generateEmbedding } from "../services/embedding.service";
import { escapeSqlString } from "../utils/escapeSqlString";
import { buscarTrabalhosRelacionados } from "../utils/trabalhosRelacionados";

const prisma = new PrismaClient();
const router = Router()

router.post(
  "/buscar-inteligente",
  async (req: Request, res: Response) => {
    const { query, threshold = 0.4 } = req.body;

    // ============================================================
    // 1. VALIDAÇÃO
    // ============================================================

    if (!query?.trim()) {
      return res.status(400).json({
        sucesso: false,
        erro: "Query é obrigatória",
      });
    }

    // ============================================================
    // 2. CACHE
    // ============================================================

    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(req.body))
      .digest("hex");

    const cacheKey = `trabalhos:busca-hibrida:${hash}`;

    try {
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (error) {
      console.warn("Redis indisponível, seguindo sem cache");
    }

    try {
      // ==========================================================
      // 3. NORMALIZAR QUERY
      // ==========================================================

      const textoQuery = normalizar(query);

      // ==========================================================
      // 4. GERAR EMBEDDING DA QUERY
      // ==========================================================

      const queryEmbedding = await generateEmbedding(textoQuery);

      /*
       * O banco está armazenando embedding como Float[].
       *
       * Criamos um literal PostgreSQL:
       *
       * ARRAY[0.123, 0.456, ...]::float8[]
       */

      const embeddingSql = `
        ARRAY[
          ${queryEmbedding.map((n) => n.toFixed(6)).join(",")}
        ]::float8[]
      `;

      // ==========================================================
      // 5. BUSCA HÍBRIDA
      // ==========================================================
      //
      // Pegamos:
      //
      // - TOP 20 semanticamente semelhantes
      // - TOP 20 lexicalmente relevantes
      //
      // Depois fazemos UNION dos candidatos.
      //
      // Assim um trabalho pode entrar pela busca lexical mesmo
      // que não esteja entre os TOP 20 semanticamente.
      //

      const resultadosRaw = await prisma.$queryRawUnsafe(`

    WITH base AS (

        SELECT
            t.id,
            t.titulo,
            t.resumo,
            t."fileUrl",
            t.status,
            t."createdAt",

            -- ================================================
            -- SCORE SEMÂNTICO
            -- ================================================

            cosine_similarity(
                t.embedding,
                ${embeddingSql}
            ) AS semantic_score,

            -- ================================================
            -- SCORE LEXICAL
            -- ================================================

            ts_rank(
                to_tsvector(
                    'portuguese',
                    COALESCE(t.titulo, '') || ' ' ||
                    COALESCE(t.resumo, '')
                ),
                plainto_tsquery(
                    'portuguese',
                    ${escapeSqlString(textoQuery)}
                )
            ) AS lexical_score

        FROM "Trabalho" t

        WHERE
            t.embedding IS NOT NULL
            AND t.status = 'APROVADO'
    ),

    -- ======================================================
    -- CANDIDATOS SEMÂNTICOS
    -- ======================================================

    semantic_candidates AS (

        SELECT id

        FROM base

        ORDER BY semantic_score DESC

        LIMIT 20
    ),

    -- ======================================================
    -- CANDIDATOS LEXICAIS
    -- ======================================================

    lexical_candidates AS (

        SELECT id

        FROM base

        WHERE lexical_score > 0

        ORDER BY lexical_score DESC

        LIMIT 20
    ),

    -- ======================================================
    -- UNIÃO DOS CANDIDATOS
    -- ======================================================

    candidates AS (

        SELECT id
        FROM semantic_candidates

        UNION

        SELECT id
        FROM lexical_candidates
    ),

    -- ======================================================
    -- DADOS DOS CANDIDATOS
    -- ======================================================

    candidate_scores AS (

        SELECT
            b.*

        FROM base b

        INNER JOIN candidates c
            ON c.id = b.id
    ),

    -- ======================================================
    -- NORMALIZAÇÃO DOS SCORES
    -- ======================================================

    normalized AS (

        SELECT
            *,

            -- ------------------------------------------------
            -- NORMALIZAÇÃO SEMÂNTICA
            -- ------------------------------------------------

            CASE
                WHEN MAX(semantic_score) OVER ()
                     = MIN(semantic_score) OVER ()
                THEN 0

                ELSE
                    (
                        semantic_score
                        - MIN(semantic_score) OVER ()
                    )
                    /
                    NULLIF(
                        MAX(semantic_score) OVER ()
                        - MIN(semantic_score) OVER (),
                        0
                    )
            END AS semantic_normalized,

            -- ------------------------------------------------
            -- NORMALIZAÇÃO LEXICAL
            -- ------------------------------------------------
            --
            -- <= 0.01  -> considerado irrelevante
            --
            -- 0.35     -> score lexical máximo de referência
            --
            -- acima de 0.35 -> limitado a 1
            --
            -- ------------------------------------------------

            CASE
                WHEN lexical_score <= 0.01
                THEN 0

                ELSE LEAST(
                    lexical_score / 0.35,
                    1
                )
            END AS lexical_normalized

        FROM candidate_scores
    ),

    -- ======================================================
    -- SCORE HÍBRIDO
    -- ======================================================

    ranked AS (

        SELECT
            *,

            (
                semantic_normalized * 0.70
                +
                lexical_normalized * 0.30
            ) AS hybrid_score

        FROM normalized
    )

    -- ======================================================
    -- RESULTADO FINAL
    -- ======================================================

    SELECT
        id,
        titulo,
        resumo,
        "fileUrl",
        status,
        "createdAt",

        semantic_score,
        lexical_score,

        semantic_normalized,
        lexical_normalized,

        hybrid_score

    FROM ranked

    WHERE hybrid_score >= ${Number(threshold)}

    ORDER BY hybrid_score DESC

    LIMIT 10;

`);

      // ==========================================================
      // 6. BUSCAR INFORMAÇÕES RELACIONADAS
      // ==========================================================


      const ids = (resultadosRaw as any[]).map(
        (item) => Number(item.id)
      );

      let trabalhosRelacionados: any[] = [];

      if (ids.length > 0) {
        trabalhosRelacionados = await prisma.trabalho.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          include: {
            autor: {
              select: {
                id: true,
                nome: true,
              },
            },

            departamento: {
              select: {
                id: true,
                nome: true,
              },
            },

            especialidades: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        });
      }

      // ==========================================================
      // 7. RECONSTRUIR RESULTADO FINAL
      // ==========================================================

      const resultados = (resultadosRaw as any[]).map((item) => {
        const trabalho = trabalhosRelacionados.find(
          (t) => t.id === Number(item.id)
        );

        return {
          id: Number(item.id),

          titulo: item.titulo,

          resumo: item.resumo,

          fileUrl: item.fileUrl,

          status: item.status,

          createdAt: item.createdAt,

          autor: trabalho?.autor ?? null,

          departamento: trabalho?.departamento ?? null,

          especialidades: trabalho?.especialidades ?? [],

          // ====================================================
          // SCORES
          // ====================================================

          semanticScore: Number(item.semantic_score),

          lexicalScore: Number(item.lexical_score),

          semanticNormalized: Number(
            item.semantic_normalized
          ),

          lexicalNormalized: Number(
            item.lexical_normalized
          ),

          hybridScore: Number(item.hybrid_score),

          // Mantemos "score" para compatibilidade
          // com o frontend atual.

          score: Number(item.hybrid_score),
        };
      });

      // ==========================================================
      // 8. GARANTIR ORDEM
      // ==========================================================

      resultados.sort(
        (a, b) => b.hybridScore - a.hybridScore
      );

      // ==========================================================
      // TRABALHOS RELACIONADOS
      // ==========================================================

      const idsResultadosPrincipais = resultados.map(
        (item) => Number(item.id)
      );

      const trabalhosRecomendados = await buscarTrabalhosRelacionados(
        queryEmbedding,
        idsResultadosPrincipais,
        5
      );

      // ==========================================================
      // 9. PAYLOAD
      // ==========================================================

      const payload = {
        sucesso: true,

        query,

        threshold,

        pesos: {
          semantico: 0.7,
          lexical: 0.3,
        },

        totalEncontrados: resultados.length,

        resultados,

        trabalhosRecomendados

      };

      // ==========================================================
      // 10. CACHE
      // ==========================================================

      try {
        await redis.set(
          cacheKey,
          JSON.stringify(payload),
          {
            EX: 60,
          }
        );
      } catch (error) {
        console.warn(
          "Não foi possível salvar no cache"
        );
      }

      // ==========================================================
      // 11. RESPONSE
      // ==========================================================

      return res.json(payload);

    } catch (error) {

      console.error(
        "ERRO BUSCAR-INTELIGENTE:",
        error
      );

      return res.status(500).json({
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : error,
      });
    }
  }
);

export default router;
