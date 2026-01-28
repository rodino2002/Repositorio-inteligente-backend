import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

  const status = err.status || 500;
  const message = err.message || "Erro interno do servidor";

  res.status(status).json({
    sucesso: false,
    erro: message,
    detalhes: err.details || null,
  });
};
