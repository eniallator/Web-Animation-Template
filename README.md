# Web-Animation-Template

My template repository for creating web animations

## Installation

This repository uses Node version `v18.17.1`. Once you have this installed, make sure you also install `yarn` globally, with

```properties
npm install yarn -G
```

Once you have this installed, run

```properties
yarn
```

This will install the needed dependencies.

## Available Scripts

In the project directory, you can run:

### `yarn build`

Builds the `src` directory into `dist/bundle.js` using webpack.

### `yarn watch`

Watches for changes inside your src directory, and then rebuilds `dist/bundle.js` on change.\
Also launches browser-sync, so your browser will update with any changes.

### `yarn findissues`

Runs both `yarn typecheck` (runs `tsc`) as well as `yarn lint` (runs eslint for any typescript files inside the `src` directory).

### `yarn deploy`

Deploys the project using the [gh-pages npm package](https://www.npmjs.com/package/gh-pages).
