import { Request, Response, NextFunction } from "express";

export function validatePDF(req: Request, res: Response, next: NextFunction) {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ erro: "Nenhum arquivo enviado." });
  }

  if (file.mimetype !== "application/pdf") {
    return res.status(400).json({ erro: "Apenas arquivos PDF são permitidos." });
  }

  next();
}
