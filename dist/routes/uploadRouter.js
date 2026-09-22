"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multerConfig_1 = require("../config/multerConfig");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validatePDF_1 = require("../middleware/validatePDF");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authMiddleware, multerConfig_1.upload.single("file"), validatePDF_1.validatePDF, (req, res) => {
    // req.file bem tipado:
    const file = req.file;
    if (!file) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado" });
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    return res.status(201).json({
        sucesso: true,
        fileUrl,
    });
});
exports.default = router;
