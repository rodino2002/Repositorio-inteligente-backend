"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com", // ex: smtp.gmail.com
    port: 587, // 465 para SSL
    secure: false, // true se usar SSL
    auth: {
        user: process.env.EMAIL_USER, // seu email
        pass: process.env.EMAIL_PASS, // sua senha ou app password
    },
});
const sendOtpEmail = async (email, codigo) => {
    const mailOptions = {
        from: `"Seu App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Seu código OTP",
        text: `Seu código OTP é: ${codigo}. Ele expira em 10 minutos.`,
        html: `<p>Seu código OTP é: <b>${codigo}</b></p><p>Ele expira em 10 minutos.</p>`,
    };
    await exports.transporter.sendMail(mailOptions);
};
exports.sendOtpEmail = sendOtpEmail;
