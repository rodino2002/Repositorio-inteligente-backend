import axios from "axios";


export const api_BI_Edgar = axios.create({
    baseURL:process.env.BI_PRIVATE,
    headers: {
        'Content-Type': 'application/json'
    }}
)

export const api_BI_GOV_INSS = axios.create({
  baseURL:process.env.BI_GOV_INSS,
  headers: {
    "Content-Type": "application/json",
  },
});