"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularScore = calcularScore;
function normalize(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
function calcularScore(query, item) {
    let score = item.similarity;
    const texto = `
      ${item.titulo}
      ${item.resumo}
      ${item.departamento?.nome || ""}
      ${item.especialidades?.map((e) => e.nome).join(" ")}
    `.toLowerCase();
    const palavras = query.toLowerCase().split(" ");
    const normalizedTexto = normalize(texto);
    const normalizedPalavras = palavras.map(normalize);
    const matchCount = normalizedPalavras.filter(palavra => normalizedTexto.includes(palavra)).length;
    const keywordBoost = matchCount / palavras.length;
    const semanticWeight = 0.8;
    const keywordWeight = 0.2;
    score = (item.similarity * semanticWeight) + (keywordBoost * keywordWeight);
    return Math.min(score, 1);
}
