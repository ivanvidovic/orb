#!/bin/bash
# Start the ORB project beside this file. No publishing or installation.
cd -- "$(dirname -- "$0")" || exit 1
pause_on_error() {
  printf '\nPress Return to close this window. '
  read -r ignored
}
if [[ ! -f index.html || ! -d assets || ! -f orb_local_preview.py ]]; then
  printf 'Place Start-Local-Preview.command and orb_local_preview.py beside index.html and the assets folder.\n'
  pause_on_error
  exit 1
fi
python_bin=""
for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' >/dev/null 2>&1; then
    python_bin="$candidate"
    break
  fi
done
if [[ -z "$python_bin" ]]; then
  printf 'ORB Local Preview requires Python 3.8 or newer.\nInstall Python 3 for macOS, then double-click this launcher again.\n'
  pause_on_error
  exit 1
fi
"$python_bin" ./orb_local_preview.py
preview_status=$?
if [[ $preview_status -ne 0 && $preview_status -ne 130 ]]; then
  pause_on_error
fi
exit "$preview_status"
