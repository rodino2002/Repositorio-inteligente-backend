import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { gerarAccessToken } from "../utils/jwt";

export const RefreshToken = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(403).json({
        erro: "Refresh token ausente",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as any;

    const accessToken = gerarAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    return res.json({
      accessToken,
    });

  } catch (error) {
    return res.status(403).json({
      erro: "Refresh token inválido",
    });
  }
};