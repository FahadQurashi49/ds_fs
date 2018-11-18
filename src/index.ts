import * as http from 'http';
import * as debug from 'debug';
import * as fs from 'fs';

import config from './config';
import Server from './server';

debug('ts-express:server');

const port = normalizePort(process.env.PORT || 3000);
Server.set('port', port);

const server = http.createServer(Server);
let isMaster = false;
initServer();

function initServer() {
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  if (!fs.existsSync(config.dir)){
    fs.mkdirSync(config.dir);
}
  for (let server of config.servers) {
    
  }
}

function normalizePort(val: number|string): number|string|boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch(error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
  console.log(`Listening on ${bind}`);
}