// src/scripts/reindex.ts

import { reindexEmbeddings } from "../utils/scripts/reindex";

reindexEmbeddings()
  .then(() => {
    console.log("Fim da reindexação");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

  // para executar: npx ts-node src/scripts/reindex.ts