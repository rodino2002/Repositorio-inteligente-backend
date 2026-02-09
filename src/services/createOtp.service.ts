import { PrismaClient } from "@prisma/client";
import { sendOtpEmail } from "../config/mailer";


const prisma = new PrismaClient();

export const gerarOtp = async (email: string) => {
  // Gerar código OTP aleatório de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();

  // Expiração em 10 minutos
  const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

  // Salvar no banco
  const otp = await prisma.otp.create({
    data: {
      email,
      codigo,
      expiraEm,
    },
  });

  // Enviar email
  await sendOtpEmail(email, codigo);

  return otp;
};
