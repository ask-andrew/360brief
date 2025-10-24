#!/usr/bin/env python3
import http.server
import socketserver
import json

class SimpleHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "healthy", "service": "radar"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/generate-radar':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = [
                {
                    "id": "test-1",
                    "summary": "Test issue",
                    "impactArea": "Project Delivery",
                    "urgencyScore": "High",
                    "severityScore": "Critical",
                    "suggestedAction": "Test action",
                    "relatedEmails": ["test@example.com"]
                }
            ]
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

PORT = 8004
with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
    print(f"🚀 Simple radar service running on http://localhost:{PORT}")
    httpd.serve_forever()
