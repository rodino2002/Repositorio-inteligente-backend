"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePDF = validatePDF;
function validatePDF(req, res, next) {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }
    if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ erro: "Apenas arquivos PDF são permitidos." });
    }
    next();
}
