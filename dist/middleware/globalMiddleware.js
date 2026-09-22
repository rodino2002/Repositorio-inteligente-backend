"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Erro interno do servidor";
    res.status(status).json({
        sucesso: false,
        erro: message,
        detalhes: err.details || null,
    });
};
exports.errorHandler = errorHandler;
