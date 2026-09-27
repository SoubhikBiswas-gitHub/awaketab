#!/usr/bin/env bash
# Render boards with the canvas's REAL runtime (dc-runtime.js served as support.js) and flag empty boards / overflow.
# Usage: design/canvas/tools/final/rtscan.sh [File.dc.html ...]   (no args = every board in canvas.json)
set -e
RT_DIR=${RT_DIR:-/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/rtsrv}
mkdir -p "$RT_DIR"
command cp -f "$(dirname "$0")/../../project/"*.dc.html "$RT_DIR/"
[ -f "$RT_DIR/support.js" ] || { echo "Put the canvas runtime at $RT_DIR/support.js (Artifact read path artifact-type/dc-runtime.js)"; exit 1; }
command cp -f "$(dirname "$0")/rtscan.mjs" "$RT_DIR/scan.mjs"
cd "$RT_DIR" && RT_DIR="$RT_DIR" node scan.mjs "$@"
