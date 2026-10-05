"""Local-only ORB preview. Standard-library Python; no repository edits."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
HOST = '127.0.0.1'
PORT = 5500

class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.mjs': 'text/javascript',
                      '.glb': 'model/gltf-binary', '.wasm': 'application/wasm'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def do_GET(self):
        # Serve a preview-only substitute for the current ORB cache module.
        # Source files and saved-design storage are never changed.
        if urlsplit(self.path).path == '/assets/js/garment-asset-cache.js':
            body = ("export async function fetchGarmentAsset(url){"
                    "return fetch(url,{cache:'no-store'});}\n").encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description='Preview the adjacent ORB project locally.')
    parser.add_argument('--no-browser', action='store_true', help='Start without opening a browser.')
    args = parser.parse_args()
    if not (ROOT / 'index.html').is_file() or not (ROOT / 'assets').is_dir():
        print('Put BOTH launcher files beside index.html and the assets folder.')
        return 1
    try:
        server = ThreadingHTTPServer((HOST, PORT), partial(PreviewHandler, directory=str(ROOT)))
    except OSError as exc:
        print(f'Cannot start on port {PORT}: {exc}')
        print('If a preview is already running, use its browser tab or close its terminal first.')
        return 1
    url = f'http://{HOST}:{PORT}/index.html'
    print(f'\nORB LOCAL PREVIEW\nFolder: {ROOT}\nAddress: {url}\n', flush=True)
    print('Keep this window open. Close it or press Ctrl+C to stop.\n'
          'After copying updates, refresh the browser. Nothing is published.\n', flush=True)
    if not args.no_browser:
        timer = threading.Timer(0.5, lambda: webbrowser.open(url))
        timer.daemon = True
        timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nPreview stopped.')
    finally:
        server.server_close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
