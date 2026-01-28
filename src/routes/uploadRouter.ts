import { Router, Request, Response } from "express";
import { upload } from "../config/multerConfig";
import { authMiddleware } from "../middleware/authMiddleware";
import { validatePDF } from "../middleware/validatePDF";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  validatePDF,
  (req: Request, res: Response) => {

    // req.file bem tipado:
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    return res.status(201).json({
      sucesso: true,
      fileUrl,
    });
  }
);

export default router;
