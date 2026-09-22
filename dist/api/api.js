"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api_BI_GOV_INSS = exports.api_BI_Edgar = void 0;
const axios_1 = __importDefault(require("axios"));
exports.api_BI_Edgar = axios_1.default.create({
    baseURL: process.env.BI_PRIVATE,
    headers: {
        'Content-Type': 'application/json'
    }
});
exports.api_BI_GOV_INSS = axios_1.default.create({
    baseURL: process.env.BI_GOV_INSS,
    headers: {
        "Content-Type": "application/json",
    },
});
