// src/routes/departamentoRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Role } from "../types/role";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const prisma = new PrismaClient();
const router = Router();

// ============================
// CREATE - Criar Departamento
// ============================
router.post(
  "/",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { nome, descricao } = req.body;

    try {
      const novo = await prisma.departamento.create({
        data: { nome, descricao },
      });

      res.status(201).json({ sucesso: true, dados: novo });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível criar o departamento.",
        detalhes: e.message,
      });
    }
  }
);

// ============================
// READ - Listar Departamentos
// ============================
router.get("/", async (_req, res) => {
  try {
    const dados = await prisma.departamento.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        especialidades: true,
        funcionarios: true,
      },
    });

    res.json({ sucesso: true, total: dados.length, dados });
  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao listar departamentos.",
      detalhes: e.message,
    });
  }
});

// ============================
// READ - Detalhe por ID
// ============================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.departamento.findUnique({
      where: { id: parseInt(id) },
      include: {
        especialidades: true,
        funcionarios: true,
      },
    });

    if (!item)
      return res.status(404).json({
        sucesso: false,
        erro: "Departamento não encontrado.",
      });

    res.json({ sucesso: true, dados: item });
  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar departamento.",
      detalhes: e.message,
    });
  }
});

// ============================
// UPDATE
// ============================
router.put(
  "/:id",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    try {
      const atualizado = await prisma.departamento.update({
        where: { id: parseInt(id) },
        data: { nome, descricao },
      });

      res.json({ sucesso: true, dados: atualizado });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível atualizar o departamento.",
        detalhes: e.message,
      });
    }
  }
);

// ============================
// DELETE
// ============================
router.delete(
  "/:id",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.departamento.delete({
        where: { id: parseInt(id) },
      });

      res.json({ sucesso: true, mensagem: "Departamento removido com sucesso." });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível deletar o departamento.",
        detalhes: e.message,
      });
    }
  }
);

export default router;
