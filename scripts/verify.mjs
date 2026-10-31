#!/usr/bin/env node
/**
 * Dependency-free verification for NOVA.
 *
 * Checks that the calculator stays self-contained and exercises the safe
 * expression parser directly from the HTML file. Runs on Node 18+ and Deno.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const calculatorPath = fileURLToPath(new URL('../scientific-calculator.html', import.meta.url));
const html = readFileSync(calculatorPath, 'utf8');

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, error });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractParser(source) {
  const start = source.indexOf('/* ===== SAFE PARSER START ===== */');
  const end = source.indexOf('/* ===== SAFE PARSER END ===== */');

  assert(start !== -1 && end !== -1, 'Parser markers are missing');
  assert(end > start, 'Parser markers are out of order');

  const block = source.slice(start, end);
  const factory = new Function(`${block}\nreturn { evaluateExpression };`);
  return factory().evaluateExpression;
}

function near(actual, expected, tolerance = 1e-9) {
  return Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
}

/* ------------------------------------------------------------------ */
/* Self-containment and document structure                            */
/* ------------------------------------------------------------------ */

check('document declares HTML5 and English', () => {
  assert(/^<!DOCTYPE html>/i.test(html), 'Missing <!DOCTYPE html>');
  assert(/<html\s+lang="en"/i.test(html), 'Missing lang="en"');
});

check('document exposes title, description, and theme metadata', () => {
  assert(/<title>[^<]+<\/title>/i.test(html), 'Missing <title>');
  assert(/<meta\s+name="description"\s+content="[^"]+"/i.test(html), 'Missing meta description');
  assert(/<meta\s+name="viewport"/i.test(html), 'Missing viewport meta tag');
  assert(/<meta\s+name="theme-color"/i.test(html), 'Missing theme-color meta tag');
  assert(/rel="canonical"/i.test(html), 'Missing canonical link');
  assert(/application\/ld\+json/i.test(html), 'Missing structured data');
});

check('favicon is an inline SVG data URI', () => {
  assert(/rel="icon"[^>]+href="data:image\/svg\+xml,/i.test(html), 'Favicon is not inline');
});

check('no external runtime resources are loaded', () => {
  assert(!/<script[^>]+\bsrc\s*=/i.test(html), 'Found an external script');
  assert(!/<link[^>]+rel="stylesheet"/i.test(html), 'Found an external stylesheet');
  assert(!/@import\s/i.test(html), 'Found a CSS @import');
  assert(!/url\(\s*["']?https?:/i.test(html), 'Found a remote CSS asset');
  assert(!/<(?:img|iframe|video|audio|source)\b[^>]*(?:src|srcset)\s*=\s*["']https?:/i.test(html), 'Found a remote media asset');
});

check('calculator makes no network calls', () => {
  assert(!/\bfetch\s*\(/.test(html), 'Found fetch()');
  assert(!/\bXMLHttpRequest\b/.test(html), 'Found XMLHttpRequest');
  assert(!/\bWebSocket\b/.test(html), 'Found WebSocket');
  assert(!/\bsendBeacon\b/.test(html), 'Found sendBeacon');
  assert(!/\bimportScripts\b/.test(html), 'Found importScripts');
});

check('calculator never uses eval or the Function constructor', () => {
  assert(!/\beval\s*\(/.test(html), 'Found eval()');
  assert(!/\bnew\s+Function\s*\(/.test(html), 'Found new Function()');
});

check('styles and application script are inline', () => {
  assert((html.match(/<style>/g) || []).length === 1, 'Expected exactly one inline <style>');
  assert(/<\/style>/.test(html), 'Missing </style>');
  assert(/<script>\s*\(\(\) => \{/.test(html), 'Missing inline application script');
});

check('all buttons declare an explicit type', () => {
  const buttons = html.match(/<button\b[^>]*>/gi) || [];
  assert(buttons.length >= 40, `Expected at least 40 buttons, found ${buttons.length}`);
  const untyped = buttons.filter((tag) => !/\btype\s*=/i.test(tag));
  assert(untyped.length === 0, `Found ${untyped.length} button(s) without a type`);
});

check('element ids are unique and referenced ids exist', () => {
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(duplicates.length === 0, `Duplicate ids: ${[...new Set(duplicates)].join(', ')}`);

  const referenced = Array.from(html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g), (match) => match[1]);
  const missing = referenced.filter((id) => !ids.includes(id));
  assert(missing.length === 0, `getElementById targets missing ids: ${[...new Set(missing)].join(', ')}`);
});

check('both keypad modes and the history drawer are present', () => {
  assert(/id="standardKeypad"/.test(html), 'Missing standard keypad');
  assert(/id="scientificKeypad"/.test(html), 'Missing scientific keypad');
  assert(/id="historyDrawer"/.test(html), 'Missing history drawer');
  assert(/data-mode="standard"/.test(html) && /data-mode="scientific"/.test(html), 'Missing mode switches');

  const scientificBlock = html.slice(
    html.indexOf('id="scientificKeypad"'),
    html.indexOf('class="footer-bar"'),
  );
  const scientificKeys = scientificBlock.match(/<button\b/g) || [];
  assert(scientificKeys.length >= 25, `Scientific keypad has only ${scientificKeys.length} keys`);
});

check('file is a substantial, self-contained document', () => {
  assert(Buffer.byteLength(html, 'utf8') > 50_000, 'Calculator file is unexpectedly small');
});

/* ------------------------------------------------------------------ */
/* Safe parser: arithmetic and precedence                             */
/* ------------------------------------------------------------------ */

const evaluateExpression = extractParser(html);

check('parser markers wrap a working evaluator', () => {
  assert(typeof evaluateExpression === 'function', 'evaluateExpression was not extracted');
});

const valueCases = [
  ['addition', '1 + 2', 3],
  ['operator precedence', '1 + 2 * 3', 7],
  ['parentheses override precedence', '(1 + 2) * 3', 9],
  ['left-associative division', '20 / 5 / 2', 2],
  ['right-associative power', '2 ^ 3 ^ 2', 512],
  ['unary minus applies before power', '-2 ^ 2', -4],
  ['negative exponent', '2 ^ -2', 0.25],
  ['negative base in parentheses', '(-2) ^ 2', 4],
  ['factorial', '5!', 120],
  ['chained postfix operators', '3!!', 720],
  ['percent postfix', '50%', 0.5],
  ['percent in a product', '200 * 10%', 20],
  ['implicit multiplication', '2(3 + 4)', 14],
  ['implicit multiplication with a function', '2sin(30)', 1],
  ['pi constant', 'π', Math.PI],
  ['pi spelled out', 'pi', Math.PI],
  ['Euler constant', 'e', Math.E],
  ['scientific notation', '1.5e3 + 2', 1502],
  ['whitespace is ignored', '  7  *  6  ', 42],
  ['square root', 'sqrt(81)', 9],
  ['base-10 logarithm', 'log(1000)', 3],
  ['natural logarithm', 'ln(e)', 1],
  ['sine in degrees', 'sin(30)', 0.5],
  ['cosine in degrees', 'cos(60)', 0.5],
  ['tangent in degrees', 'tan(45)', 1],
  ['sine in radians', 'sin(pi / 2)', 1, { angle: 'RAD' }],
  ['radian mode', 'cos(pi)', -1, { angle: 'RAD' }],
  ['auto-closes parentheses', 'sin(30', 0.5, { autoClose: true }],
  ['auto-closes nested groups', '2(3', 6, { autoClose: true }],
];

for (const [name, expression, expected, options = {}] of valueCases) {
  check(`evaluates ${name}: ${expression}`, () => {
    const actual = evaluateExpression(expression, options.angle || 'DEG', {
      autoClose: Boolean(options.autoClose),
    });
    assert(near(actual, expected), `Expected ${expected}, received ${actual}`);
  });
}

const errorCases = [
  ['empty input', '', 'empty'],
  ['blank input', '   ', 'empty'],
  ['divide by zero', '1 / 0', 'math'],
  ['square root of a negative', 'sqrt(-1)', 'math'],
  ['logarithm of zero', 'log(0)', 'math'],
  ['natural logarithm of a negative', 'ln(-2)', 'math'],
  ['factorial of a fraction', '2.5!', 'math'],
  ['factorial of a negative', '(-1)!', 'math'],
  ['factorial overflow', '171!', 'math'],
  ['unknown function', 'nope(2)', 'invalid'],
  ['double decimal point', '1..2', 'invalid'],
  ['bare decimal point', '.', 'invalid'],
  ['mismatched closing parenthesis', '1 + 2)', 'invalid'],
  ['trailing operator', '1 +', 'incomplete'],
  ['unclosed parenthesis', '(1 + 2', 'incomplete'],
  ['empty function argument', 'sin()', 'incomplete'],
  ['empty parentheses', '()', 'incomplete'],
  ['dangling exponent', '2 ^', 'incomplete'],
];

for (const [name, expression, expectedKind] of errorCases) {
  check(`rejects ${name}: ${expression || '(empty)'}`, () => {
    let thrown = null;
    try {
      evaluateExpression(expression);
    } catch (error) {
      thrown = error;
    }

    assert(thrown, `Expected a CalcError, but evaluation succeeded`);
    assert(thrown.name === 'CalcError', `Expected CalcError, received ${thrown.name}`);
    assert(thrown.kind === expectedKind, `Expected kind "${expectedKind}", received "${thrown.kind}"`);
  });
}

check('auto-close refuses unbalanced closing parentheses', () => {
  let thrown = null;
  try {
    evaluateExpression('1 + 2)', 'DEG', { autoClose: true });
  } catch (error) {
    thrown = error;
  }
  assert(thrown && thrown.kind === 'invalid', 'Expected an invalid CalcError');
});

/* ------------------------------------------------------------------ */
/* Report                                                             */
/* ------------------------------------------------------------------ */

console.log('');
console.log(`NOVA verification — ${calculatorPath}`);
console.log('');

if (failures.length === 0) {
  console.log(`  PASS  ${passed} checks passed`);
  console.log('');
  console.log('  The calculator is self-contained and the parser behaves correctly.');
  console.log('');
  process.exit(0);
}

for (const { name, error } of failures) {
  console.error(`  FAIL  ${name}`);
  console.error(`        ${error.message}`);
}

console.error('');
console.error(`  ${failures.length} of ${passed + failures.length} checks failed`);
console.error('');
process.exit(1);
