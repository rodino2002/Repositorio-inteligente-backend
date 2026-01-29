import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import usuarioRoutes from "./routes/usuarioRoutes"; 
import authRoutes from "./routes/authRoutes";       
import departamentoRoutes from "./routes/departamentoRoutes";
import especialidadeRoutes from "./routes/especialidadeRoutes";
import trabalhosRoutes from "./routes/trabalhosRoutes";
import { errorHandler } from "./middleware/globalMiddleware";
import uploadRouter from "./routes/uploadRouter";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

console.log(dotenv)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});


//routes
app.use("/upload", uploadRouter )
app.use("/trabalhos", trabalhosRoutes )
app.use("/departamentos", departamentoRoutes); // certo
app.use("/usuarios", usuarioRoutes);
app.use("/especialidades", especialidadeRoutes);
app.use("/auth", authRoutes);
app.use(errorHandler)

