// import app from "./app";

// export default app;

// import app from "./app";
// import { httpServerHandler } from "cloudflare:node";

// app.listen(3000);

// export default httpServerHandler({ port: 3000 });



import { handleAsNodeRequest } from "cloudflare:node";

let appReady: Promise<void> | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    appReady ??= (async () => {
      process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;

      const { default: app } = await import("./app");

      app.listen(3000);
    })();

    await appReady;

    return handleAsNodeRequest(3000, request);
  },
} satisfies ExportedHandler<Env>;


