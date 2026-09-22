import express, { Application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import usuarioRoutes from "./routes/usuarioRoutes";
import authRoutes from "./routes/authRoutes";
import departamentoRoutes from "./routes/departamentoRoutes";
import especialidadeRoutes from "./routes/especialidadeRoutes";
import trabalhosRoutes from "./routes/trabalhosRoutes";
import uploadRouter from "./routes/uploadRouter";
import { SendOTP } from "./routes/sendOTP";
import { RefreshToken } from "./routes/refreshToken";
import buscaInteligente from "./routes/buscaInteligente";
import { errorHandler } from "./middleware/globalMiddleware";
import { swaggerSpec } from "./docs/swagger";
import dashboardRouter from "./routes/dashboard";

const apiV1 = "/api/v1";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Routes
app.use("/uploads", express.static("uploads"));

app.use(`${apiV1}/upload`, uploadRouter);
app.use(`${apiV1}/trabalhos`, trabalhosRoutes);
app.use(`${apiV1}/departamentos`, departamentoRoutes);
app.use(`${apiV1}/usuarios`, usuarioRoutes);
app.use(`${apiV1}/especialidades`, especialidadeRoutes);
app.use(`${apiV1}/auth`, authRoutes);
app.use(`${apiV1}/dashboard`, dashboardRouter);

app.post(`${apiV1}/send-otp`, SendOTP);
app.post(`${apiV1}/refresh`, RefreshToken);

app.use(`${apiV1}/semantic`, buscaInteligente);

app.use(errorHandler);

export default app;