#!/bin/sh
# Container entrypoint: migrate, seed (idempotent, never overwrites owner edits),
# create the first owner if asked to, then serve.
set -e
pnpm -s exec tsx --conditions=react-server --env-file-if-exists=.env scripts/check-env.ts
pnpm -s db:migrate
pnpm -s db:seed
pnpm -s exec tsx --conditions=react-server --env-file-if-exists=.env scripts/bootstrap-owner.ts
exec pnpm -s start -p "${PORT:-3000}"
