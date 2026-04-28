import axios from "axios";
import { api_BI_Edgar, api_BI_GOV_INSS } from "../api/api";

interface BIResponse {
  nome?: string;
  valido: boolean;
  fonte?: "INSS" | "EDGAR";
}

export async function validarBI(bi: string): Promise<BIResponse> {
  
  try {
    const inssResponse = await api_BI_GOV_INSS.get(
      `inscricao`,
      {
        params: {
          handler: "OperacoesComNif",
          nif: bi ?? "",
        },
        timeout: 5000,
      }
    );

    if (inssResponse.data?.sucesso) {
      return {
        valido: true,
        nome: inssResponse.data.dados.nome,
        fonte: "INSS",
      };
    }
  } catch (error) {
    console.log("Erro ao buscar BI");
  }

  try {
    const edgarResponse = await api_BI_Edgar.get(
      `consultar/${bi}`,
      { timeout: 5000 }
    );

    if (!edgarResponse.data?.error) {
      return {
        valido: true,
        nome: edgarResponse.data.name,
        fonte: "EDGAR",
      };
    }
  } catch (error) {
    console.log("Erro ao buscar BI")
  }

  return {
    valido: false,
  };
}
