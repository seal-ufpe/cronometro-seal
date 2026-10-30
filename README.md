# SEAL Cronômetro

Temporizador HH:MM:SS progressivo ou regressivo, local, responsivo e acessível.

## Fluxo Docker

O fluxo suportado é Docker; não é necessário instalar Node.js no host.

```bash
cp .env.example .env
make dev
# validação CI:
docker compose --profile ci run --build --rm test
docker compose --profile ci run --build --rm lint
docker compose --profile ci run --build --rm build
# produção:
make prod
```

O serviço `dev` é o padrão (sem profile); `test`, `lint`, `build` e `prod` usam profiles.
Todos os comandos executam dentro do Docker. O container de desenvolvimento usa bind mount
do código e volume separado para `node_modules`, com polling para funcionar em qualquer host.
Defina `UID` e `GID` no `.env` para que arquivos gerados pertençam ao seu usuário. O build
exporta `dist` para o diretório do projeto. A aplicação usa `node:22.14.0-alpine` nas etapas
de desenvolvimento e validação, e `nginx:1.27.3-alpine` para produção.

A arquitetura aplica SOLID: portas injetam Clock, Ticker, repositório e estratégia (DIP);
Stopwatch é domínio puro e a UI é adaptador (SRP); estratégias progressiva/regressiva
permitem extensão sem alterar o relógio (OCP). Observadores têm subscribe/unsubscribe.

Recursos: display HH:MM:SS, arredondamento por segundo, +1/+5/+10 em qualquer estado,
entrada manual HH:MM e digitação rápida (125 → 01:25), limite 99:59:59, persistência local,
atalhos Espaço/R/T/1/5/0 (inativos em campos de texto), tema e layout responsivo.

## Testes

Tudo roda em Docker: `make test` executa Vitest com cobertura V8 e thresholds de 90%;
`make lint` valida ESLint, Prettier e TypeScript; `make verify` verifica imports/assets,
lockfile e `vite build`; `make smoke` valida dev, PostCSS e produção; e `make e2e`
executa os cenários Playwright. `make ci` executa essas etapas em sequência.

Para investigar um `@import`, rode `make verify` e consulte `scripts/verify.mjs`: ele
resolve imports CSS respeitando a caixa e pacotes em `node_modules`. Se o lockfile mudar,
o entrypoint do serviço `dev` compara seu SHA-256 e executa `npm ci` automaticamente;
`make reinstall` recria o volume manualmente. Os relatórios ficam em `coverage/`.
