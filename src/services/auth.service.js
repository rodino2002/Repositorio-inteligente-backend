import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_KEY;

export async function hashSenha(senha) {
  return bcrypt.hash(senha, 10);
}

export async function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

export function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}
