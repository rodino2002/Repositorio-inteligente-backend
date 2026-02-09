// 🔹 Normalização básica
export const normalizar = (t: string) =>t
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();