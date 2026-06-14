import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware";
import { validarBI } from "../services/biValidation.service";
import {
  gerarAccessToken,
  gerarRefreshToken
} from "../utils/jwt";

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_KEY || "keysecret";

// Registro
router.post("/register", async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  try {
    const senhaHashed = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHashed,
      },
    });

    const payload = {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    const accessToken = gerarAccessToken(payload);
    const refreshToken = gerarRefreshToken(payload);

    res.status(201).json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
      accessToken,
      refreshToken,
    });

  } catch (e: any) {
    res.status(400).json({
      erro: "Não foi possível registrar usuário.",
      detalhes: e.message,
    });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(403).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaValida) {
      return res.status(403).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    const payload = {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    const accessToken = gerarAccessToken(payload);
    const refreshToken = gerarRefreshToken(payload);

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      accessToken,
      refreshToken,
    });

  } catch (e: any) {
    res.status(500).json({
      erro: "Erro ao fazer login.",
      detalhes: e.message,
    });
  }
});

//logout 
router.post("/logout", 
  //authMiddleware, 
  async (req: Request, res: Response) => {
  return res.json({
    sucesso: true,
    mensagem: "Logout realizado com sucesso",
  });
});

// validar BI
router.get("/validate_BI", 
  //authMiddleware, 
  async (req: Request, res: Response) => {

    const {bi} = req.query

    if(!bi) return res.status(400).json({message:"Número de BI obrigatório"});

    try {

      const bi_number = String(bi)

      const response = await validarBI(bi_number)
      //console.log(response)
      if(!response.valido) return res.status(400).json({message: "BI não encontrado"})
      

      return res.json({
        nome: response.nome
      }).status(200)

    } catch (error) {
      console.log(error)
      return res.json({message:"Erro ao validat BI"}).status(500);
    }

});


export default router;
