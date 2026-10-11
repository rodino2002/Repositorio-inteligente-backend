// import { PrismaClient } from "@prisma/client";
// import { PrismaNeonHTTP } from "@prisma/adapter-neon";

// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//   throw new Error("DATABASE_URL não configurada.");
// }

// const adapter = new PrismaNeonHTTP(connectionString, {});

// export const prisma = new PrismaClient({
//   adapter,
// });


import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});

