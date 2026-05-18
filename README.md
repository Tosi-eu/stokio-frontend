# Stokio — interface web

Aplicação web para **gestão de stock, medicamentos e insumos** em abrigos e instituições de cuidados. Um único lugar para ver o que há em armário, quem consome o quê, o que vence e o que precisa de reposição — com relatórios e controlo de acesso por equipa.

## O que o sistema oferece

### Visão geral (dashboard)

- Indicadores resumidos do abrigo
- Itens sem movimentação recente
- Movimentações recentes e artigos mais / menos movimentados
- Distribuição por armário, gaveta e setor (ex.: farmácia e enfermagem)
- Layout dos blocos configurável para quem gere o painel

### Residentes

- Cadastro e manutenção de fichas
- Casela e dados ligados ao stock e aos relatórios
- Base para consumo, medicamentos por residente e prontuário (quando o módulo está ativo)

### Medicamentos e insumos

- Cadastro de medicamentos (nome, princípio ativo, dosagem, stock mínimo, etc.)
- Cadastro de material não medicamentoso com a mesma lógica de stock
- Validade, lote, setor e posição física (armário / gaveta)

### Stock

- Lista unificada de medicamentos e insumos com filtros por residente, armário, gaveta, setor e estado
- Entradas, saídas e transferências entre posições
- Transferência entre abrigos (quando ativado)
- Suspender e retomar fornecimento sem perder histórico
- Ajuste de setor (ex.: farmácia ↔ enfermagem)

### Movimentações

- Histórico de entradas, saídas e transferências
- Filtros por residente, datas, armário, gaveta e setor
- Suporte a relatórios regulatórios (ex.: psicotrópicos)

### Armários e gavetas

- Organização por número ou por categoria
- Stock sempre associado à posição física real

### Relatórios

- Pré-visualização e exportação (PDF e Excel onde disponível)
- Insumos, medicamentos, residentes, psicotrópicos, consumo por residente
- Vencidos e a vencer em breve, transferências e movimentações por período
- Rótulos e formato adaptáveis à configuração do abrigo (casela, armário, etc.)

### Notificações

- Alertas operacionais (reposição, vencimentos, receitas)
- Acompanhamento no painel e no dia a dia da equipa

### Perfil e acesso

- Conta pessoal e alteração de palavra-passe
- Recuperação de acesso por e-mail
- Onboarding para novo abrigo (identidade, módulos, logo)

### Prontuários (módulo opcional)

- Geração e descarregamento por residente
- Histórico de versões quando os dados mudam

### Painel de administração

| Área             | Para quê                                                     |
| ---------------- | ------------------------------------------------------------ |
| **Resumo**       | Métricas, consumo, itens e lotes a vencer                    |
| **Alertas**      | Situações que pedem ação                                     |
| **Relatórios**   | Geração centralizada                                         |
| **Utilizadores** | Contas e permissões por área                                 |
| **Acessos**      | Registo de entradas no sistema                               |
| **Configuração** | Apresentação (casela, armário, gaveta), módulos e automações |
| **Notificações** | Gestão de alertas                                            |
| **Auditoria**    | Quem alterou o quê, com comparação antes/depois              |

> Em instalações com vários abrigos, a gestão de **tenants** fica reservada ao administrador da plataforma.

## Conceitos úteis

- **Abrigo** — organização com dados e stock isolados
- **Setor** — ex. farmácia e enfermagem; painéis e stock por setor
- **Casela** — identificação do residente (número ou nome, conforme configuração)
- **Permissões** — quem vê e quem edita cada módulo e tipo de movimentação

---

## Para desenvolvedores

**Stack:** Next.js (App Router), React, TypeScript, Tailwind.

**Requisitos:** Node.js 18+, npm, API backend acessível.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Comando                              | Uso                 |
| ------------------------------------ | ------------------- |
| `npm run dev`                        | Desenvolvimento     |
| `npm run build` / `npm start`        | Produção            |
| `npm run lint` / `npm run typecheck` | Qualidade de código |

Com **Docker Compose** na raiz do monorepo (`abrigo/`), o frontend sobe junto com a API — ver README do backend.

### Cookies e privacidade (LGPD)

- Banner na primeira visita: **necessários** (sessão HttpOnly), **funcionais** (layout, abrigo ativo) e **analíticos** (relatório de erros).
- Preferências em `stokio_cookie_consent` (1 ano); revogar em **Gerir cookies** (perfil, rodapé de login ou `/privacidade`).
- Sessão web: cookie `authToken` HttpOnly; sem `sessionStorage` para token/utilizador.
- Backend: `ttl.allowCookieAuth` (default `true`); ver painel **Sistema** ou `system-config.defaults`.
