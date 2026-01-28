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
// import { generateEmbedding } from "./services/embedding.service";
// import { cosineSimilarity } from "./utils/cosineSimilarity";


//dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// app.post("/embed", async (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ error: "Texto é obrigatório" });
//   }

//   const embedding = await generateEmbedding(text);

//   res.json({
//     length: embedding.length,
//     embedding,
//   });
// });


// const documents: any[] = [];

// async function indexMockDocuments() {
//   const mock = [
//     { id: 1, text: "React é uma biblioteca frontend" },
//     { id: 2, text: "Angular é um framework completo" },
//     { id: 3, text: "Como cozinhar arroz branco" }
//   ];

//   for (const doc of mock) {
//     const embedding = await generateEmbedding(doc.text);

//     documents.push({
//       ...doc,
//       embedding
//     });
//   }

//   console.log("📦 Documentos indexados");
// }

// indexMockDocuments()

// app.post("/search", async (req, res) => {
//   const { query } = req.body;

//   const queryEmbedding = await generateEmbedding(query);

//   const results = documents
//     .map(doc => ({
//       text: doc.text,
//       score: cosineSimilarity(queryEmbedding, doc.embedding)
//     }))
//     .sort((a, b) => b.score - a.score);

//   res.json(results);
// });


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

