# Frontend — Stokio

Interface web em **Next.js** (App Router), React e TypeScript para gestão de estoque e abrigos.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/)
- Backend da API disponível (ver README do backend)

## Instalação

```bash
cd frontend
npm install
```

### Variáveis de ambiente

Crie um `.env` na raiz do frontend (copie de `.env.example`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_LOGO_URL=/logo.png
NEXT_PUBLIC_APP_NAME=Stokio - Gestão Inteligente de Abrigos
```

Variáveis expostas ao browser usam o prefixo **`NEXT_PUBLIC_`**.

## Como executar

### Desenvolvimento

```bash
npm run dev
```

Servidor em **http://localhost:8081**.

### Produção

```bash
npm run build
npm run start
```

### Docker

A imagem usa o **output standalone** do Next (Node), não Nginx estático.

```bash
docker build -t abrigo-frontend .
docker run -p 8081:8081 abrigo-frontend
```

## Estrutura

```
frontend/
├── app/                    # Rotas e layouts (App Router)
├── client/                 # Componentes, páginas, API client, hooks
│   ├── api/
│   ├── components/
│   ├── pages/
│   └── ...
├── public/                 # Estáticos
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Nova rota

1. Crie o componente de página em `client/pages/` (se reutilizar).
2. Adicione `app/.../page.tsx` que importa esse componente (com `ModuleRoute` / layout privado, conforme o caso).

## Scripts

| Script            | Descrição              |
| ----------------- | ---------------------- |
| `npm run dev`     | Desenvolvimento        |
| `npm run build`   | Build de produção      |
| `npm run start`   | Servidor de produção   |
| `npm run lint`    | ESLint                 |
| `npm run typecheck` | TypeScript (tsc)   |

## Troubleshooting

- **API**: confira `NEXT_PUBLIC_API_BASE_URL` e CORS no backend.
- **Build**: `rm -rf .next node_modules && npm install && npm run build`.
- **Porta**: altere em `package.json` (`dev` / `start`) ou use `PORT` no ambiente.

## Licença

MIT

## Autores

Guilherme Tosi
