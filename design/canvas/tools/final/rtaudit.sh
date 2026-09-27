#!/usr/bin/env bash
# DESIGN.md §11 system audit with the canvas's REAL runtime: dump computed styles (rtdump.mjs), then check them (analyze.mjs).
# Usage: design/canvas/tools/final/rtaudit.sh [File.dc.html ...]   (no args = every board in canvas.json)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
RT_DIR=${RT_DIR:-${TMPDIR:-/tmp}/awaketab-rt}
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
mkdir -p "$RT_DIR/node_modules"
PW="$(ls -d "$REPO"/node_modules/.pnpm/playwright@*/node_modules | head -1)"
ln -sfn "$PW/playwright" "$RT_DIR/node_modules/playwright"; ln -sfn "$PW/playwright-core" "$RT_DIR/node_modules/playwright-core"
OUT=${OUT:-$RT_DIR/audit}
[ -f "$RT_DIR/support.js" ] || { echo "Put the canvas runtime at $RT_DIR/support.js (Artifact read, path artifact-type/dc-runtime.js)"; exit 1; }
command cp -f "$HERE/../../project/"*.dc.html "$HERE/../../project/canvas.json" "$RT_DIR/"
command cp -f "$HERE/rtdump.mjs" "$RT_DIR/rtdump.mjs"
cd "$RT_DIR" && RT_DIR="$RT_DIR" OUT="$OUT/" node rtdump.mjs "$@"
A="$OUT/" OUTP="$RT_DIR/" node "$HERE/analyze.mjs"
