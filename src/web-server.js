#!/usr/bin/env node
/**
 * Web server + WebSocket bridge for the terminal portfolio.
 * Serves xterm.js frontend and streams the TUI over WebSocket.
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { TUIRenderer, c } = require('./renderer');

const WEB_PORT = parseInt(process.env.WEB_PORT || '3000', 10);

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Web client connected');
  const renderer = new TUIRenderer();

  let cols = 120;
  let rows = 40;

  function redraw() {
    if (ws.readyState === ws.OPEN) {
      ws.send(renderer.render(cols, rows));
    }
  }

  redraw();

  // Twinkling stars - re-render every 1.5s
  const twinkleInterval = setInterval(() => redraw(), 1500);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'resize') {
        cols = data.cols || 120;
        rows = data.rows || 40;
        redraw();
        return;
      }

      if (data.type === 'key') {
        let key = null;
        const k = data.key;

        if (k === 'ArrowLeft') key = 'left';
        else if (k === 'ArrowRight') key = 'right';
        else if (k === 'ArrowUp') key = 'up';
        else if (k === 'ArrowDown') key = 'down';
        else if (k === 'h') key = 'left';
        else if (k === 'l') key = 'right';
        else if (k === 'k') key = 'up';
        else if (k === 'j') key = 'down';
        else if (k >= '1' && k <= '5') key = k;
        else if (k === 'q') {
          if (ws.readyState === ws.OPEN) {
            ws.send('\x1b[2J\x1b[H\r\n  Goodbye! 👋\r\n');
            setTimeout(() => ws.close(), 500);
          }
          return;
        }

        if (key && renderer.handleKey(key)) {
          redraw();
        }
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    clearInterval(twinkleInterval);
    console.log('Web client disconnected');
  });
});

server.listen(WEB_PORT, () => {
  console.log(`Web portfolio server at http://localhost:${WEB_PORT}`);
});
