# Contributing

Issues and pull requests are welcome.

- No build step and no dependencies: load the folder as an unpacked extension
  in `chrome://extensions` (Developer mode) to try a change.
- Run `npm test` (Node 20 or newer) before opening a pull request.
- Keep pull requests small and focused, and add a test for any change to the
  report format in `src/lib/`.
- Commit messages follow Conventional Commits (`feat: ...`, `fix: ...`).
