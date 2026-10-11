"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import swaggerUi from "swagger-ui-express";
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const departamentoRoutes_1 = __importDefault(require("./routes/departamentoRoutes"));
const especialidadeRoutes_1 = __importDefault(require("./routes/especialidadeRoutes"));
const trabalhosRoutes_1 = __importDefault(require("./routes/trabalhosRoutes"));
const uploadRouter_1 = __importDefault(require("./routes/uploadRouter"));
const sendOTP_1 = require("./routes/sendOTP");
const refreshToken_1 = require("./routes/refreshToken");
const buscaInteligente_1 = __importDefault(require("./routes/buscaInteligente"));
const globalMiddleware_1 = require("./middleware/globalMiddleware");
// import { swaggerSpec } from "./docs/swagger";
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const testROute_1 = __importDefault(require("./routes/testROute"));
const apiV1 = "/api/v1";
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.use(
//   "/docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec)
// );
// app.get("/swagger.json", (_req, res) => {
//   res.json(swaggerSpec);
// });
// Routes
// app.use("/uploads", express.static("uploads"));
app.use(`${apiV1}/test-prisma`, testROute_1.default);
app.use(`${apiV1}/upload`, uploadRouter_1.default);
app.use(`${apiV1}/trabalhos`, trabalhosRoutes_1.default);
app.use(`${apiV1}/departamentos`, departamentoRoutes_1.default);
app.use(`${apiV1}/usuarios`, usuarioRoutes_1.default);
app.use(`${apiV1}/especialidades`, especialidadeRoutes_1.default);
app.use(`${apiV1}/auth`, authRoutes_1.default);
app.use(`${apiV1}/dashboard`, dashboard_1.default);
app.post(`${apiV1}/send-otp`, sendOTP_1.SendOTP);
app.post(`${apiV1}/refresh`, refreshToken_1.RefreshToken);
app.use(`${apiV1}/semantic`, buscaInteligente_1.default);
app.use(globalMiddleware_1.errorHandler);
exports.default = app;
