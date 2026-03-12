# FDD Engineering Workspace

Esqueleto inicial de um webapp interno para engenharia de solucoes SAP, com frontend em Next.js e backend em FastAPI.

O foco desta base e organizacao, separacao de responsabilidades e preparo para crescimento incremental sem overengineering.

## Stack

- Frontend: Next.js 15 + TypeScript + Tailwind CSS 4
- Backend: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL
- Banco: PostgreSQL
- Empacotamento: npm no frontend e uv no backend

## Estrutura sugerida

```text
.
|-- README.md
|-- frontend
|   |-- package.json
|   |-- tsconfig.json
|   |-- next.config.ts
|   |-- postcss.config.mjs
|   |-- eslint.config.mjs
|   |-- src
|   |   |-- app
|   |   |   |-- (dashboard)
|   |   |   |   `-- page.tsx
|   |   |   |-- globals.css
|   |   |   `-- layout.tsx
|   |   |-- components
|   |   |   |-- layout
|   |   |   |   `-- app-shell.tsx
|   |   |   `-- ui
|   |   |       `-- page-header.tsx
|   |   |-- lib
|   |   |   `-- env.ts
|   |   `-- modules
|   |       |-- exports
|   |       |-- fdds
|   |       |-- projects
|   |       |-- requirements
|   |       `-- solutions
|   `-- public
`-- backend
    |-- pyproject.toml
    |-- alembic.ini
    |-- alembic
    |   |-- env.py
    |   |-- script.py.mako
    |   `-- versions
    |-- app
    |   |-- main.py
    |   |-- api
    |   |   |-- router.py
    |   |   `-- routes
    |   |       `-- health.py
    |   |-- common
    |   |   |-- errors
    |   |   |   `-- http.py
    |   |   `-- schemas
    |   |       `-- health.py
    |   |-- core
    |   |   |-- config.py
    |   |   `-- logging.py
    |   |-- db
    |   |   |-- base.py
    |   |   |-- base_class.py
    |   |   `-- session.py
    |   `-- domains
    |       |-- exports
    |       |   |-- router.py
    |       |   |-- schemas.py
    |       |   `-- service.py
    |       |-- fdds
    |       |   |-- router.py
    |       |   |-- schemas.py
    |       |   `-- service.py
    |       |-- projects
    |       |   |-- models.py
    |       |   |-- repository.py
    |       |   |-- router.py
    |       |   |-- schemas.py
    |       |   `-- service.py
    |       |-- requirements
    |       |   |-- models.py
    |       |   |-- repository.py
    |       |   |-- router.py
    |       |   |-- schemas.py
    |       |   `-- service.py
    |       `-- solutions
    |           |-- models.py
    |           |-- repository.py
    |           |-- router.py
    |           |-- schemas.py
    |           `-- service.py
    `-- tests
        |-- integration
        `-- unit
```

## Responsabilidades por pasta

### Frontend

- `frontend/src/app`: rotas, layouts e composicao por pagina via App Router.
- `frontend/src/components/layout`: casca da aplicacao, navegacao, wrappers e estrutura visual compartilhada.
- `frontend/src/components/ui`: componentes reutilizaveis e agnosticos de dominio.
- `frontend/src/lib`: utilitarios transversais, configuracao de ambiente e clientes de API.
- `frontend/src/modules/*`: fatias por dominio do produto. Cada modulo deve concentrar telas, hooks, tipos e componentes daquele contexto.
- `frontend/public`: arquivos estaticos.

### Backend

- `backend/app/main.py`: bootstrap da API, middlewares e registro do roteador raiz.
- `backend/app/api`: camada HTTP transversal, roteador principal e rotas nao ligadas a um dominio especifico.
- `backend/app/common`: contratos compartilhados, tratamento de erro e utilitarios genericos.
- `backend/app/core`: configuracoes, logging, seguranca e integracoes transversais.
- `backend/app/db`: sessao, base ORM e wiring do SQLAlchemy/Alembic.
- `backend/app/domains/*`: modulos de dominio. Cada modulo encapsula contrato HTTP, regras, acesso a dados e modelos.
- `backend/alembic`: migracoes e configuracao do Alembic.
- `backend/tests/unit`: testes de regra e servico.
- `backend/tests/integration`: testes de API, banco e fluxo entre camadas.

## Convencoes de naming

- Pastas e arquivos: `kebab-case` no frontend quando representar rota ou arquivo visual; `snake_case` no backend em Python.
- Componentes React: `PascalCase`.
- Hooks React futuros: `useXxx`.
- Schemas Pydantic, DTOs e models ORM: `PascalCase`.
- Funcoes e variaveis Python/TypeScript: `snake_case` no Python e `camelCase` no TypeScript.
- Modulos de dominio: nome no plural e orientado ao negocio, como `projects`, `requirements`, `solutions`, `fdds`, `exports`.
- Endpoints: prefixos no plural, sem verbos na URL, por exemplo `/api/v1/projects`.
- Services backend: regras de negocio e orquestracao.
- Repositories backend: acesso a persistencia, sem regra de negocio.

## Ordem recomendada de implementacao

1. Base de ambiente: `.env`, conexao PostgreSQL, configuracao do frontend e backend.
2. Banco e modelos centrais: `projects`, `requirements`, `solutions`, `fdds`.
3. Migracao inicial Alembic com relacionamentos principais.
4. CRUD de projetos e requisitos.
5. Agrupamento de requisitos em solucoes.
6. Estruturacao de FDD por secoes e persistencia.
7. Exportacao Word baseada em template.
8. Autenticacao interna, autorizacao por papel e observabilidade.
9. Testes de integracao e endurecimento operacional.

## Setup rapido

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend padrao: `http://localhost:3000`

### Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

Backend padrao: `http://localhost:8000`

## Proximos passos imediatos

- adicionar `.env.example` para frontend e backend
- implementar entidade `Project` fim a fim como modulo de referencia
- criar primeira migracao Alembic
- conectar frontend ao endpoint de health e ao primeiro modulo de dominio
