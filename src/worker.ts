// import app from "./app";

// export default app;

// import app from "./app";
// import { httpServerHandler } from "cloudflare:node";

// app.listen(3000);

// export default httpServerHandler({ port: 3000 });




import { handleAsNodeRequest } from "cloudflare:node";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runWithPrisma } from "./config/prismaContext";

let appReady: Promise<void> | undefined;

console.log("[ONNX RUNTIME CHECK]", {
  processNode: typeof process !== "undefined"
    ? process.versions?.node
    : "sem process",
  processRelease: typeof process !== "undefined"
    ? process.release?.name
    : "sem process",
  importScripts: typeof importScripts,
  window: typeof window,
  webSocketPair: typeof WebSocketPair,
});

interface Env {
  HYPERDRIVE: Hyperdrive;
  EMBEDDINGS_SERVICE_URL: string;
  EMBEDDINGS_SERVICE_TOKEN: string;
}
export default {

  async fetch(request: Request, env: Env): Promise<Response> {
    process.env.CLOUDFLARE_WORKER_RUNTIME = "true";
    process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;

    process.env.EMBEDDINGS_SERVICE_URL = env.EMBEDDINGS_SERVICE_URL;
    process.env.EMBEDDINGS_SERVICE_TOKEN = env.EMBEDDINGS_SERVICE_TOKEN;

    appReady ??= (async () => {
      const { default: app } = await import("./app");
      app.listen(3000);
    })();

    await appReady;

    const prismaRequest = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: env.HYPERDRIVE.connectionString,
      }),
    });

    try {
      return await runWithPrisma(prismaRequest, () =>
        handleAsNodeRequest(3000, request)
      );
    } finally {
      //await prismaRequest.$disconnect();
    }
  },

} satisfies ExportedHandler<Env>;
