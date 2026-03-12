const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'rdc-provinces.geojson');
const HZ_FILE = path.join(__dirname, 'data', 'health-zones.geojson');
const OUVRAGES_FILE = path.join(__dirname, 'data', 'ouvrages.json');
function send(res, statusCode, contentType, body) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      send(res, 500, 'text/plain; charset=utf-8', 'Erreur interne du serveur.');
      return;
    }
    send(res, 200, contentType, content);
  });
}

function readGeoJson(file, callback) {
  fs.readFile(file, 'utf8', (err, content) => {
    if (err) return callback(err);

    try {
      const json = JSON.parse(content);
      callback(null, json);
    } catch (parseErr) {
      callback(parseErr);
    }
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/provinces') {
    readGeoJson(DATA_FILE, (err, data) => {
      if (err) {
        send(res, 500, 'application/json; charset=utf-8', JSON.stringify({
          error: 'Impossible de lire le GeoJSON.'
        }));
        return;
      }

      send(res, 200, 'application/json; charset=utf-8', JSON.stringify(data));
    });
    return;
  }

    if (url === '/api/ouvrages') {
    readGeoJson(OUVRAGES_FILE, (err, data) => {
      if (err) {
        send(res, 500, 'application/json; charset=utf-8', JSON.stringify({
          error: 'Impossible de lire le GeoJSON.'
        }));
        return;
      }

      send(res, 200, 'application/json; charset=utf-8', JSON.stringify(data));
    });
    return;
  }

    if (url === '/api/health_zones') {
    readGeoJson(HZ_FILE, (err, data) => {
      if (err) {
        send(res, 500, 'application/json; charset=utf-8', JSON.stringify({
          error: 'Impossible de lire le GeoJSON.'
        }));
        return;
      }

      send(res, 200, 'application/json; charset=utf-8', JSON.stringify(data));
    });
    return;
  }

  if (url === '/api/health') {
    send(res, 200, 'application/json; charset=utf-8', JSON.stringify({
      status: 'ok',
      service: 'rdc-geojson-api'
    }));
    return;
  }

  if (url === '/' || url === '/index.html') {
    sendFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  if (url === '/styles.css') {
    sendFile(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css; charset=utf-8');
    return;
  }

  send(res, 404, 'text/plain; charset=utf-8', '404 - Ressource non trouvée');
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Carte      : http://localhost:${PORT}`);
  console.log(`API        : http://localhost:${PORT}/api/provinces`);
  console.log(`API health_zones        : http://localhost:${PORT}/api/health_zones`);
  console.log(`Health     : http://localhost:${PORT}/api/health`);
});
