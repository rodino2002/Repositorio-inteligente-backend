
export function escapeSqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}