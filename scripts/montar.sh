#!/bin/sh
# Monta a pasta dist/ que o Vercel publica: os arquivos deste projeto (site/ ou app/) + a pasta compartilhado/.
# O Vercel roda isto sozinho (vercel.json → buildCommand), de dentro de site/ ou de app/.
# Os links nas páginas usam ../compartilhado/…, que funciona no computador (pasta do projeto)
# e no ar (o navegador para na raiz do site, então vira /compartilhado/…).
set -e
rm -rf dist
mkdir dist
for item in *; do
  case "$item" in
    dist|api|package.json|vercel.json) continue ;;
  esac
  cp -R "$item" dist/
done
cp -R ../compartilhado dist/compartilhado
echo "dist/ pronto: $(find dist -type f | wc -l) arquivos"
