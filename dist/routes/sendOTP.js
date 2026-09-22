"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendOTP = void 0;
const createOtp_service_1 = require("../services/createOtp.service");
const SendOTP = async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email obrigatório" });
    try {
        await (0, createOtp_service_1.gerarOtp)(email);
        res.json({ sucesso: true, message: "OTP enviado com sucesso!" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ sucesso: false, error: "Erro ao enviar OTP" });
    }
};
exports.SendOTP = SendOTP;
