// Script to test manual body reading logic
const http = require('http');

const server = http.createServer(async (req, res) => {
  try {
    let bodyData = '';
    for await (const chunk of req) {
      bodyData += chunk;
    }
    
    let parsed = {};
    if (bodyData) {
      parsed = JSON.parse(bodyData);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, parsedKeys: Object.keys(parsed) }));
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(3001, () => {
  console.log("Listening on 3001");
});
