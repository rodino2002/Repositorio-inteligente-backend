"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerOptions = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
exports.swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Repositório TCC",
            version: "1.0.0",
            description: "Documentação da API de usuários e trabalhos",
        },
        servers: [
            { url: "http://localhost:3000/api/v1", description: "Servidor local" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        "./src/routes/*.ts",
        "./src/docs/*.swagger.ts"
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(exports.swaggerOptions);
