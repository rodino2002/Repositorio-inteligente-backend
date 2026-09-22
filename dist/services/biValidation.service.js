"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarBI = validarBI;
const api_1 = require("../api/api");
async function validarBI(bi) {
    try {
        const inssResponse = await api_1.api_BI_GOV_INSS.get(`inscricao`, {
            params: {
                handler: "OperacoesComNif",
                nif: bi ?? "",
            },
            timeout: 5000,
        });
        if (inssResponse.data?.sucesso) {
            return {
                valido: true,
                nome: inssResponse.data.dados.nome,
                fonte: "INSS",
            };
        }
    }
    catch (error) {
        console.log("Erro ao buscar BI");
    }
    try {
        const edgarResponse = await api_1.api_BI_Edgar.get(`consultar/${bi}`, { timeout: 5000 });
        if (!edgarResponse.data?.error) {
            return {
                valido: true,
                nome: edgarResponse.data.name,
                fonte: "EDGAR",
            };
        }
    }
    catch (error) {
        console.log("Erro ao buscar BI");
    }
    return {
        valido: false,
    };
}
