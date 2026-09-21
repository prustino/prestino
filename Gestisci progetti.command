#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if command -v node >/dev/null 2>&1; then
  node scripts/progetti.mjs menu
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/progetti.mjs menu
else
  print 'Serve Node.js per aggiornare il sito. Installa Node.js e riapri questo file.'
  read '?Premi Invio per chiudere.'
  exit 1
fi
