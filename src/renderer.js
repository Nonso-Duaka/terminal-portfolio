/**
 * Terminal UI renderer - moriliu-style layout.
 * Uses absolute cursor positioning so braille width doesn't matter.
 * Features: boot sequence, typing effect, gradient portrait, dynamic stars, smooth tabs.
 */

const fs = require('fs');
const path = require('path');
const content = require('./content');

const c = {
  reset:     '\x1b[0m',
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  cyan:      '\x1b[36m',
  yellow:    '\x1b[33m',
  green:     '\x1b[32m',
  white:     '\x1b[37m',
  gray:      '\x1b[90m',
  blue:      '\x1b[34m',
  magenta:   '\x1b[35m',
  clearScreen: '\x1b[2J\x1b[3J\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
};

// 256-color foreground
function fg256(n) { return `\x1b[38;5;${n}m`; }
// True color foreground
function fgRGB(r, g, b) { return `\x1b[38;2;${r};${g};${b}m`; }

function col(n) { return `\x1b[${n}G`; }
function pos(row, c) { return `\x1b[${row};${c}H`; }

const portraitLines = fs.readFileSync(
  path.join(__dirname, 'portrait.txt'), 'utf-8'
).split('\n').filter(l => l.length > 0);

const nameBanner = [
  `                                __          __`,
  `  ___  ___  ___  ___ ___    ___/ /_ _____ _/ /_____ _`,
  ` / _ \\/ _ \\/ _ \\(_-</ _ \\  / _  / // / _ \`/  '_/ _ \`/`,
  `/_//_/\\___/_//_/___/\\___/  \\_,_/\\_,_/\\_,_/_/\\_\\\\_,_/`,
];

const TABS = ['About', 'Experience', 'Skills', 'Contact', 'Presentations'];
const STAR_CHARS = ['✦', '✧', '·', '+', '˚', '°', '*', '⋆'];

// Gradient colors (pure white → light blue)
const PORTRAIT_GRADIENT = [];
for (let i = 0; i < 50; i++) {
  const t = i / 49;
  const r = Math.round(240 - t * 60);
  const g = Math.round(240 - t * 30);
  const b = 255;
  PORTRAIT_GRADIENT.push(fgRGB(r, g, b));
}

// Text gradient helper: returns color for a line based on position in content
function textGrad(lineIdx, totalLines) {
  const t = totalLines <= 1 ? 0 : lineIdx / (totalLines - 1);
  const r = Math.round(240 - t * 60);
  const g = Math.round(240 - t * 30);
  const b = 255;
  return fgRGB(r, g, b);
}

// Accent color (light blue end of gradient)
const accent = fgRGB(180, 210, 255);
// Bright start color
const bright = fgRGB(240, 240, 255);

// Boot sequence lines
const BOOT_LINES = [
  { text: '[    0.000000] initializing nonso_duaka v1.0...', delay: 0 },
  { text: '[    0.031337] loading personality module... OK', delay: 1 },
  { text: '[    0.042000] mounting /dev/creativity... OK', delay: 2 },
  { text: '[    0.069420] loading neural_networks.ko... OK', delay: 3 },
  { text: '[    0.080000] scanning protein databases... OK', delay: 4 },
  { text: '[    0.100000] initializing ml_pipeline... OK', delay: 5 },
  { text: '[    0.120000] compiling research results... OK', delay: 6 },
  { text: '[    0.150000] all systems operational.', delay: 7 },
  { text: '', delay: 8 },
  { text: 'Welcome.', delay: 9 },
];

const TEXT_COL = 60;

class TUIRenderer {
  constructor() {
    this.selectedTab = 0;
    this.scrollOffset = 0;
    this.tick = 0;
    this.bootPhase = true;
    this.bootTick = 0;
    this.typingPhase = false;
    this.typingCharIndex = 0;
    this.prevTab = -1;
    this.tabTransition = 0;

    // More stars, spread across the whole screen
    this.stars = [];
    for (let i = 0; i < 25; i++) {
      this.stars.push(this._newStar());
    }

    // Shooting stars
    this.shootingStars = [];
  }

  _newStar() {
    return {
      row: Math.floor(Math.random() * 35) + 1,
      starCol: Math.floor(Math.random() * 8) + 52, // cols 52-59 (gap + beyond)
      char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
      phase: Math.floor(Math.random() * 10),
      speed: 1 + Math.floor(Math.random() * 3), // varying twinkle speed
      brightness: Math.random(), // 0-1
    };
  }

  // Boot sequence render
  renderBoot(cols, rows) {
    this.bootTick++;
    let out = c.clearScreen + c.hideCursor;

    const startRow = Math.floor(rows / 2) - 5;

    for (const line of BOOT_LINES) {
      if (this.bootTick > line.delay * 2) {
        const row = startRow + line.delay;
        const text = line.text;

        if (text === 'Welcome.') {
          const pad = Math.floor((cols - text.length) / 2);
          out += pos(row, 1) + ' '.repeat(pad) + `${c.bold}${bright}${text}${c.reset}`;
        } else if (text === '') {
          // empty
        } else {
          const charsToShow = Math.min(text.length, (this.bootTick - line.delay * 2) * 3);
          const visible = text.substring(0, charsToShow);
          const pad = Math.floor((cols - text.length) / 2);
          const lineColor = textGrad(line.delay, BOOT_LINES.length);
          out += pos(row, 1) + ' '.repeat(pad) + `${lineColor}${visible}${c.reset}`;
        }
      }
    }

    // Boot is done after all lines are fully typed
    if (this.bootTick > 24) {
      this.bootPhase = false;
      this.typingPhase = true;
      this.typingCharIndex = 0;
    }

    return out;
  }

  render(cols, rows) {
    if (this.bootPhase) {
      return this.renderBoot(cols, rows);
    }

    this.tick++;
    const mobile = cols < 80;

    if (mobile) {
      return this.renderMobile(cols, rows);
    }

    let out = c.clearScreen + c.hideCursor;

    const textW = Math.min(Math.max(cols - TEXT_COL - 1, 20), 55);
    const contentRows = rows - 4;

    // Tab transition fade
    if (this.tabTransition > 0) {
      this.tabTransition--;
    }

    // Right side content
    const right = [];
    right.push('');
    nameBanner.forEach((l, i) => right.push(`${textGrad(i, nameBanner.length)}${c.bold}${l}${c.reset}`));
    right.push('');
    const tabContent = this._getTabContent(textW);

    // Apply fade-in on tab transition
    tabContent.forEach(l => {
      if (this.tabTransition > 2) {
        right.push('');
      } else {
        right.push(l);
      }
    });

    for (let y = 0; y < contentRows; y++) {
      const row = y + 1;

      // Portrait with gradient color
      if (y < portraitLines.length) {
        const gradIdx = Math.min(Math.floor(y / portraitLines.length * PORTRAIT_GRADIENT.length), PORTRAIT_GRADIENT.length - 1);
        const pLine = portraitLines[y];
        out += pos(row, 1) + PORTRAIT_GRADIENT[gradIdx] + pLine + c.reset;
      }

      // Dynamic stars
      for (const s of this.stars) {
        if (s.row === y) {
          const visible = ((this.tick + s.phase) % (s.speed * 4)) < (s.speed * 2);
          if (visible) {
            // Cool white/blue brightness
            const bright = Math.sin((this.tick + s.phase) * 0.3) * 0.5 + 0.5;
            const r = Math.round(180 + bright * 75);
            const g = Math.round(200 + bright * 55);
            const b = 255;
            out += col(s.starCol) + fgRGB(r, g, b) + s.char + c.reset;
          }
        }
      }

      // Shooting star
      if (this.tick % 30 === 0 && this.shootingStars.length < 2) {
        this.shootingStars.push({
          row: Math.floor(Math.random() * 10) + 1,
          col: 50 + Math.floor(Math.random() * 10),
          life: 6,
        });
      }
      for (let si = this.shootingStars.length - 1; si >= 0; si--) {
        const ss = this.shootingStars[si];
        if (ss.row === y && ss.life > 0) {
          const trail = '·.·';
          const brightness = ss.life / 6;
          out += col(ss.col) + fgRGB(
            Math.round(255 * brightness),
            Math.round(255 * brightness),
            Math.round(255 * brightness)
          ) + '✧' + c.dim + trail.substring(0, 3 - Math.floor(ss.life / 2)) + c.reset;
        }
        ss.row++;
        ss.col--;
        ss.life--;
        if (ss.life <= 0) this.shootingStars.splice(si, 1);
      }

      // Right text at fixed column
      const ri = y + this.scrollOffset;
      if (ri < right.length && right[ri]) {
        out += col(TEXT_COL) + right[ri] + c.reset;
      }
    }

    // Tab bar with active indicator
    const tabRow = contentRows + 1;
    let tabStr = '';
    TABS.forEach((tab, i) => {
      if (i === this.selectedTab) {
        tabStr += ` ${c.bold}${bright}✦ ${tab}${c.reset}`;
      } else {
        tabStr += `    ${accent}${tab}${c.reset}`;
      }
    });
    const tabPad = Math.max(0, Math.floor((cols - stripAnsi(tabStr).length) / 2));
    out += pos(tabRow + 1, 1) + ' '.repeat(tabPad) + tabStr;

    // Hint line
    const hint = `${accent}[← → to select · ↑ ↓ to scroll · q to quit]${c.reset}`;
    const hintPad = Math.max(0, Math.floor((cols - stripAnsi(hint).length) / 2));
    out += pos(tabRow + 2, 1) + ' '.repeat(hintPad) + hint;

    // SSH hint + year
    const year = new Date().getFullYear();
    const sshHint = `${accent}ssh -p 24825 interchange.proxy.rlwy.net · © ${year} Nonso Duaka${c.reset}`;
    const sshPad = Math.max(0, Math.floor((cols - stripAnsi(sshHint).length) / 2));
    out += pos(tabRow + 3, 1) + ' '.repeat(sshPad) + sshHint;

    return out;
  }

  // Mobile/narrow layout: stacked vertically
  renderMobile(cols, rows) {
    let out = c.clearScreen + c.hideCursor;
    const textW = Math.max(cols - 4, 16);
    const contentRows = rows - 4;

    if (this.tabTransition > 0) {
      this.tabTransition--;
    }

    // Build all lines vertically
    const lines = [];

    // Compact name banner - center each line
    const mobileNameBanner = [
      ' nonso duaka',
    ];
    lines.push('');
    mobileNameBanner.forEach(l => {
      const pad = Math.max(0, Math.floor((cols - l.length) / 2));
      lines.push(`${bright}${c.bold}${' '.repeat(pad)}${l}${c.reset}`);
    });
    lines.push('');

    // Tab content
    const tabContent = this._getTabContent(textW);
    tabContent.forEach(l => {
      if (this.tabTransition > 2) {
        lines.push('');
      } else {
        lines.push(l);
      }
    });

    // Render visible lines with scroll offset
    for (let y = 0; y < contentRows; y++) {
      const li = y + this.scrollOffset;
      if (li < lines.length && lines[li]) {
        out += pos(y + 1, 2) + lines[li] + c.reset;
      }
    }

    // Tab bar - compact for mobile
    const tabRow = contentRows + 1;
    let tabStr = '';
    TABS.forEach((tab, i) => {
      const short = tab.length > 5 ? tab.substring(0, 5) : tab;
      if (i === this.selectedTab) {
        tabStr += ` ${c.bold}${bright}✦${short}${c.reset}`;
      } else {
        tabStr += ` ${accent}${short}${c.reset}`;
      }
    });
    const tabPad = Math.max(0, Math.floor((cols - stripAnsi(tabStr).length) / 2));
    out += pos(tabRow + 1, 1) + ' '.repeat(tabPad) + tabStr;

    // Hint - shorter for mobile
    const hint = `${accent}[swipe or ← → ↑ ↓]${c.reset}`;
    const hintPad = Math.max(0, Math.floor((cols - stripAnsi(hint).length) / 2));
    out += pos(tabRow + 2, 1) + ' '.repeat(hintPad) + hint;

    // Footer
    const year = new Date().getFullYear();
    const footer = `${accent}© ${year} Nonso Duaka${c.reset}`;
    const footPad = Math.max(0, Math.floor((cols - stripAnsi(footer).length) / 2));
    out += pos(tabRow + 3, 1) + ' '.repeat(footPad) + footer;

    return out;
  }

  _getTabContent(w) {
    switch (this.selectedTab) {
      case 0: return this._about(w);
      case 1: return this._experience(w);
      case 2: return this._skills(w);
      case 3: return this._contact(w);
      case 4: return this._presentations(w);
      default: return [];
    }
  }

  _about(w) {
    const raw = [];
    const paras = [
      `I'm an undergraduate studying Computer Science, Mathematics & Physics at Grambling State University (expected May 2027). I'm interested in building tools at the intersection of machine learning and drug discovery.`,
      `Currently, I work as an AI Engineering Intern at ArcellAI, where I integrate single-cell foundation models into scalable pipelines for perturbational biology. I conduct research with the David Koes group in the CMUPittCompBio Program, working on drug-target interaction prediction. At the University of Pittsburgh, I build tools for molecular docking.`,
      `Previously, I interned at Merck & Co, where I worked on using protein language models to improve thermostability of antibodies. I'm also a SPAR research mentee at SecureBio, working on biosecurity and genomic sequence classification.`,
    ];
    paras.forEach((p, i) => {
      wrap(p, w, true).forEach(l => raw.push(l));
      if (i < paras.length - 1) { raw.push(''); raw.push(''); }
    });
    return raw.map((l, i) => l === '' ? '' : `${textGrad(i, raw.length)}${l}${c.reset}`);
  }

  _experience() {
    const raw = [];
    raw.push({ text: 'Experience', type: 'header' });
    raw.push({ text: '', type: 'blank' });
    content.experience.forEach((exp, i) => {
      raw.push({ text: `${exp.role} · ${exp.org}`, type: 'bold' });
      raw.push({ text: `${exp.date} · ${exp.location}`, type: 'normal' });
      if (i < content.experience.length - 1) raw.push({ text: '', type: 'blank' });
    });
    raw.push({ text: '', type: 'blank' });
    raw.push({ text: 'For full details, view my resume:', type: 'normal' });
    raw.push({ text: 'LINK', type: 'link' });

    return raw.map((item, i) => {
      if (item.type === 'blank') return '';
      if (item.type === 'link') return `\x1b]8;;https://drive.google.com/open?id=1XzbaQO_9JLhfj7kaX5T8ZJeFKEBroN8t\x07${accent}${c.bold}▸ Click here to view resume${c.reset}\x1b]8;;\x07`;
      const color = textGrad(i, raw.length);
      if (item.type === 'header') return `${color}${c.bold}${item.text}${c.reset}`;
      if (item.type === 'bold') return `${color}${c.bold}${item.text}${c.reset}`;
      return `${color}${item.text}${c.reset}`;
    });
  }

  _skills() {
    const raw = [
      'Technical Skills', '',
      ...Object.entries(content.skills).map(([cat, val]) => `${cat.padEnd(18)}${val}`),
      '',
      'Coursework', '',
      'CS',
      'Object-Oriented Programming, Data Structures',
      'and Algorithms, Intro to Artificial',
      'Intelligence, Programming Language Concept,',
      'Machine Learning, Operating Systems,',
      'Software Engineering, Discrete Math,',
      'Computer Networks', '',
      'Math, Physics & Biology',
      'Linear Algebra, Numerical Methods,',
      'Multivariable Calculus, Probability &',
      'Statistics, Modern Physics, Thermodynamics,',
      'Electrodynamics, Biochemistry, Organic',
      'Chemistry, Cell and Molecular Biology',
    ];
    return raw.map((l, i) => l === '' ? '' : `${textGrad(i, raw.length)}${l}${c.reset}`);
  }

  _contact() {
    const raw = [
      { text: 'Get in Touch', type: 'header' },
      { text: '', type: 'blank' },
      { text: 'email', label: 'Email', type: 'link', url: `mailto:${content.email}`, display: content.email },
      { text: 'phone', label: 'Phone', type: 'value', display: content.phone },
      { text: 'linkedin', label: 'LinkedIn', type: 'link', url: 'https://www.linkedin.com/in/nonso-duaka-3117b8316/', display: 'LinkedIn' },
      { text: 'github', label: 'GitHub', type: 'link', url: 'https://github.com/Nonso-Duaka', display: 'GitHub' },
    ];
    return raw.map((item, i) => {
      if (item.type === 'blank') return '';
      const color = textGrad(i, raw.length);
      if (item.type === 'header') return `${color}${c.bold}${item.text}${c.reset}`;
      if (item.type === 'link') return `${color}${c.bold}${item.label.padEnd(11)}${c.reset}\x1b]8;;${item.url}\x07${accent}${c.bold}${item.display}${c.reset}\x1b]8;;\x07`;
      return `${color}${c.bold}${item.label.padEnd(11)}${c.reset}${color}${item.display}${c.reset}`;
    });
  }

  _presentations(w) {
    const raw = ['Presentations', ''];
    content.presentations.forEach((p, i) => {
      wrap(p, w - 4).forEach((l, j) => {
        raw.push(j === 0 ? `${i + 1}. ${l}` : `   ${l}`);
      });
      raw.push('');
    });
    return raw.map((l, i) => l === '' ? '' : `${textGrad(i, raw.length)}${l}${c.reset}`);
  }

  handleKey(key) {
    if (key === 'left' || key === 'h') { this.prevTab = this.selectedTab; this.selectedTab = (this.selectedTab - 1 + TABS.length) % TABS.length; this.scrollOffset = 0; this.tabTransition = 4; return true; }
    if (key === 'right' || key === 'l') { this.prevTab = this.selectedTab; this.selectedTab = (this.selectedTab + 1) % TABS.length; this.scrollOffset = 0; this.tabTransition = 4; return true; }
    if (key === 'up' || key === 'k') { this.scrollOffset = Math.max(0, this.scrollOffset - 1); return true; }
    if (key === 'down' || key === 'j') { this.scrollOffset += 1; return true; }
    if (key >= '1' && key <= '5') { this.prevTab = this.selectedTab; this.selectedTab = parseInt(key) - 1; this.scrollOffset = 0; this.tabTransition = 4; return true; }
    return false;
  }
}

function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\]8;;[^\x07]*\x07/g, ''); }
function wrap(text, max, justify = false) {
  if (max <= 0) return [text];
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > max && cur) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  if (!justify) return lines;
  return lines.map((line, i) => {
    if (i === lines.length - 1) return line;
    const ws = line.split(' ');
    if (ws.length <= 1) return line;
    const gaps = ws.length - 1;
    const extra = max - line.length;
    if (extra <= 0) return line;
    const baseSpace = Math.floor(extra / gaps);
    let remainder = extra % gaps;
    return ws.map((w, j) => {
      if (j === ws.length - 1) return w;
      const pad = 1 + baseSpace + (j < remainder ? 1 : 0);
      return w + ' '.repeat(pad);
    }).join('');
  });
}

module.exports = { TUIRenderer, c };
