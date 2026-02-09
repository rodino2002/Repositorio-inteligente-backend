import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_KEY || "keysecret";

// Interface para o payload do JWT
interface JwtPayload {
  id: number;
  email: string;
  role?: string; // se quiser guardar a role do usuário
}

// Interface customizada para o Request
export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ erro: "Token não fornecido", message: "Por favor, faça lagin!" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.usuario = decoded; 
    next();
  } catch (e) {
    res.status(401).json({ erro: "Token inválido" });
  }
};
