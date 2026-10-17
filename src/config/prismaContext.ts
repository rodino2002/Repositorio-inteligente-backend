
import { AsyncLocalStorage } from "node:async_hooks";
import type { PrismaClient } from "@prisma/client";

const prismaStorage = new AsyncLocalStorage<PrismaClient>();

export function runWithPrisma<T>(
  client: PrismaClient,
  callback: () => T
): T {
  return prismaStorage.run(client, callback);
}

export function getRequestPrisma(): PrismaClient | undefined {
  return prismaStorage.getStore();
}
