"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    try {
        const total = await prisma_1.prisma.departamento.count();
        return res.json({
            sucesso: true,
            total,
        });
    }
    catch (error) {
        console.error("TEST PRISMA ERROR:", error);
        return res.status(500).json({
            sucesso: false,
            erro: error?.message ?? String(error),
        });
    }
});
exports.default = router;
