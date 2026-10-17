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
import { getRequestPrisma } from "./prismaContext";

let localPrisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  const requestPrisma = getRequestPrisma();

  if (requestPrisma) {
    return requestPrisma;
  }

  // No Worker, não permitir que uma rota use acidentalmente
  // um cliente Prisma global partilhado.
  if (process.env.CLOUDFLARE_WORKER_RUNTIME === "true") {
    throw new Error(
      "PrismaClient não encontrado no contexto deste pedido."
    );
  }

  // Mantém o comportamento actual no Node.js local.
  if (!localPrisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL não configurada.");
    }

    localPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  return localPrisma;
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    if (typeof value === "function") {
      return value.bind(client);
    }

    if (value !== null && typeof value === "object") {
      return new Proxy(value, {
        get(delegate, member) {
          const result = Reflect.get(delegate, member, delegate);

          return typeof result === "function"
            ? result.bind(delegate)
            : result;
        },
      });
    }

    return value;
  },
});

export const prisma = prismaProxy;
