import swaggerJsdoc from "swagger-jsdoc";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Repositório TCC",
      version: "1.0.0",
      description: "Documentação da API de usuários e trabalhos",
    },
    servers: [
      { url: "http://localhost:3000/api/v1", description: "Servidor local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/docs/*.swagger.ts"
  ],
};


export const swaggerSpec = swaggerJsdoc(swaggerOptions);
