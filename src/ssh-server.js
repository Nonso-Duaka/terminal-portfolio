#!/usr/bin/env node
/**
 * SSH server that serves the terminal portfolio.
 * Usage: node src/ssh-server.js
 * Connect: ssh -p 2222 localhost
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Server } = require('ssh2');
const { TUIRenderer, c } = require('./renderer');

const SSH_PORT = parseInt(process.env.SSH_PORT || '2222', 10);
const HOST_KEY_PATH = path.join(__dirname, '..', 'host_key');

// Auto-generate host key if it doesn't exist (for containers/deploys)
if (!fs.existsSync(HOST_KEY_PATH)) {
  console.log('Generating SSH host key...');
  execSync(`ssh-keygen -t rsa -b 2048 -f "${HOST_KEY_PATH}" -N "" -q`);
}

const hostKey = fs.readFileSync(HOST_KEY_PATH);

const server = new Server({ hostKeys: [hostKey] }, (client) => {
  console.log('Client connected');

  client.on('authentication', (ctx) => {
    ctx.accept();
  });

  client.on('ready', () => {
    client.on('session', (accept) => {
      const session = accept();

      session.on('pty', (accept, reject, info) => {
        accept();
      });

      session.on('shell', (accept) => {
        const stream = accept();
        const renderer = new TUIRenderer();

        let cols = 120;
        let rows = 40;
        let alive = true;

        function redraw() {
          if (alive) {
            try { stream.write(renderer.render(cols, rows)); } catch(e) {}
          }
        }

        // Initial render
        redraw();

        // Twinkling stars - re-render every 1.5s
        const twinkleInterval = setInterval(() => redraw(), 1500);

        // Handle window resize
        session.on('window-change', (accept, reject, info) => {
          cols = info.cols;
          rows = info.rows;
          redraw();
        });

        // Handle keyboard input
        stream.on('data', (data) => {
          const hex = data.toString('hex');
          const str = data.toString('utf8');

          let key = null;

          if (hex === '1b5b44') key = 'left';
          else if (hex === '1b5b43') key = 'right';
          else if (hex === '1b5b41') key = 'up';
          else if (hex === '1b5b42') key = 'down';
          else if (str === 'h') key = 'left';
          else if (str === 'l') key = 'right';
          else if (str === 'k') key = 'up';
          else if (str === 'j') key = 'down';
          else if (str >= '1' && str <= '5') key = str;
          else if (str === 'q' || hex === '03') {
            alive = false;
            clearInterval(twinkleInterval);
            stream.write(c.showCursor + c.clearScreen);
            stream.write(`${c.cyan}Thanks for visiting! — Nonso Duaka${c.reset}\r\n`);
            stream.exit(0);
            stream.end();
            return;
          }

          if (key && renderer.handleKey(key)) {
            redraw();
          }
        });

        stream.on('close', () => {
          alive = false;
          clearInterval(twinkleInterval);
          console.log('Client stream closed');
        });
      });
    });
  });

  client.on('close', () => {
    console.log('Client disconnected');
  });

  client.on('error', (err) => {
    console.error('Client error:', err.message);
  });
});

server.listen(SSH_PORT, '0.0.0.0', () => {
  console.log(`SSH portfolio server listening on port ${SSH_PORT}`);
  console.log(`Connect with: ssh -p ${SSH_PORT} localhost`);
});
