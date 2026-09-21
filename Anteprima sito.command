#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if command -v node >/dev/null 2>&1; then
  node scripts/serve-site.mjs
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/serve-site.mjs
else
  print 'Serve Node.js per avviare l’anteprima.'
fi
read '?Premi Invio per chiudere.'
