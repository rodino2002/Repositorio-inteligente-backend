"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const redis_1 = require("./lib/redis");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
async function startServer() {
    await (0, redis_1.connectRedis)();
    app_1.default.listen(PORT, () => {
        console.log(`Servidor iniciado em http://localhost:${PORT}/api/v1/`);
    });
}
startServer().catch((error) => {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
});
