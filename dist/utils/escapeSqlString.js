"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSqlString = escapeSqlString;
function escapeSqlString(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
