# MANUAL DO DESENVOLVEDOR (MANUAL_DEV.md) - TRANSPETRO STUDY 2026.3

Este documento fornece as diretrizes técnicas para configuração, manutenção e evolução da plataforma TRANSPETRO STUDY.

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Estilização:** Tailwind CSS v3/v4, Lucide React (Ícones)
- **Notificações:** Sonner (Toast system)
- **ORM & Banco de Dados:** Prisma ORM com PostgreSQL (ou SQLite com fallback)
- **Containerização:** Docker Compose com volume mapeado `postgres-data`
- **IA Provider:** Google Gemini API (`@google/genai`)

## 🚀 Como Rodar o Projeto

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configuração de Variáveis de Ambiente:**
   Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Banco de Dados (Docker):**
   ```bash
   docker-compose up -d
   ```

4. **Prisma Migrations & Seed do Edital:**
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

5. **Iniciar Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

## 📁 Estrutura Modular de Pastas

- `/src/app`: Rotas e páginas do Next.js App Router
- `/src/components`: Componentes visuais reutilizáveis (mobile-first)
- `/src/lib`: Clientes de banco (Prisma), utilitários e clientes de IA
- `/src/services`: Regras de negócio, algoritmo de repetição espaçada e geradores
- `/src/types`: Definições TypeScript
- `/prisma`: Esquema de dados (`schema.prisma`) e script de seed com o edital oficial
