#!/usr/bin/env bash
# Mockup test runner: headless Chrome runs every test page in tools/tests/
# and takes Self-check screenshots. Output goes to tools/out/.
# It never deletes anything: the Chrome profile folder tools/out/chrome-profile
# is reused (sessionStorage does not survive between runs, so tests start clean).
#
# Usage:  bash tools/run-tests.sh
# Exit code: 0 = all PASS, 1 = at least one FAIL or a suite did not finish.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/tools/out"
PROFILE="$OUT/chrome-profile"
mkdir -p "$OUT" "$PROFILE"

CHROME=""
for c in "/c/Program Files/Google/Chrome/Application/chrome.exe" \
         "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
done
if [ -z "$CHROME" ]; then echo "No Chrome/Edge found"; exit 1; fi

# file:// URL for the project (Windows-friendly when cygpath exists)
if command -v cygpath >/dev/null 2>&1; then BASE="file:///$(cygpath -m "$ROOT" | sed 's/ /%20/g')"; else BASE="file://$(echo "$ROOT" | sed 's/ /%20/g')"; fi
PROF_ARG="$PROFILE"; command -v cygpath >/dev/null 2>&1 && PROF_ARG="$(cygpath -w "$PROFILE")"

run_chrome() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --user-data-dir="$PROF_ARG" --no-first-run --no-default-browser-check "$@" 2>/dev/null; }

TOTAL_PASS=0; TOTAL_FAIL=0; STATUS=0
echo "Mockup tests  $(date '+%Y-%m-%d %H:%M')"
for suite in shell profile features; do
  RES="$OUT/$suite.txt"
  run_chrome --window-size=1400,1000 --virtual-time-budget=30000 --dump-dom "$BASE/tools/tests/$suite.html" \
    | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&gt;/>/g; s/&lt;/</g; s/&amp;/\&/g' > "$RES"
  P=$(grep -c '^PASS' "$RES"); F=$(grep -c '^FAIL' "$RES")
  if [ "$P" -eq 0 ] && [ "$F" -eq 0 ]; then echo "  $suite: DID NOT FINISH (see $RES)"; STATUS=1; continue; fi
  echo "  $suite: $P PASS, $F FAIL"
  grep '^FAIL' "$RES" | sed 's/^/    /'
  TOTAL_PASS=$((TOTAL_PASS + P)); TOTAL_FAIL=$((TOTAL_FAIL + F))
  [ "$F" -gt 0 ] && STATUS=1
done
echo "TOTAL: $TOTAL_PASS PASS, $TOTAL_FAIL FAIL"

# Self-check screenshots (1280px desktop, 900px tablet)
shot() { run_chrome --window-size="$2" --virtual-time-budget=5000 --screenshot="$(command -v cygpath >/dev/null 2>&1 && cygpath -w "$OUT/$1.png" || echo "$OUT/$1.png")" "$3" >/dev/null; }
shot list-1280      1280,800 "$BASE/features/leads/index.html"
shot list-900       900,800  "$BASE/features/leads/index.html"
shot settings-1280  1280,800 "$BASE/features/settings/index.html"
shot drawer-lead-1280    1280,800 "$BASE/tools/tests/shot.html#p1,1280,timeline"
shot drawer-client-900   900,800  "$BASE/tools/tests/shot.html#p7,900,membership"
echo "Screenshots: tools/out/*.png"
exit $STATUS
