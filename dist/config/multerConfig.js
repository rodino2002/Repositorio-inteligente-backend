"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Tipagem explícita do storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, "../../uploads"));
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${timestamp}-${file.originalname}`);
    },
});
// Tipar multer
exports.upload = (0, multer_1.default)({
    storage,
});
