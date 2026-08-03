import http.server
import socketserver
import mimetypes

# Explicitly ensure correct MIME types for web modules
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('text/css', '.css')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.json'):
            return 'application/json'
        if path.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

PORT = 8000
handler = CustomHandler
handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
})

print(f"Starting custom dev server at http://localhost:{PORT} with correct JS module MIME types...")
with socketserver.TCPServer(("", PORT), handler) as httpd:
    httpd.serve_forever()
