#!/usr/bin/env bash
# Cloud setup for the canvas renderers: Playwright on the preinstalled Chromium, and the mock fonts installed
# locally (headless Chromium cannot fetch Google Fonts through the proxy). Usage: source design/canvas/tools/final/setup.sh
P=/tmp/claude-0/pwb
mkdir -p $P/chromium_headless_shell-1243/chrome-headless-shell-linux64 $P/chromium-1243/chrome-linux64
ln -sf /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell $P/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
ln -sf /opt/pw-browsers/chromium-1194/chrome-linux/chrome $P/chromium-1243/chrome-linux64/chrome
touch $P/chromium_headless_shell-1243/INSTALLATION_COMPLETE $P/chromium-1243/INSTALLATION_COMPLETE
export PLAYWRIGHT_BROWSERS_PATH=$P
if ! fc-list | grep -q Geist; then
  mkdir -p ~/.local/share/fonts; ( cd ~/.local/share/fonts
  for q in "Geist:wght@200;300;400;500;600" "Geist+Mono:wght@400;500" "Space+Grotesk:wght@600"; do
    curl -sS -A "Mozilla/5.0 Chrome/141" "https://fonts.googleapis.com/css2?family=$q" | grep -o "https://[^)]*\.ttf"
  done | sort -u | while read -r u; do curl -sS -O "$u"; done ); fc-cache -f >/dev/null
fi
# Note: the wrapper generators (gen.mjs, ProSmoke.mjs, content-agent smoke, ExtEdgeWrap.mjs, ext-tools/bigscreens/pages-agent
# wrappers.mjs, growth/b*.mjs) are history. Smoke tests only rewrite wrappers with WRITE_WRAPPERS=1; never rerun a generator,
# or it recreates the boards D-R18 removed (tools/final/dedupe-applied.json).
