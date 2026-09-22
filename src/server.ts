import dotenv from "dotenv";
import app from "./app";
import { connectRedis } from "./lib/redis";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectRedis();

  app.listen(PORT, () => {
    console.log(
      `Servidor iniciado em http://localhost:${PORT}/api/v1/`
    );
  });
}

startServer().catch((error) => {
  console.error("Erro ao iniciar servidor:", error);
  process.exit(1);
});