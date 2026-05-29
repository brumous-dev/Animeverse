import http from 'http';
import server from './dist/server/server.js';

const PORT = 3000;

http.createServer(async (req, res) => {
  // Convert Node's incoming message to a Web Standard Request object
  const url = `http://${req.headers.host}${req.url}`;
  const webReq = new Request(url, {
    method: req.method,
    headers: req.headers,
  });

  try {
    // Call your server's fetch method
    const webRes = await server.fetch(webReq, {}, {});
    
    // Send the response back to Node's server
    res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));
    res.end(await webRes.text());
  } catch (err) {
    res.writeHead(500);
    res.end("Fatal Server Error");
  }
}).listen(PORT, () => console.log(`Server swallowing errors happily at http://localhost:${PORT}`));
