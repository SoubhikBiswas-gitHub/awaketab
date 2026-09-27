#!/usr/bin/env bash
# Render boards with the canvas's REAL runtime (dc-runtime.js served as support.js) and flag empty boards, overflow,
# dropped styles (a style that starts with a {{hole}}) and controls within 12 px of the board edge.
# Usage: design/canvas/tools/final/rtscan.sh [File.dc.html ...]   (no args = every board in canvas.json)
set -e
RT_DIR=${RT_DIR:-${TMPDIR:-/tmp}/awaketab-rt}
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
mkdir -p "$RT_DIR/node_modules"
PW="$(ls -d "$REPO"/node_modules/.pnpm/playwright@*/node_modules | head -1)"
ln -sfn "$PW/playwright" "$RT_DIR/node_modules/playwright"; ln -sfn "$PW/playwright-core" "$RT_DIR/node_modules/playwright-core"
command cp -f "$(dirname "$0")/../../project/"*.dc.html "$(dirname "$0")/../../project/canvas.json" "$RT_DIR/"
# Tag every style that starts with a {{hole}} so the scan can see whether the runtime dropped it.
perl -pi -e 's/style="(\{\{[^}]*\}\}[^"]+)"/style="$1" data-sq="1"/g' "$RT_DIR/"*.dc.html
[ -f "$RT_DIR/support.js" ] || { echo "Put the canvas runtime at $RT_DIR/support.js (Artifact read path artifact-type/dc-runtime.js)"; exit 1; }
command cp -f "$(dirname "$0")/rtscan.mjs" "$RT_DIR/scan.mjs"
cd "$RT_DIR" && RT_DIR="$RT_DIR" node scan.mjs "$@"
