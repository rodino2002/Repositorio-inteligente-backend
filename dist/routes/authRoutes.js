"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const biValidation_service_1 = require("../services/biValidation.service");
const jwt_1 = require("../utils/jwt");
const role_1 = require("../types/role");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_KEY || "keysecret";
// Registro
router.post("/register", async (req, res) => {
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
        // 2. Role ESTUDANTE
        // -----------------------------
        const roleFinal = role_1.Role.ESTUDANTE;
        if (!Object.values(role_1.Role).includes(roleFinal)) {
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
// Login
router.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
        });
        if (!usuario) {
            return res.status(403).json({
                erro: "Usuário ou senha inválidos",
            });
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(403).json({
                erro: "Usuário ou senha inválidos",
            });
        }
        const payload = {
            id: usuario.id,
            email: usuario.email,
            role: usuario.role,
        };
        const accessToken = (0, jwt_1.gerarAccessToken)(payload);
        const refreshToken = (0, jwt_1.gerarRefreshToken)(payload);
        res.json({
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (e) {
        res.status(500).json({
            erro: "Erro ao fazer login.",
            detalhes: e.message,
        });
    }
});
//logout 
router.post("/logout", 
//authMiddleware, 
async (req, res) => {
    return res.json({
        sucesso: true,
        mensagem: "Logout realizado com sucesso",
    });
});
// validar BI
router.get("/validate_BI", 
//authMiddleware, 
async (req, res) => {
    const { bi } = req.query;
    if (!bi)
        return res.status(400).json({ message: "Número de BI obrigatório" });
    try {
        const bi_number = String(bi);
        const response = await (0, biValidation_service_1.validarBI)(bi_number);
        //console.log(response)
        if (!response.valido)
            return res.status(400).json({ message: "BI não encontrado" });
        return res.json({
            nome: response.nome
        }).status(200);
    }
    catch (error) {
        console.log(error);
        return res.json({ message: "Erro ao validat BI" }).status(500);
    }
});
exports.default = router;
