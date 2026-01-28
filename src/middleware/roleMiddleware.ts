import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

// Recebe um ou mais roles permitidos
export const allowRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuario;
   

    if (!usuario || !usuario.role || !roles.includes(usuario.role)) {
      return res.status(403).json({ erro: "Acesso negado." });
    }

    next();
  };
};
