// ioBroker socket.io client example with optional automated login
const _sio = require('socket.io-client');
const io = (typeof _sio === 'function') ? _sio : _sio.io;
const axios = require('axios').default;

// CONFIG: set via environment variables or edit here
const HOST = process.env.IOBROKER_HOST || '192.168.1.235';
const PORT = process.env.IOBROKER_PORT || '8082';
const USER = process.env.IOBROKER_USER || 'Admin';
const PASS = process.env.IOBROKER_PASS || 'Mamamia2982012!';
const SUB_ID = process.env.IOBROKER_SUB_ID || ''; // optional specific state id to subscribe to
const AUTO_LOGIN = process.env.IOBROKER_AUTO_LOGIN === '1';
const COOKIE = process.env.IOBROKER_COOKIE || '';

const baseUrl = `http://${HOST}:${PORT}`;

async function attemptLogin() {
  if (!AUTO_LOGIN) return '';
  try {
    // try JSON POST
    const jsonUrl = `${baseUrl}/login`;
    let res = await axios.post(jsonUrl, {user: USER, pass: PASS}, {maxRedirects: 0, validateStatus: s => s < 400});
    if (res && res.headers && res.headers['set-cookie']) return res.headers['set-cookie'].join('; ');
  } catch (e) {}
  try {
    // try form POST
    const formUrl = `${baseUrl}/login`;
    const params = new URLSearchParams();
    params.append('user', USER);
    params.append('pass', PASS);
    let res = await axios.post(formUrl, params.toString(), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}, maxRedirects: 0, validateStatus: s => s < 400});
    if (res && res.headers && res.headers['set-cookie']) return res.headers['set-cookie'].join('; ');
  } catch (e) {}
  return '';
}

async function main() {
  let cookie = COOKIE;
  if (AUTO_LOGIN && !cookie) {
    console.log('Attempting automated login...');
    cookie = await attemptLogin();
    if (cookie) console.log('Login cookie obtained');
    else console.log('Automated login did not return a cookie');
  }

  const NO_AUTH = process.env.IOBROKER_NO_AUTH === '1';
  const transports = process.env.IOBROKER_TRANSPORTS ? process.env.IOBROKER_TRANSPORTS.split(',') : ['polling', 'websocket'];
  const options = {
    path: '/socket.io/',
    transports
  };
  if (!NO_AUTH && PASS) options.auth = {user: USER, pass: PASS};
  if (cookie) options.extraHeaders = { Cookie: cookie };

  const socket = io(baseUrl, options);

  socket.on('connect', () => {
    console.log('connected to', baseUrl, 'id=', socket.id);

    socket.emit('getStates', (err, states) => {
      if (err) return console.error('getStates error', err);
      console.log('states count:', Object.keys(states || {}).length);
    });

    socket.emit('getObjects', (err, objects) => {
      if (!err) console.log('objects count:', Object.keys(objects || {}).length);
    });

    if (SUB_ID) {
      socket.emit('subscribe', SUB_ID, (err) => {
        if (err) console.error('subscribe error', err);
        else console.log('subscribed to', SUB_ID);
      });
    }
  });

  socket.on('stateChange', (id, state) => {
    console.log('stateChange', id, state);
  });

  socket.on('disconnect', (reason) => console.log('disconnected', reason));
  socket.on('connect_error', (err) => console.error('connect_error', err));
  if (socket.io) socket.io.on('packet', (p) => console.log('packet', p));
}

main().catch(e => console.error('Fatal', e));
