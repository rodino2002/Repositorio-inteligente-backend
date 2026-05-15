-- AlterTable
ALTER TABLE "Trabalho" ADD COLUMN     "tipoTrabalhoId" INTEGER;

-- CreateTable
CREATE TABLE "TipoTrabalho" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTrabalho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoTrabalho_nome_key" ON "TipoTrabalho"("nome");

-- CreateIndex
CREATE INDEX "Trabalho_tipoTrabalhoId_idx" ON "Trabalho"("tipoTrabalhoId");

-- AddForeignKey
ALTER TABLE "Trabalho" ADD CONSTRAINT "Trabalho_tipoTrabalhoId_fkey" FOREIGN KEY ("tipoTrabalhoId") REFERENCES "TipoTrabalho"("id") ON DELETE SET NULL ON UPDATE CASCADE;
