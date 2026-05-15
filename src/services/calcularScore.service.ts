function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function calcularScore(query: string, item: any) {
  let score = item.similarity;

  const texto = `
      ${item.titulo}
      ${item.resumo}
      ${item.departamento?.nome || ""}
      ${item.especialidades?.map((e: any) => e.nome).join(" ")}
    `.toLowerCase();

  const palavras = query.toLowerCase().split(" ");
  
  const normalizedTexto = normalize(texto);

  const normalizedPalavras = palavras.map(normalize);

  const matchCount = normalizedPalavras.filter(palavra =>
    normalizedTexto.includes(palavra)
  ).length;

  const keywordBoost = matchCount / palavras.length;

  const semanticWeight = 0.8;
  const keywordWeight = 0.2;

  score = (item.similarity * semanticWeight) + (keywordBoost * keywordWeight);
  return Math.min(score, 1);
}