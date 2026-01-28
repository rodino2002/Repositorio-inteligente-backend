# 📚 Repositório Acadêmico Inteligente - Backend
## Descrição

Backend do projeto “Desenvolvimento de um Repositório Acadêmico Inteligente para Gestão Semântica de Trabalhos de Pesquisa no ISPB”.

## Permite:

- Upload e gerenciamento de trabalhos acadêmicos;

- Busca semântica por similaridade usando embeddings;

- Recomendações inteligentes de trabalhos relacionados;

- Integração com IA para respostas a perguntas acadêmicas.

O sistema é construído com **Node.js, TypeScript, Prisma e PostgreSQL + pgvector**, fornecendo APIs REST para o frontend.

## ⚡ Funcionalidades

- Upload e gerenciamento de trabalhos

- Armazenamento de título, resumo, autor, curso, status e arquivo.

- Geração automática de embeddings para cada trabalho.

- Busca semântica

- Pesquisa por relevância utilizando embeddings (similaridade cosseno).

- Filtragem por threshold para controlar relevância.

- Recomendações inteligentes

- Retorna trabalhos semanticamente similares a um trabalho específico.

- Chat Acadêmico

- Permite perguntas em linguagem natural.

- Retorna trabalhos relevantes + respostas resumidas via IA (OpenAI GPT).

## 🛠 Tecnologias utilizadas

- Node.js + TypeScript

- Express.js

- Prisma ORM

- PostgreSQL com pgvector

- Transformers e OpenasAI (para geração de embeddings e respostas inteligentes) respectivamente

- dotenv para variáveis de ambiente
