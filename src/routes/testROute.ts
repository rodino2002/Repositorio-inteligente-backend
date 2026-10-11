import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const total = await prisma.departamento.count();

    return res.json({
      sucesso: true,
      total,
    });
  } catch (error: any) {
    console.error("TEST PRISMA ERROR:", error);

    return res.status(500).json({
      sucesso: false,
      erro: error?.message ?? String(error),
    });
  }
});

export default router;