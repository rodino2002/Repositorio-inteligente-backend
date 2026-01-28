// src/routes/especialidadeRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Role } from "../types/role";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const prisma = new PrismaClient();
const router = Router();

// ============================
// CREATE - Criar Especialidade
// ============================
router.post(
  "/",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { nome, descricao, departamentoId } = req.body;

    try {
      const nova = await prisma.especialidade.create({
        data: {
          nome,
          descricao,
          departamentoId: departamentoId ? Number(departamentoId) : null,
        },
      });

      res.status(201).json({ sucesso: true, dados: nova });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Erro ao criar especialidade.",
        detalhes: e.message,
      });
    }
  }
);

// ============================
// READ - Listar Especialidades
// ============================
router.get("/", authMiddleware, async (_req, res) => {
  try {
    const dados = await prisma.especialidade.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        departamento: true,
        usuarios: true,
      },
    });

    res.json({ sucesso: true, total: dados.length, dados });
  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao listar especialidades.",
      detalhes: e.message,
    });
  }
});

// ============================
// READ - Detalhe por ID
// ============================
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.especialidade.findUnique({
      where: { id: parseInt(id) },
      include: {
        departamento: true,
        usuarios: true,
      },
    });

    if (!item)
      return res.status(404).json({
        sucesso: false,
        erro: "Especialidade não encontrada.",
      });

    res.json({ sucesso: true, dados: item });
  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar especialidade.",
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
    const { nome, descricao, departamentoId } = req.body;

    try {
      const atualizado = await prisma.especialidade.update({
        where: { id: parseInt(id) },
        data: {
          nome,
          descricao,
          departamentoId: departamentoId ? Number(departamentoId) : null,
        },
      });

      res.json({ sucesso: true, dados: atualizado });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível atualizar a especialidade.",
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
      await prisma.especialidade.delete({
        where: { id: parseInt(id) },
      });

      res.json({ sucesso: true, mensagem: "Especialidade removida com sucesso." });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível deletar a especialidade.",
        detalhes: e.message,
      });
    }
  }
);

export default router;
