import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        email: string;
        role?: string;
        // adiciona outros campos que o teu token tiver
      };
    }
  }
}