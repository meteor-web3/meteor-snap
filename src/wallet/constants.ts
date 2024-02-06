export const DATAVERSE_API = "https://gateway.dataverse.art/v1";

export const EIP155 = "eip155";
export const TEZOS = "tezos";

export enum WALLET {
  METAMASK = "MetaMask",
  WALLETCONNECT = "WalletConnect",
  COINBASE = "Coinbase",
  PARTICLE = "Particle",
  EXTERNAL_WALLET = "ExternalWallet",
}

export const CRYPTO_WALLETS = [
  WALLET.METAMASK,
  WALLET.WALLETCONNECT,
  WALLET.COINBASE,
  WALLET.PARTICLE,
  WALLET.EXTERNAL_WALLET,
];

export const WALLET_NAME_TO_CLASS_NAME = {
  [WALLET.METAMASK]: "metamask",
  [WALLET.WALLETCONNECT]: "walletConnect",
  [WALLET.COINBASE]: "coinbase",
  [WALLET.PARTICLE]: "particle",
  [WALLET.EXTERNAL_WALLET]: "externalWallet",
};

// export const NAMESPACE_TO_WALLET = {
//   [EIP155]: { name: METAMASK, type: CRYPTO_WALLET_TYPE },
//   [TEZOS]: { name: TEMPLE, type: CRYPTO_WALLET_TYPE },
// };
