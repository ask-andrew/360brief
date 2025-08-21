// Simple HTML test page to verify server is running
const http = require('http');
const port = 3001;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f0f9ff;
            color: #0369a1;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 { margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Test Server</h1>
          <p>If you can see this, the server is running!</p>
          <p>Time: ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `);
});

server.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}/`);
});
