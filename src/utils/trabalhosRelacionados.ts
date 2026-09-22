import { PrismaClient } from "@prisma/client";


 const calcularSimilaridadeCoseno = (
    vetorA: number[],
    vetorB: number[]
  ): number => {
    if (
      !vetorA ||
      !vetorB ||
      vetorA.length === 0 ||
      vetorB.length === 0 ||
      vetorA.length !== vetorB.length
    ) {
      return 0;
    }

    let produtoEscalar = 0;

    let normaA = 0;

    let normaB = 0;

    for (
      let i = 0;
      i < vetorA.length;
      i++
    ) {
      const valorA = Number(
        vetorA[i]
      );

      const valorB = Number(
        vetorB[i]
      );

      produtoEscalar +=
        valorA * valorB;

      normaA +=
        valorA * valorA;

      normaB +=
        valorB * valorB;
    }

    if (
      normaA === 0 ||
      normaB === 0
    ) {
      return 0;
    }

    return (
      produtoEscalar /
      (Math.sqrt(normaA) *
        Math.sqrt(normaB))
    );
  };

const prisma = new PrismaClient();


// ============================================================
// BUSCAR TRABALHOS RELACIONADOS
// ============================================================

export async function buscarTrabalhosRelacionados(
  queryEmbedding: number[],
  idsExcluir: number[] = [],
  limite = 5
) {

  if (
    !idsExcluir ||
    idsExcluir.length === 0
  ) {
    return [];
  }

  // Evitar IDs duplicados
  const idsPrincipais = [
    ...new Set(
      idsExcluir.map((id) => Number(id))
    )
  ].filter(
    (id) => Number.isInteger(id)
  );

  if (idsPrincipais.length === 0) {
    return [];
  }

  const trabalhosPrincipais =
    await prisma.trabalho.findMany({
      where: {
        id: {
          in: idsPrincipais
        },

        status: "APROVADO"
      },

      select: {
        id: true,
        departamentoId: true,

        embedding: true,

        especialidades: {
          select: {
            id: true
          }
        }
      }
    });

  // ============================================================
  // 3. VALIDAR EMBEDDINGS DOS TRABALHOS PRINCIPAIS
  // ============================================================

  const principaisComEmbedding =
    trabalhosPrincipais.filter(
      (trabalho) =>
        trabalho.embedding &&
        trabalho.embedding.length > 0
    );

  if (
    principaisComEmbedding.length === 0
  ) {
    return [];
  }

  // ============================================================
  // 4. IDENTIFICAR DEPARTAMENTOS PRINCIPAIS
  // ============================================================

  const departamentosPrincipais =
    new Set(
      principaisComEmbedding
        .map(
          (trabalho) =>
            trabalho.departamentoId
        )
        .filter(
          (id): id is number =>
            id !== null
        )
    );

  // ============================================================
  // 5. IDENTIFICAR ESPECIALIDADES PRINCIPAIS
  // ============================================================

  const especialidadesPrincipais =
    new Set(
      principaisComEmbedding.flatMap(
        (trabalho) =>
          trabalho.especialidades.map(
            (especialidade) =>
              especialidade.id
          )
      )
    );


  const candidatos =
  await prisma.trabalho.findMany({
    where: {
      status: "APROVADO",

      id: {
        notIn: idsPrincipais
      }
    },

    take: 100,

    include: {
      autor: {
        select: {
          id: true,
          nome: true
        }
      },

      departamento: {
        select: {
          id: true,
          nome: true
        }
      },

      especialidades: {
        select: {
          id: true,
          nome: true,
          descricao: true
        }
      },

      tipoTrabalho: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  });

  const recomendacoes =
    candidatos
      .map((candidato) => {
        if (
          !candidato.embedding ||
          candidato.embedding.length === 0
        ) {
          return null;
        }

        const embeddingCandidato =
          candidato.embedding as number[];

        // --------------------------------------------------------
        // CALCULAR SIMILARIDADE COM CADA TRABALHO PRINCIPAL
        // --------------------------------------------------------

        const similaridades =
          principaisComEmbedding
            .map((principal) => {
              const embeddingPrincipal =
                principal.embedding as number[];

              return calcularSimilaridadeCoseno(
                embeddingCandidato,
                embeddingPrincipal
              );
            })
            .filter(
              (score) =>
                Number.isFinite(score)
            )
            .sort(
              (a, b) => b - a
            );

        if (
          similaridades.length === 0
        ) {
          return null;
        }

        // --------------------------------------------------------
        // MAIOR SIMILARIDADE
        //
        // Representa o trabalho principal ao qual o candidato
        // está mais relacionado.
        // --------------------------------------------------------

        const maiorSimilaridade =
          similaridades[0];

        // --------------------------------------------------------
        // MÉDIA DAS 3 MAIORES SIMILARIDADES
        //
        // Isso evita que uma recomendação seja baseada apenas
        // em uma coincidência isolada.
        // --------------------------------------------------------

        const top3 =
          similaridades.slice(0, 3);

        const similaridadeMediaTop3 =
          top3.reduce(
            (soma, score) =>
              soma + score,
            0
          ) / top3.length;

        // --------------------------------------------------------
        // SCORE DE DEPARTAMENTO
        // --------------------------------------------------------

        const departamentoScore =
          candidato.departamentoId !== null &&
          departamentosPrincipais.has(
            candidato.departamentoId
          )
            ? 1
            : 0;

        // --------------------------------------------------------
        // SCORE DE ESPECIALIDADE
        // --------------------------------------------------------

        const especialidadesDoCandidato =
          candidato.especialidades.map(
            (especialidade) =>
              especialidade.id
          );

        const especialidadesEmComum =
          especialidadesDoCandidato.filter(
            (id) =>
              especialidadesPrincipais.has(id)
          ).length;

        const especialidadeScore =
          especialidadesEmComum > 0
            ? 1
            : 0;

        // ========================================================
        // 9. SCORE FINAL DA RECOMENDAÇÃO
        //
        // MAIOR SIMILARIDADE = 75%
        // MÉDIA DAS 3 MAIORES = 20%
        // ESPECIALIDADE = 3%
        // DEPARTAMENTO = 2%
        //
        // Total = 100%
        //
        // A semântica continua sendo o fator dominante.
        // ========================================================

        const recommendationScore =
          maiorSimilaridade * 0.75 +
          similaridadeMediaTop3 * 0.20 +
          especialidadeScore * 0.03 +
          departamentoScore * 0.02;

        return {
          id: candidato.id,

          titulo: candidato.titulo,

          resumo: candidato.resumo,

          fileUrl: candidato.fileUrl,

          status: candidato.status,

          createdAt: candidato.createdAt,

          autor:
            candidato.autor ?? null,

          departamento:
            candidato.departamento ?? null,

          especialidades:
            candidato.especialidades ?? [],

          tipoTrabalho:
            candidato.tipoTrabalho ?? null,

          // ------------------------------------------------------
          // NOVOS DADOS DE RELAÇÃO
          // ------------------------------------------------------

          semanticScore:
            maiorSimilaridade,

          recommendationScore,

          score: recommendationScore
        };
      })

      // ==========================================================
      // 10. REMOVER CANDIDATOS INVÁLIDOS
      // ==========================================================

      .filter(
        (
          item
        ): item is NonNullable<typeof item> =>
          item !== null
      );

  // ============================================================
  // 11. ORDENAR POR RELEVÂNCIA
  // ============================================================

  recomendacoes.sort(
    (a, b) =>
      b.recommendationScore -
      a.recommendationScore
  );
  
  return recomendacoes
    .filter(
      (item) =>
        item.recommendationScore >= 0.40
    )
    .slice(0, limite);
}