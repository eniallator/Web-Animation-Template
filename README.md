# Web-Animation-Template

My template repository for creating web animations

## Installation

This repository uses Node version `v18.17.1`. Once you have this installed, make sure you also install `pnpm` globally, with

```properties
npm install -g pnpm
```

Once you have this installed, run

```properties
pnpm install
```

This will install the needed dependencies.

## Available Scripts

In the project directory, you can run:

### `pnpm build`

Builds the `src` directory into `dist/bundle.js` using webpack.

### `pnpm watch`

Watches for changes inside your src directory, and then rebuilds `dist/bundle.js` on change.\
Also launches browser-sync, so your browser will update with any changes.

### `pnpm findissues`

Runs `pnpm typecheck` (runs `tsc`), `pnpm lint` (runs oxlint for any typescript files inside the `src` directory), and `pnpm format:check` (runs prettier).

### `pnpm run deploy`

Deploys the project using the [gh-pages npm package](https://www.npmjs.com/package/gh-pages).
