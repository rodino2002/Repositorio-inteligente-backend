"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = void 0;
// Recebe um ou mais roles permitidos
const allowRoles = (...roles) => {
    return (req, res, next) => {
        const usuario = req.usuario;
        if (!usuario || !usuario.role || !roles.includes(usuario.role)) {
            return res.status(403).json({ erro: "Acesso negado." });
        }
        next();
    };
};
exports.allowRoles = allowRoles;
