import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import usuarioRoutes from "./routes/usuarioRoutes"; 
import authRoutes from "./routes/authRoutes";       
import departamentoRoutes from "./routes/departamentoRoutes";
import especialidadeRoutes from "./routes/especialidadeRoutes";
import trabalhosRoutes from "./routes/trabalhosRoutes";
import { errorHandler } from "./middleware/globalMiddleware";
import uploadRouter from "./routes/uploadRouter";
import { SendOTP } from "./routes/sendOTP";
import { swaggerSpec } from "./docs/swagger";
import { connectRedis } from "./lib/redis"

const apiV1 = "/api/v1";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}/api/v1/`);
});


connectRedis()


app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});
//routes

app.use(`${apiV1}/upload`, uploadRouter);
app.use(`${apiV1}/trabalhos`, trabalhosRoutes);
app.use(`${apiV1}/departamentos`, departamentoRoutes);
app.use(`${apiV1}/usuarios`, usuarioRoutes);
app.use(`${apiV1}/especialidades`, especialidadeRoutes);
app.use(`${apiV1}/auth`, authRoutes);
app.post(`${apiV1}/send-otp`, SendOTP);

app.use(errorHandler);


