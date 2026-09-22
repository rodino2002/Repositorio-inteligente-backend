"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizar = void 0;
// 🔹 Normalização básica
const normalizar = (t) => t
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
exports.normalizar = normalizar;
