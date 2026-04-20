# gdb-config

Small browser-based generator for `configure` commands when building GDB or the broader binutils-gdb tree.

It presents common build toggles in a form and generates a shell-ready command line with:

- compiler and linker settings
- optional `configure` flags
- debug, sanitizer, and diagnostic flags
- shell-safe quoting for paths and values

## Development

Install dependencies:

```sh
npm install
```

Build the TypeScript sources:

```sh
npm run build
```

This also prepares deploy artifacts in `build/`, including a fingerprinted
browser bundle so uploads get a new JS URL when the app changes.

Run linting:

```sh
npm run lint
```

Run tests:

```sh
npm test
```

Build and upload the static files:

```sh
npm run upload
```

The uploaded `index.html` references a content-hashed bundle name like
`index.<hash>.js`, which avoids browsers reusing a stale cached script.

## Usage

After building, open `index.html` in a browser.

Adjust the form fields and copy the generated command from the output textarea.
The browser URL updates to restore the current configuration, and the page can
copy that permalink for you.
