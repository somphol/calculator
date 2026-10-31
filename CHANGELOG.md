# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Optional calculation tape export.
- Additional accessibility and screen-reader refinements.

## [1.0.0] - 2026-10-31

### Added

- Single-file scientific calculator with a glassmorphism interface.
- Standard and scientific keypads with a responsive layout.
- Safe recursive-descent expression parser with no `eval()` or `new Function()`.
- Arithmetic, powers, factorial, percent, implicit multiplication, and parentheses.
- `sin`, `cos`, `tan`, `log`, `ln`, and `sqrt` functions with degree/radian modes.
- Constants `π` and `e`, plus scientific-notation input.
- Persistent memory controls: `MC`, `MR`, `M+`, and `M−`.
- Persistent calculation history with reusable expressions and results.
- Full keyboard support, clipboard copy, and accessible live status messages.
- Automatic parenthesis closing on evaluation and clear, human-readable errors.
- Dependency-free verification script with 60 structure, safety, and parser checks.
- GitHub Actions continuous integration and GitHub Pages deployment.
- Professional repository documentation, templates, and community guidelines.

[Unreleased]: https://github.com/somphol/calculator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/somphol/calculator/releases/tag/v1.0.0
