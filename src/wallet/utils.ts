// import web3 from "web3";
// import { getAddress } from "viem";
import ethers from "ethers";

import { WALLET } from "./constants";

export function getChecksumAddress(address: string) {
  // TODO: web3 will cause error: Cannot define property ?, object is not extensible
  // return web3.utils.toChecksumAddress(address);
  // return address;
  return ethers.utils.getAddress(address);
}

export function getDefaultChain() {
  return process.env.NETWORK === "137"
    ? { chainId: 137, chainName: "polygon" }
    : { chainId: 80001, chainName: "mumbai" };
}

export const adaptChainName = ({
  wallet,
  chainName,
}: {
  wallet: WALLET;
  chainName: string;
}) => {
  if (wallet === WALLET.PARTICLE) {
    chainName = chainName === "mumbai" ? "polygon" : chainName;
    return chainName;
  }
  return chainName;
};
