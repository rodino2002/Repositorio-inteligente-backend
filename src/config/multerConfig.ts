import multer, { StorageEngine } from "multer";
import path from "path";

// Tipagem explícita do storage
const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },

  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

// Tipar multer
export const upload = multer({
  storage,
});
