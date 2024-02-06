<br/>
<p align="center">
<a href=" " target="_blank">
<img src="https://avatars.githubusercontent.com/u/118692557?s=200&v=4" width="180" alt="Meteor logo">
</a >
</p >
<br/>

## Introduction
MetaMask Snap is an open source system that allows anyone to safely extend the functionality of MetaMask, creating new web3 end user experiences. Based on this, We integrated dataverse-kernel into metamask-snap, using the metamask provider as the Ethereum connector by default. At the same time, it exposed system call methods including file system management and other system call methods. For specific call methods, see demo.

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
It will run on localhost:8080 by default.

If you want to run the snap with a demo front-end site:

```shell
pnpm demo
```

Furthermore, if you want to compile this snap:
```shell
pnpm build
```
The dist package will be generated in the root directory.

**Notes:**
- If you cloud not connect to Metamask Snap, and received an error like `request time out`, please check if you can open the [link](https://execution.consensys.io/3.1.0/index.html), which is used by Metamask Snap but sometimes blocked by Cloudflare because of impure IP(may be related to your proxy).

## Testing

The snap comes with some basic tests, to demonstrate how to write tests for
snaps. To test the snap, run `yarn test` in this directory. This will use
[`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest)
to run the tests in `src/index.test.ts`.
