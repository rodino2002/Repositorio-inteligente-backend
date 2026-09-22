"use strict";
// src/scripts/reindex.ts
Object.defineProperty(exports, "__esModule", { value: true });
const reindex_1 = require("../utils/scripts/reindex");
(0, reindex_1.reindexEmbeddings)()
    .then(() => {
    console.log("Fim da reindexação");
    process.exit(0);
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
// para executar: npx ts-node src/scripts/reindex.ts
