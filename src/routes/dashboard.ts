import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { redis } from "../lib/redis";



const prisma = new PrismaClient();
const router = Router()

// ============================
// DASHBOARD - Cards
// ============================

router.get(
  "/cards",
  authMiddleware,
  async (req: Request, res: Response) => {
    const cacheKey = "dashboard:cards";

    try {
      // ============================
      // CACHE
      // ============================

      let cachedData: string | null = null;

      try {
        cachedData = await redis.get(cacheKey);

        if (cachedData) {
          return res.json(JSON.parse(cachedData));
        }
      } catch (err) {
        console.warn("Redis indisponível, seguindo sem cache");
      }

      // ============================
      // CONSULTAS
      // ============================

      const [trabalhosPorStatus, totalUtilizadores] =
        await Promise.all([
          prisma.trabalho.groupBy({
            by: ["status"],
            _count: {
              _all: true,
            },
          }),

          prisma.usuario.count(),
        ]);

      // ============================
      // TOTAL DE TRABALHOS
      // ============================

      const totalTrabalhos = trabalhosPorStatus.reduce(
        (total, item) => total + item._count._all,
        0
      );

      // ============================
      // MAPEAR STATUS
      // ============================

      const pendentes =
        trabalhosPorStatus.find(
          (item) => item.status === "PENDENTE"
        )?._count._all ?? 0;

      const recusado =
        trabalhosPorStatus.find(
          (item) => item.status === "RECUSADO"
        )?._count._all ?? 0;

      const aprovados =
        trabalhosPorStatus.find(
          (item) => item.status === "APROVADO"
        )?._count._all ?? 0;

      const publicados =
        trabalhosPorStatus.find(
          (item) => item.status === "PUBLICADO"
        )?._count._all ?? 0;

      // ============================
      // RESPONSE
      // ============================

      const responsePayload = {
        sucesso: true,
        dados: {
          totalTrabalhos,
          pendentes,
          recusado: recusado,
          aprovados,
          publicados,
          utilizadores: totalUtilizadores,
        },
      };

      // ============================
      // CACHE - 60 SEGUNDOS
      // ============================

      try {
        await redis.set(
          cacheKey,
          JSON.stringify(responsePayload),
          {
            EX: 60,
          }
        );
      } catch (err) {
        console.warn("Não foi possível guardar dashboard no Redis");
      }

      return res.json(responsePayload);
    } catch (e: any) {
      return res.status(500).json({
        sucesso: false,
        erro: "Não foi possível carregar os dados da dashboard.",
        detalhes: e.message,
      });
    }
  }
);

export default router