# Contributing to NOVA

Thanks for taking the time to contribute. NOVA is intentionally small: one HTML file,
no dependencies, and no build step. Keeping it that way is part of the design.

## Ways to contribute

- Report a reproducible bug.
- Suggest a feature that fits the single-file philosophy.
- Improve documentation, screenshots, or examples.
- Fix an accessibility issue.
- Add parser test cases for edge cases that are currently untested.

For security issues, do **not** open a public issue. Follow [SECURITY.md](SECURITY.md).

## Before you start

- Check the [issue tracker](https://github.com/somphol/calculator/issues) for existing
  reports and discussions.
- For a substantial change, open an issue first so we can agree on the approach.
- Keep pull requests focused. One logical change per pull request is easiest to review.

## Development workflow

There is nothing to install. Clone the repository and open the HTML file:

```bash
git clone https://github.com/somphol/calculator.git
cd calculator

# run the verification suite
node scripts/verify.mjs
# or
deno run --allow-read scripts/verify.mjs

# open the app
open scientific-calculator.html
```

A local HTTP server is optional but useful when testing clipboard behaviour, because
clipboard permissions behave differently on `file://` URLs:

```bash
python3 -m http.server 8080
# visit http://localhost:8080/scientific-calculator.html
```

## Project constraints

Please preserve these properties:

1. **One file.** The application must remain a single self-contained
   `scientific-calculator.html`. Do not add a build step, package manager, or runtime
   dependency.
2. **No external requests.** No CDN links, remote fonts, analytics, images, or network
   calls. Icons and the favicon are inline SVG.
3. **No dynamic code execution.** Do not introduce `eval()`, `new Function()`, or
   `innerHTML` for user-provided expressions. The parser is the boundary.
4. **Progressive enhancement.** The calculator should remain usable when storage is
   unavailable or a modern CSS feature is unsupported.
5. **Accessibility.** Keep keyboard paths, focus styles, labels, and live regions intact.

## Changing the parser

The parser is delimited by `/* ===== SAFE PARSER START ===== */` and
`/* ===== SAFE PARSER END ===== */`. The verifier extracts that block and runs it in
isolation.

If you change parsing or evaluation behaviour:

- Add or update cases in `scripts/verify.mjs`.
- Cover the success value **and** the error kind (`empty`, `invalid`, `incomplete`, `math`).
- Consider precedence, associativity, and unary edge cases.
- Keep error messages human-readable.

Run `node scripts/verify.mjs` before pushing. CI runs the same suite.

## Style guidelines

- Two-space indentation, single quotes, semicolons in JavaScript.
- Prefer small, named functions over long event handlers.
- Use CSS custom properties from `:root` instead of introducing one-off colours.
- Match the existing naming and formatting; do not reformat unrelated code.
- Keep comments for intent and non-obvious trade-offs, not for restating code.
- Use sentence case for UI labels and plain language for errors.

An [EditorConfig](.editorconfig) file is included for consistent whitespace.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add hyperbolic functions
fix: keep percent postfix after factorial
docs: clarify keyboard shortcuts
test: cover nested auto-closing parentheses
chore: update Pages workflow
```

## Pull request checklist

- [ ] The change stays within the single-file, zero-dependency constraint.
- [ ] `node scripts/verify.mjs` passes.
- [ ] New parser behaviour has tests, including failure cases.
- [ ] UI changes were checked at desktop and mobile widths.
- [ ] Keyboard navigation and focus states still work.
- [ ] Documentation is updated when behaviour or shortcuts change.
- [ ] The pull request description explains the problem and the chosen solution.

## Review process

A maintainer will review as soon as possible. Expect questions about edge cases,
accessibility, and whether a feature belongs in the core file or in a fork. Small,
well-tested changes usually land quickly.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
