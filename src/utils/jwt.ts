import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_KEY!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function gerarAccessToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
}

export function gerarRefreshToken(payload: any) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "3d",
  });
}   