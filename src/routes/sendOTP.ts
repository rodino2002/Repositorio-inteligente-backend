import { gerarOtp } from "../services/createOtp.service";
import { Request, Response } from "express";

export const SendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email obrigatório" });

  try {
     await gerarOtp(email);
    res.json({ sucesso: true, message: "OTP enviado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, error: "Erro ao enviar OTP" });
  }
}