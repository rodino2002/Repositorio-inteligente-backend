"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/departamentoRoutes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const role_1 = require("../types/role");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// ============================
// CREATE - Criar Departamento
// ============================
router.post("/", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN), async (req, res) => {
    const { nome, descricao } = req.body;
    try {
        const novo = await prisma.departamento.create({
            data: { nome, descricao },
        });
        res.status(201).json({ sucesso: true, dados: novo });
    }
    catch (e) {
        res.status(400).json({
            sucesso: false,
            erro: "Não foi possível criar o departamento.",
            detalhes: e.message,
        });
    }
});
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
    }
    catch (e) {
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
    }
    catch (e) {
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
router.put("/:id", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN), async (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    try {
        const atualizado = await prisma.departamento.update({
            where: { id: parseInt(id) },
            data: { nome, descricao },
        });
        res.json({ sucesso: true, dados: atualizado });
    }
    catch (e) {
        res.status(400).json({
            sucesso: false,
            erro: "Não foi possível atualizar o departamento.",
            detalhes: e.message,
        });
    }
});
// ============================
// DELETE
// ============================
router.delete("/:id", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN), async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.departamento.delete({
            where: { id: parseInt(id) },
        });
        res.json({ sucesso: true, mensagem: "Departamento removido com sucesso." });
    }
    catch (e) {
        res.status(400).json({
            sucesso: false,
            erro: "Não foi possível deletar o departamento.",
            detalhes: e.message,
        });
    }
});
exports.default = router;
