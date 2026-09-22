"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const RefreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(403).json({
                erro: "Refresh token ausente",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = (0, jwt_1.gerarAccessToken)({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
        return res.json({
            accessToken,
        });
    }
    catch (error) {
        return res.status(403).json({
            erro: "Refresh token inválido",
        });
    }
};
exports.RefreshToken = RefreshToken;
