"use strict";
// import { PrismaClient } from "@prisma/client";
// import { PrismaNeonHTTP } from "@prisma/adapter-neon";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// const connectionString = process.env.DATABASE_URL;
// if (!connectionString) {
//   throw new Error("DATABASE_URL não configurada.");
// }
// const adapter = new PrismaNeonHTTP(connectionString, {});
// export const prisma = new PrismaClient({
//   adapter,
// });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL não configurada.");
}
const adapter = new adapter_pg_1.PrismaPg({
    connectionString,
});
exports.prisma = new client_1.PrismaClient({
    adapter,
});
