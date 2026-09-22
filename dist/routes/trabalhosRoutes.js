"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const role_1 = require("../types/role");
const client_2 = require("@prisma/client");
const embedding_service_1 = require("../services/embedding.service");
const normalizaTexto_1 = require("../utils/normalizaTexto");
const redis_1 = require("../lib/redis");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// ============================
// TIPOS DE TRABALHO
// ============================
router.get("/tipos_de_trabalhos", async (req, res) => {
    try {
        const tipos = await prisma.tipoTrabalho.findMany({
            select: {
                id: true,
                nome: true,
            }
        });
        res.status(200).json({ sucesso: true, dados: tipos });
    }
    catch (e) {
        console.error("ERRO AO BUSCAR TIPOS DE TRABALHO:", e);
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// ============================
// POST - CRIAR TRABALHO
// ============================
router.post("/", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { titulo, resumo, fileUrl, departamentoId, especialidadesIds, tipoTrabalhoId, } = req.body;
        const autorId = req.usuario.id;
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
        const autor = await prisma.usuario.findUnique({
            where: { id: autorId },
            select: { nome: true },
        });
        // Texto rico para embedding
        const textoEmbedding = (0, normalizaTexto_1.normalizar)(`
        Título: ${titulo}
        Resumo: ${resumo}
        Departamento: ${departamento?.nome ?? ""}
        Especialidades: ${especialidades.map((e) => e.nome).join(", ")}
        Tipo de Trabalho: ${trabalhoTipo?.nome ?? ""}
        Autor: ${autor?.nome ?? ""}
      `);
        // Gerar embedding
        const embeddingRaw = await (0, embedding_service_1.generateEmbedding)(textoEmbedding);
        const embedding = Array.from(embeddingRaw);
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
                    connect: especialidadesIds?.map((id) => ({
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
        const keys = await redis_1.redis.keys("trabalhos:list:*");
        if (keys.length) {
            await redis_1.redis.del(keys);
        }
        return res.status(201).json({
            sucesso: true,
            dados: novo,
        });
    }
    catch (e) {
        console.error("ERRO CRIAR TRABALHO:", e);
        return res.status(500).json({
            sucesso: false,
            erro: e.message,
        });
    }
});
// ============================
// LIST - Listar Trabalhos
// ============================
router.get("/", async (req, res) => {
    const { departamentoId, autorNome, especialidadeId, status, start_date, end_date, page, per_page, tipoTrabalhoId, tag, // palavra-chave para busca no título ou resumo,
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
    const cacheKey = `trabalhos:list:` +
        `dep=${departamentoId ?? "all"}:` +
        `autor=${autorNome ?? "all"}:` +
        `esp=${especialidadeId ?? "all"}:` +
        `status=${status ?? "all"}:` +
        `start=${start_date ?? "none"}:` +
        `tipo=${tipoTrabalhoId ?? "all"}:` +
        `end=${end_date ?? "none"}:` +
        `page=${pageNumber}:` +
        `per_page=${limitNumber}`;
    let cachedData = null;
    try {
        cachedData = await redis_1.redis.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
    }
    catch (err) {
        console.warn("Redis indisponível, seguindo sem cache");
    }
    try {
        const where = {
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
                ? status
                : undefined,
            createdAt: startDate || endDate
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
                    }
                },
                motivoRejeicao: true,
                tipoTrabalho: {
                    select: {
                        id: true,
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
        await redis_1.redis.set(cacheKey, JSON.stringify(responsePayload), {
            EX: 60,
        }); // cache por 60 segundos no redis
        return res.json(responsePayload);
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// ============================
// LIST - Listar Trabalhos do user logado
// ============================
router.get("/me", authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = Number(req.usuario?.id); // vindo do middleware de autenticação
    const { especialidadeId, status, start_date, end_date, page, per_page, tipoTrabalhoId, } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(per_page) || 20;
    const skip = (pageNumber - 1) * limitNumber;
    const startDate = start_date ? new Date(String(start_date)) : undefined;
    const endDate = end_date ? new Date(String(end_date)) : undefined;
    if (endDate)
        endDate.setHours(23, 59, 59, 999);
    const cacheKey = `trabalhos:me:${userId}:` +
        `esp=${especialidadeId ?? "all"}:` +
        `status=${status ?? "all"}:` +
        `start=${start_date ?? "none"}:` +
        `end=${end_date ?? "none"}:` +
        `tipo=${tipoTrabalhoId ?? "all"}:` +
        `page=${pageNumber}:` +
        `per_page=${limitNumber}`;
    try {
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return res.json(JSON.parse(cached));
    }
    catch {
        console.warn("Redis indisponível, seguindo sem cache");
    }
    if (isNaN(userId)) {
        console.log(userId);
        return res.status(401).json({ sucesso: false, erro: "Utilizador não autenticado" });
    }
    try {
        const where = {
            autor: {
                id: userId, // filtra pelo user logado
            },
            especialidades: especialidadeId
                ? { some: { id: Number(especialidadeId) } }
                : undefined,
            status: status ? status : undefined,
            tipoTrabalhoId: tipoTrabalhoId ? Number(tipoTrabalhoId) : undefined,
            createdAt: startDate || endDate
                ? { gte: startDate, lte: endDate }
                : undefined,
        };
        const [trabalhos, total] = await Promise.all([
            prisma.trabalho.findMany({
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
                    autor: { select: { id: true, nome: true } },
                    departamento: { select: { id: true, nome: true } },
                    especialidades: { select: { id: true, nome: true } },
                    motivoRejeicao: true,
                    tipoTrabalho: { select: { id: true, nome: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.trabalho.count({ where }),
        ]);
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
        await redis_1.redis.set(cacheKey, JSON.stringify(responsePayload), { EX: 60 });
        return res.json(responsePayload);
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// ============================
// READ - Trabalho por ID
// ============================
router.get("/:id", async (req, res) => {
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
        if (!item)
            return res.status(404).json({ erro: "Trabalho não encontrado" });
        res.json({ sucesso: true, dados: item });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// ============================
// UPDATE - Atualizar trabalho
// ============================
router.put("/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const usuarioId = req.usuario.id;
        const trabalho = await prisma.trabalho.findUnique({ where: { id } });
        if (!trabalho)
            return res.status(404).json({ erro: "Trabalho não encontrado" });
        // Apenas autor ou admin pode editar
        if (trabalho.autorId !== usuarioId && req.usuario.role !== role_1.Role.ADMIN) {
            return res.status(403).json({ erro: "Sem permissão para editar" });
        }
        const { titulo, resumo, fileUrl, departamentoId, especialidadesIds, tipoTrabalhoId } = req.body;
        const atualizado = await prisma.trabalho.update({
            where: { id },
            data: {
                titulo,
                resumo,
                fileUrl,
                departamentoId,
                especialidades: {
                    set: [], // limpa
                    connect: especialidadesIds?.map((id) => ({ id })) ?? [],
                },
                tipoTrabalhoId
            },
            include: {
                autor: true,
                departamento: true,
                especialidades: true,
                tipoTrabalho: true
            },
        });
        // invalidar TODOS os caches relacionados
        const keys = await redis_1.redis.keys("trabalhos:list:*");
        if (keys.length) {
            await redis_1.redis.del(keys);
        }
        res.json({ sucesso: true, dados: atualizado });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// ============================
// DELETE - Deletar trabalho
// ============================
router.delete("/:id", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN), // somente ADMIN pode deletar
async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.trabalho.delete({ where: { id } });
        // invalidar TODOS os caches relacionados
        const keys = await redis_1.redis.keys("trabalhos:list:*");
        if (keys.length) {
            await redis_1.redis.del(keys);
        }
        res.json({ sucesso: true, mensagem: "Trabalho deletado com sucesso" });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// PUBLICAR — muda para APROVADO
router.patch("/:id/publicar", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN, role_1.Role.AVALIADOR), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const trabalho = await prisma.trabalho.update({
            where: { id },
            data: { status: client_2.TrabalhoStatus.APROVADO },
        });
        // invalidar TODOS os caches relacionados
        const keys = await redis_1.redis.keys("trabalhos:list:*");
        if (keys.length) {
            await redis_1.redis.del(keys);
        }
        res.json({ sucesso: true, dados: trabalho });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// RECUSAR — muda para RECUSADO
router.patch("/:id/recusar", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN, role_1.Role.AVALIADOR), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { motivo } = req.body;
        const trabalho = await prisma.trabalho.update({
            where: { id },
            data: { status: client_2.TrabalhoStatus.RECUSADO, motivoRejeicao: motivo ?? null },
        });
        //  invalidar TODOS os caches relacionados
        const keys = await redis_1.redis.keys("trabalhos:list:*");
        if (keys.length) {
            await redis_1.redis.del(keys);
        }
        res.json({ sucesso: true, dados: trabalho });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// EM REVISÃO — muda para EM_REVISAO
router.patch("/:id/revisar", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN, role_1.Role.AVALIADOR), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const trabalho = await prisma.trabalho.update({
            where: { id },
            data: { status: client_2.TrabalhoStatus.EM_REVISAO },
        });
        res.json({ sucesso: true, dados: trabalho });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
// PENDENTE — volta para PENDENTE (caso pedirem revisão)
router.patch("/:id/pendente", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.allowRoles)(role_1.Role.ADMIN, role_1.Role.AVALIADOR), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const trabalho = await prisma.trabalho.update({
            where: { id },
            data: { status: client_2.TrabalhoStatus.PENDENTE },
        });
        res.json({ sucesso: true, dados: trabalho });
    }
    catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});
exports.default = router;
