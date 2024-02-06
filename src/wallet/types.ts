import { ethers } from "ethers";

import { WALLET } from "./constants";

export type PROVIDER =
  | ethers.providers.Web3Provider
  | ethers.providers.BaseProvider;
export type SIGNER = ethers.providers.JsonRpcSigner | ethers.Wallet;

export interface WalletBaseInfo {
  wallet?: WALLET;
  provider?: PROVIDER;
  signer?: SIGNER;
  address?: string;
  namespace?: string;
  reference?: string;
}

export interface WalletMethods {
  connect(domain?: string): Promise<{
    provider: PROVIDER;
    signer: SIGNER;
    address: string;
    namespace: string;
    reference: string;
  }>;
  requestPermissions(domain?: string): Promise<string[]>;
  switchNetwork(chainId: number): void;
}

export interface EthereumProviderEip1193 {
  on: (event: string, callback: () => void) => void;
  isConnected: () => boolean;
  request: (args: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<unknown>;
  selectedAddress: string;
}

export interface Chain {
  chainId: number;
  chainName: string;
}
