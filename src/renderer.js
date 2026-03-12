/**
 * Terminal UI renderer - moriliu-style layout.
 * Uses absolute cursor positioning (\x1b[<col>G) so braille width doesn't matter.
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
  clearScreen: '\x1b[2J\x1b[3J\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
};

// Move cursor to absolute column
function col(n) { return `\x1b[${n}G`; }
// Move cursor to absolute position
function pos(row, c) { return `\x1b[${row};${c}H`; }

const portraitLines = fs.readFileSync(
  path.join(__dirname, 'portrait.txt'), 'utf-8'
).split('\n');

const nameBanner = [
  `                                __          __`,
  `  ___  ___  ___  ___ ___    ___/ /_ _____ _/ /_____ _`,
  ` / _ \\/ _ \\/ _ \\(_-</ _ \\  / _  / // / _ \`/  '_/ _ \`/`,
  `/_//_/\\___/_//_/___/\\___/  \\_,_/\\_,_/\\_,_/_/\\_\\\\_,_/`,
];

const TABS = ['About', 'Experience', 'Skills', 'Contact', 'Presentations'];
const STAR_CHARS = ['✦', '✧', '·', '+', '˚'];

// Column where right-side text starts (absolute)
const TEXT_COL = 60;

class TUIRenderer {
  constructor() {
    this.selectedTab = 0;
    this.scrollOffset = 0;
    this.tick = 0;
    this.stars = [];
    for (let i = 0; i < 10; i++) {
      this.stars.push({
        row: Math.floor(Math.random() * 22) + 1,
        starCol: Math.floor(Math.random() * 3) + 56, // cols 56-58 (gap area)
        char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
        phase: Math.floor(Math.random() * 6),
      });
    }
  }

  render(cols, rows) {
    this.tick++;
    let out = c.clearScreen + c.hideCursor;

    const textW = Math.min(Math.max(cols - TEXT_COL - 1, 20), 55);
    const contentRows = rows - 3;

    // Right side content
    const right = [];
    right.push('');
    nameBanner.forEach(l => right.push(`${c.cyan}${l}${c.reset}`));
    right.push('');
    this._getTabContent(textW).forEach(l => right.push(l));

    for (let y = 0; y < contentRows; y++) {
      const row = y + 1; // 1-indexed for ANSI

      // Portrait on the left (starts at col 1)
      const pLine = y < portraitLines.length ? portraitLines[y] : '';
      out += pos(row, 1) + `${c.cyan}${pLine}${c.reset}`;

      // Stars in the gap
      for (const s of this.stars) {
        if (s.row === y && ((this.tick + s.phase) % 4) < 2) {
          out += col(s.starCol) + `${c.bold}${c.white}${s.char}${c.reset}`;
        }
      }

      // Right text at fixed column
      const ri = y + this.scrollOffset;
      if (ri < right.length && right[ri]) {
        out += col(TEXT_COL) + right[ri] + c.reset;
      }
    }

    // Tab bar
    const tabRow = contentRows + 1;
    let tabStr = '';
    TABS.forEach((tab, i) => {
      tabStr += i === this.selectedTab
        ? ` ${c.bold}${c.white}✦ ${tab}${c.reset}`
        : `    ${c.white}${tab}${c.reset}`;
    });
    const tabPad = Math.max(0, Math.floor((cols - stripAnsi(tabStr).length) / 2));
    out += pos(tabRow + 1, 1) + ' '.repeat(tabPad) + tabStr;

    const hint = `${c.white}[← → to select · ↑ ↓ to scroll · q to quit]${c.reset}`;
    const hintPad = Math.max(0, Math.floor((cols - stripAnsi(hint).length) / 2));
    out += pos(tabRow + 2, 1) + ' '.repeat(hintPad) + hint;

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
    const lines = [];
    const paras = [
      `I'm an undergraduate studying Computer Science, Mathematics & Physics at Grambling State University (expected May 2027). I'm interested in building tools at the intersection of machine learning and drug discovery.`,
      `Currently, I work as an AI Engineering Intern at ArcellAI, where I integrate single-cell foundation models into scalable pipelines for perturbational biology. I conduct research with the David Koes group in the CMUPittCompBio Program, working on drug-target interaction prediction. At the University of Pittsburgh, I build tools for molecular docking.`,
      `Previously, I interned at Merck & Co, where I worked on using protein language models to improve thermostability of antibodies. I'm also a SPAR research mentee at SecureBio, working on biosecurity and genomic sequence classification.`,
    ];
    paras.forEach((p, i) => {
      wrap(p, w, true).forEach(l => lines.push(`${c.bold}${c.white}${l}${c.reset}`));
      if (i < paras.length - 1) { lines.push(''); lines.push(''); }
    });
    return lines;
  }

  _experience(w) {
    const lines = [];
    lines.push(`${c.bold}${c.white}Experience${c.reset}`);
    lines.push('');
    content.experience.forEach((exp, i) => {
      lines.push(`${c.bold}${c.white}${exp.role}${c.reset} ${c.bold}${c.white}· ${exp.org}${c.reset}`);
      lines.push(`${c.bold}${c.white}${exp.date} · ${exp.location}${c.reset}`);
      if (i < content.experience.length - 1) lines.push('');
    });
    lines.push('');
    lines.push(`${c.bold}${c.white}For full details, view my resume:${c.reset}`);
    lines.push(`\x1b]8;;https://drive.google.com/open?id=1XzbaQO_9JLhfj7kaX5T8ZJeFKEBroN8t\x07${c.cyan}${c.bold}▸ Click here to view resume${c.reset}\x1b]8;;\x07`);
    return lines;
  }

  _skills() {
    return [
      `${c.bold}${c.white}Technical Skills${c.reset}`,
      '',
      ...Object.entries(content.skills).map(([cat, val]) =>
        `${c.bold}${c.white}${cat.padEnd(18)}${val}${c.reset}`
      ),
      '',
      `${c.bold}${c.white}Coursework${c.reset}`,
      '',
      `${c.cyan}CS${c.reset}`,
      `${c.bold}${c.white}Object-Oriented Programming, Data Structures${c.reset}`,
      `${c.bold}${c.white}and Algorithms, Intro to Artificial${c.reset}`,
      `${c.bold}${c.white}Intelligence, Programming Language Concept,${c.reset}`,
      `${c.bold}${c.white}Machine Learning, Operating Systems,${c.reset}`,
      `${c.bold}${c.white}Software Engineering, Discrete Math,${c.reset}`,
      `${c.bold}${c.white}Computer Networks${c.reset}`,
      '',
      `${c.cyan}Math, Physics & Biology${c.reset}`,
      `${c.bold}${c.white}Linear Algebra, Numerical Methods,${c.reset}`,
      `${c.bold}${c.white}Multivariable Calculus, Probability &${c.reset}`,
      `${c.bold}${c.white}Statistics, Modern Physics, Thermodynamics,${c.reset}`,
      `${c.bold}${c.white}Electrodynamics, Biochemistry, Organic${c.reset}`,
      `${c.bold}${c.white}Chemistry, Cell and Molecular Biology${c.reset}`,
    ];
  }

  _contact() {
    return [
      `${c.bold}${c.white}Get in Touch${c.reset}`,
      '',
      `${c.bold}${c.white}Email${c.reset}      \x1b]8;;mailto:${content.email}\x07${c.cyan}${c.bold}${content.email}${c.reset}\x1b]8;;\x07`,
      `${c.bold}${c.white}Phone${c.reset}      ${c.bold}${c.white}${content.phone}${c.reset}`,
      `${c.bold}${c.white}LinkedIn${c.reset}   \x1b]8;;https://${content.linkedin}\x07${c.cyan}${c.bold}${content.linkedin}${c.reset}\x1b]8;;\x07`,
      `${c.bold}${c.white}GitHub${c.reset}     \x1b]8;;https://${content.github}\x07${c.cyan}${c.bold}${content.github}${c.reset}\x1b]8;;\x07`,
    ];
  }

  _presentations(w) {
    const lines = [`${c.bold}${c.white}Presentations${c.reset}`, ''];
    content.presentations.forEach((p, i) => {
      wrap(p, w - 4).forEach((l, j) => {
        lines.push(j === 0 ? `${c.bold}${c.white}${i + 1}. ${l}${c.reset}` : `   ${c.bold}${c.white}${l}${c.reset}`);
      });
      lines.push('');
    });
    return lines;
  }

  handleKey(key) {
    if (key === 'left' || key === 'h') { this.selectedTab = (this.selectedTab - 1 + TABS.length) % TABS.length; this.scrollOffset = 0; return true; }
    if (key === 'right' || key === 'l') { this.selectedTab = (this.selectedTab + 1) % TABS.length; this.scrollOffset = 0; return true; }
    if (key === 'up' || key === 'k') { this.scrollOffset = Math.max(0, this.scrollOffset - 1); return true; }
    if (key === 'down' || key === 'j') { this.scrollOffset += 1; return true; }
    if (key >= '1' && key <= '5') { this.selectedTab = parseInt(key) - 1; this.scrollOffset = 0; return true; }
    return false;
  }
}

function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
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
  // Justify all lines except the last
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
