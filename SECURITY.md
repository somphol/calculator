# Security Policy

## Supported versions

NOVA is a static, single-file application. Security fixes are applied to the latest
commit on `main` and to the currently deployed GitHub Pages site.

| Version | Supported |
| --- | :---: |
| `main` / 1.x | ✅ |
| Older snapshots | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's
[private vulnerability reporting](https://github.com/somphol/calculator/security/advisories/new).
If that is unavailable, contact the maintainer via the email address on the
[GitHub profile](https://github.com/somphol).

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a minimal proof of concept.
- The browser and operating system used.
- Any suggested mitigation, if you have one.

You can expect an acknowledgment within a few days. Valid reports will be investigated,
fixed on `main`, and credited in the release notes unless you prefer to remain anonymous.

## Scope

NOVA has no server, accounts, analytics, or network calls. Relevant areas include:

- cross-site scripting through expressions, history entries, or `localStorage` values;
- parser denial of service (for example, pathological input causing runaway recursion);
- unintended data exposure from persisted history or memory;
- supply-chain risk from the build or deployment workflow.

The following are generally out of scope:

- vulnerabilities in the browser itself;
- social engineering or physical access;
- reports that require a compromised device or malicious browser extension;
- missing security headers on GitHub Pages beyond what the platform allows.

## Security design

- Expressions are parsed by a purpose-built recursive-descent parser. The shipped
  application never uses `eval()` or `new Function()`.
- The parser only recognises numbers, a fixed function whitelist, constants, and a small
  set of operators. Anything else is rejected with a `CalcError`.
- User input and saved history are rendered with `textContent`, not HTML interpolation.
- The page loads no third-party scripts, styles, fonts, or images. The favicon and icons
  are inline SVG.
- Persisted data lives in `localStorage` under the `nova.calculator.*` keys and never
  leaves the browser.
- CI runs a dependency-free verification suite on every push and pull request, and the
  Pages deployment only publishes `scientific-calculator.html` plus the social preview.
