import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // ex: smtp.gmail.com
  port: 587,                     // 465 para SSL
  secure: false,                 // true se usar SSL
  auth: {
    user: process.env.EMAIL_USER, // seu email
    pass: process.env.EMAIL_PASS, // sua senha ou app password
  },
});

export const sendOtpEmail = async (email: string, codigo: string) => {
  const mailOptions = {
    from: `"Seu App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Seu código OTP",
    text: `Seu código OTP é: ${codigo}. Ele expira em 10 minutos.`,
    html: `<p>Seu código OTP é: <b>${codigo}</b></p><p>Ele expira em 10 minutos.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
