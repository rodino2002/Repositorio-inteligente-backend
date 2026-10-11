"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarOtp = void 0;
const mailer_1 = require("../config/mailer");
const prisma_1 = require("../config/prisma");
const gerarOtp = async (email) => {
    // Gerar código OTP aleatório de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiração em 10 minutos
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);
    // Salvar no banco
    const otp = await prisma_1.prisma.otp.create({
        data: {
            email,
            codigo,
            expiraEm,
        },
    });
    // Enviar email
    await (0, mailer_1.sendOtpEmail)(email, codigo);
    return otp;
};
exports.gerarOtp = gerarOtp;
