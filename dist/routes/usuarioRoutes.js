"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/usuarioRoutes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_2 = require("@prisma/client");
const biValidation_service_1 = require("../services/biValidation.service");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// ============================
// CREATE - Criar novo usuário (Admin pode definir role)
// ============================
router.post("/", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(client_2.Role.ADMIN), async (req, res) => {
    try {
        const { nome, email, senha, role, departamentoId, especialidadesIds, bi_number } = req.body;
        // -----------------------------
        // 1. Validação básica
        // -----------------------------
        if (!nome || !email || !senha || !bi_number) {
            return res.status(400).json({
                sucesso: false,
                erro: "Nome, email, BI e senha são obrigatórios."
            });
        }
        // -----------------------------
        // 1.1 Validação do BI
        // -----------------------------
        const resultadoBI = await (0, biValidation_service_1.validarBI)(bi_number);
        if (!resultadoBI.valido) {
            return res.status(400).json({
                erro: "BI inválido ou não encontrado",
            });
        }
        // opcional: cruzar nomes
        if (resultadoBI.nome && resultadoBI.nome !== nome) {
            return res.status(400).json({
                erro: "Nome não corresponde ao BI informado",
            });
        }
        // -----------------------------
        // 2. Validar Role (opcional no request)
        // -----------------------------
        const roleFinal = role ?? client_2.Role.ESTUDANTE;
        if (!Object.values(client_2.Role).includes(roleFinal)) {
            return res.status(400).json({ sucesso: false, erro: "Role inválida." });
        }
        // -----------------------------
        // 3. Validar Departamento se enviado
        // -----------------------------
        if (departamentoId !== undefined && departamentoId !== null) {
            const deptExiste = await prisma.departamento.findUnique({
                where: { id: Number(departamentoId) },
            });
            if (!deptExiste) {
                return res.status(400).json({
                    sucesso: false,
                    erro: "Departamento não encontrado.",
                });
            }
        }
        // -----------------------------
        // 4. Validar Especialidades se enviadas
        // -----------------------------
        if (especialidadesIds?.length) {
            const existentes = await prisma.especialidade.findMany({
                where: { id: { in: especialidadesIds } },
            });
            if (existentes.length !== especialidadesIds.length) {
                return res.status(400).json({
                    sucesso: false,
                    erro: "Algumas especialidades não existem.",
                });
            }
        }
        // -----------------------------
        // 5. Criar usuário no Prisma
        // -----------------------------
        const senhaHashed = await bcryptjs_1.default.hash(senha, 10);
        const biNormalizado = bi_number.trim().toUpperCase(); // formatar o número de BI
        const novoUsuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                bi_number: biNormalizado,
                senha: senhaHashed,
                role: roleFinal ?? undefined,
                departamentoId: departamentoId ?? null,
                especialidades: {
                    connect: especialidadesIds?.map((id) => ({ id })) ?? [],
                },
            },
            include: {
                especialidades: true, // inclui as especialidades no retorno
                departamento: true, // opcional: inclui dados do departamento
            },
        });
        // remove senha antes de enviar
        const { senha: _, ...usuarioSemSenha } = novoUsuario;
        return res.status(201).json({
            sucesso: true,
            dados: usuarioSemSenha,
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao criar usuário.",
            detalhes: e.message,
        });
    }
});
// ============================
// READ - Listar todos os usuários
// ============================
router.get("/", authMiddleware_1.authMiddleware, async (req, res) => {
    const { role } = req.query;
    try {
        const usuarios = await prisma.usuario.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: role
                ? {
                    role: role,
                }
                : undefined,
            select: {
                id: true,
                nome: true,
                email: true,
                bi_number: true,
                role: true,
                departamentoId: true,
                createdAt: true,
                atualizadoEm: true,
                departamento: true,
                especialidades: true,
            }
        });
        res.json({ sucesso: true, total: usuarios.length, dados: usuarios });
    }
    catch (e) {
        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível listar os usuários.",
            detalhes: e.message,
        });
    }
});
// ============================
// UPDATE - Atualizar usuário (Admin pode atualizar role e senha)
// ============================
router.put("/:id", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(client_2.Role.ADMIN), async (req, res) => {
    const { id } = req.params;
    const { nome, email, bi_number, senha, role, departamentoId, especialidadesIds, } = req.body;
    try {
        const data = {};
        // -----------------------------
        // Dados básicos
        // -----------------------------
        if (nome !== undefined) {
            data.nome = nome;
        }
        if (email !== undefined) {
            data.email = email;
        }
        if (bi_number !== undefined) {
            data.bi_number = bi_number.trim().toUpperCase();
        }
        // -----------------------------
        // Senha
        // -----------------------------
        if (senha) {
            data.senha = await bcryptjs_1.default.hash(senha, 10);
        }
        // -----------------------------
        // Role
        // -----------------------------
        if (role !== undefined &&
            Object.values(client_2.Role).includes(role)) {
            data.role = role;
        }
        // -----------------------------
        // Departamento
        // -----------------------------
        if (departamentoId !== undefined) {
            data.departamentoId = departamentoId;
        }
        // -----------------------------
        // Especialidades
        // -----------------------------
        if (especialidadesIds !== undefined) {
            data.especialidades = {
                set: especialidadesIds.map((id) => ({
                    id: Number(id),
                })),
            };
        }
        // -----------------------------
        // Atualizar usuário
        // -----------------------------
        const usuarioAtualizado = await prisma.usuario.update({
            where: {
                id: parseInt(id),
            },
            data,
            include: {
                especialidades: true,
                departamento: true,
            },
        });
        // -----------------------------
        // Remover senha da resposta
        // -----------------------------
        const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;
        return res.json({
            sucesso: true,
            dados: usuarioSemSenha,
        });
    }
    catch (e) {
        console.error(e);
        return res.status(400).json({
            sucesso: false,
            erro: "Não foi possível atualizar o usuário.",
            detalhes: e.message,
        });
    }
});
// ============================
// DELETE - Remover usuário (Somente Admin)
// ============================
router.delete("/:id", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(client_2.Role.ADMIN), async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.usuario.delete({ where: { id: parseInt(id) } });
        res.json({ sucesso: true, mensagem: "Usuário deletado com sucesso." });
    }
    catch (e) {
        res.status(400).json({
            sucesso: false,
            erro: "Não foi possível deletar o usuário.",
            detalhes: e.message,
        });
    }
});
// ============================
// READ - Detalhes do usuário autenticado
// ============================
router.get("/details", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await prisma.usuario.findUnique({
            where: {
                id: usuarioId,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                bi_number: true,
                role: true,
                departamentoId: true,
                createdAt: true,
                atualizadoEm: true,
                departamento: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                erro: "Utilizador não encontrado.",
            });
        }
        return res.status(200).json({
            sucesso: true,
            dados: usuario,
        });
    }
    catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar usuário.",
            detalhes: req.usuario,
        });
    }
});
/// ============================
// UPDATE - Atualizar perfil do usuário autenticado
// ============================
// ============================
// READ - Buscar usuário por ID
// ============================
router.get("/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(id) },
        });
        if (!usuario)
            return res.status(404).json({ sucesso: false, erro: "Usuário não encontrado." });
        res.json({ sucesso: true, dados: usuario });
    }
    catch (e) {
        res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar usuário.",
            detalhes: e.message,
        });
    }
});
router.patch("/profile", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { nome, email, bi_number, } = req.body;
        const usuario = await prisma.usuario.findUnique({
            where: {
                id: usuarioId,
            },
        });
        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                erro: "Utilizador não encontrado",
            });
        }
        const atualizado = await prisma.usuario.update({
            where: {
                id: usuarioId,
            },
            data: {
                nome,
                email,
                bi_number,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                bi_number: true,
                role: true,
                departamentoId: true,
                createdAt: true,
                atualizadoEm: true,
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
                    },
                },
            },
        });
        return res.status(200).json({
            sucesso: true,
            mensagem: "Perfil atualizado com sucesso",
            dados: atualizado,
        });
    }
    catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return res.status(500).json({
            sucesso: false,
            erro: "Erro interno do servidor",
        });
    }
});
exports.default = router;
