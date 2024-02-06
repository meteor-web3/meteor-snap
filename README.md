# Meteor Snap

## Getting Start

Requirements:
- [MetaMask Flask](https://metamask.io/flask/) - A cryptocurrency wallet browser extension.
- [Node.js](https://nodejs.org/en/) version >= 18.
- [pnpm](https://pnpm.io/) version >= 8.

Setup the development environment and run the snap:

```shell
pnpm install
pnpm start
```

Or you want to run the snap with a demo front-end site:

```shell
pnpm install
pnpm demo
```

**Notes:**
- If you cloud not connect to Metamask Snap, and received an error like `request time out`, please check if you can open the [link](https://execution.consensys.io/3.1.0/index.html), which is used by Metamask Snap but sometimes blocked by Cloudflare because of impure IP(may be related to your proxy).

## Testing

The snap comes with some basic tests, to demonstrate how to write tests for
snaps. To test the snap, run `yarn test` in this directory. This will use
[`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest)
to run the tests in `src/index.test.ts`.
