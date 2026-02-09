// src/routes/usuarioRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { allowRoles } from "../middleware/roleMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { Role } from "@prisma/client";
import { validarBI } from "../services/biValidation.service";

const prisma = new PrismaClient();
const router = Router();


// ============================
// CREATE - Criar novo usuário (Admin pode definir role)
// ============================
router.post(
  "/",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const {
        nome,
        email,
        senha,
        role,
        departamentoId,
        especialidadesIds,
        bi_number
      } = req.body as {
        nome: string;
        email: string;
        senha: string;
        role?: Role;
        departamentoId?: number;
        especialidadesIds?: number[];
        bi_number: string
      };

      // -----------------------------
      // 1. Validação básica
      // -----------------------------

      if (!nome || !email || !senha || !bi_number) {
        return res.status(400).json({
          sucesso: false,
          erro: "Nome, email, BI e senha são obrigatórios."
        });
      }

      // -----------------------------
      // 1.1 Validação do BI
      // -----------------------------

      const resultadoBI = await validarBI(bi_number);

      if (!resultadoBI.valido) {
        return res.status(400).json({
          erro: "BI inválido ou não encontrado",
        });
      }

      // opcional: cruzar nomes
      if (resultadoBI.nome && resultadoBI.nome !== nome) {
        return res.status(400).json({
          erro: "Nome não corresponde ao BI informado",
        });
      }

      // -----------------------------
      // 2. Validar Role (opcional no request)
      // -----------------------------
      const roleFinal = role ?? Role.ESTUDANTE;

      if (!Object.values(Role).includes(roleFinal)) {
        return res.status(400).json({ sucesso: false, erro: "Role inválida." });
      }

      // -----------------------------
      // 3. Validar Departamento se enviado
      // -----------------------------
      if (departamentoId !== undefined && departamentoId !== null) {
        const deptExiste = await prisma.departamento.findUnique({
          where: { id: Number(departamentoId) },
        });

        if (!deptExiste) {
          return res.status(400).json({
            sucesso: false,
            erro: "Departamento não encontrado.",
          });
        }
      }

      // -----------------------------
      // 4. Validar Especialidades se enviadas
      // -----------------------------
      if (especialidadesIds?.length) {
        const existentes = await prisma.especialidade.findMany({
          where: { id: { in: especialidadesIds } },
        });

        if (existentes.length !== especialidadesIds.length) {
          return res.status(400).json({
            sucesso: false,
            erro: "Algumas especialidades não existem.",
          });
        }
      }

      // -----------------------------
      // 5. Criar usuário no Prisma
      // -----------------------------
      const senhaHashed = await bcrypt.hash(senha, 10);

      const biNormalizado = bi_number.trim().toUpperCase(); // formatar o número de BI


      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          bi_number: biNormalizado,
          senha: senhaHashed,
          role: roleFinal ?? undefined,
          departamentoId: departamentoId ?? null,
          especialidades: {
            connect: especialidadesIds?.map((id) => ({ id })) ?? [],
          },
        },
        include: {
          especialidades: true, // inclui as especialidades no retorno
          departamento: true,   // opcional: inclui dados do departamento
        },
      });

      // remove senha antes de enviar
      const { senha: _, ...usuarioSemSenha } = novoUsuario;

      return res.status(201).json({
        sucesso: true,
        dados: usuarioSemSenha,
      });


    } catch (e: any) {
      console.error(e);
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao criar usuário.",
        detalhes: e.message,
      });
      
    }
  }
);

// ============================
// READ - Listar todos os usuários
// ============================
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" }, // aqui deve bater com o schema
    });


    res.json({ sucesso: true, total: usuarios.length, dados: usuarios });

  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Não foi possível listar os usuários.",
      detalhes: e.message,
    });
  }
});

// ============================
// READ - Buscar usuário por ID
// ============================
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
    });

    if (!usuario)
      return res.status(404).json({ sucesso: false, erro: "Usuário não encontrado." });

    res.json({ sucesso: true, dados: usuario });
  } catch (e: any) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar usuário.",
      detalhes: e.message,
    });
  }
});

// ============================
// UPDATE - Atualizar usuário (Admin pode atualizar role e senha)
// ============================
router.put(
  "/:id",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, email, senha, role } = req.body as Partial<{
      nome: string;
      email: string;
      senha: string;
      role: Role;
    }>;

    try {
      const data: any = { nome, email };
      if (senha) data.senha = await bcrypt.hash(senha, 10);
      if (role && Object.values(Role).includes(role)) data.role = role;

      const usuarioAtualizado = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data,
      });

      res.json({ sucesso: true, dados: usuarioAtualizado });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível atualizar o usuário.",
        detalhes: e.message,
      });
    }
  }
);

// ============================
// DELETE - Remover usuário (Somente Admin)
// ============================
router.delete(
  "/:id",
  authMiddleware,
  allowRoles(Role.ADMIN),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.usuario.delete({ where: { id: parseInt(id) } });
      res.json({ sucesso: true, mensagem: "Usuário deletado com sucesso." });
    } catch (e: any) {
      res.status(400).json({
        sucesso: false,
        erro: "Não foi possível deletar o usuário.",
        detalhes: e.message,
      });
    }
  }
);

export default router;
