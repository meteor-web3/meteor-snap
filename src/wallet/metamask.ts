import { DataverseKernel } from "@dataverse/dataverse-kernel";
import { Listener } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";

import { EIP155, WALLET } from "./constants";
import { PROVIDER, SIGNER, WalletBaseInfo, WalletMethods } from "./types";
import { getChecksumAddress } from "./utils";

export class MetaMask implements WalletBaseInfo, WalletMethods {
  wallet = WALLET.METAMASK;
  provider?: PROVIDER;
  signer?: SIGNER;
  address?: string;
  namespace?: string;
  reference?: string;
  onChainChangedBinder?: Listener;
  onAccountsChangedBinder?: Listener;
  ethereum: any;

  constructor(ethereum: any) {
    this.ethereum = ethereum;
    this.onChainChangedBinder = this.onChainChanged.bind(this);
    this.onAccountsChangedBinder = this.onAccountsChanged.bind(this);
    console.log("MetaMask", { ethereum, on: ethereum.on });
    // eslint-disable-next-line no-debugger
    // TODO: will cause error: Cannot define property _event, object is not extensible
    // ethereum.on("chainChanged", this.onChainChangedBinder);
    // ethereum.on("accountsChanged", this.onAccountsChangedBinder);
    console.log("MetaMask init finished.");
  }

  async connect(): Promise<Required<Omit<WalletBaseInfo, "userInfo">>> {
    const ethereum = this.ethereum;
    const provider = new ethers.providers.Web3Provider(ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const { chainId } = await provider.getNetwork();
    this.provider = provider;
    this.signer = signer;
    this.address = address;
    this.namespace = EIP155;
    this.reference = String(chainId);

    return {
      wallet: this.wallet,
      provider,
      signer,
      address,
      namespace: this.namespace,
      reference: this.reference,
    };
  }

  async requestPermissions(): Promise<string[]> {
    let provider = this.provider as ethers.providers.Web3Provider;
    let noProviderFlag = false;
    let addressList = [];
    if (!provider) {
      noProviderFlag = true;
      addressList = await this.ethereum.request?.({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const res = await this.connect();
      provider = res.provider as ethers.providers.Web3Provider;
    }
    const ethereum = provider.provider;

    if (!provider || !ethereum) {
      DataverseKernel.instance.exception.advancedException.assertCheckProviderIsInitialized();
    }

    if (!noProviderFlag) {
      addressList = await ethereum?.request?.({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    }

    this.signer = provider.getSigner();
    this.address = getChecksumAddress(ethereum["selectedAddress"]);

    return Promise.all(
      addressList?.[0]?.caveats?.[0]?.value.map((address: string) =>
        getChecksumAddress(address),
      ),
    );
  }

  // async switchNetwork(chainId: number) {
  //   const chainIdHex = `0x${chainId.toString(16)}`;
  //   const provider = this.provider as ethers.providers.Web3Provider;
  //   const ethereum = provider.provider;
  //   try {
  //     await ethereum.request?.({
  //       method: "wallet_switchEthereumChain",
  //       params: [{ chainId: chainIdHex }],
  //     });

  //     this.reference = String(chainId);
  //     const newProvider = new ethers.providers.Web3Provider(
  //       this.ethereum,
  //       "any",
  //     );
  //     this.provider = newProvider;
  //     this.signer = newProvider.getSigner();
  //   } catch (error: any) {
  //     console.log(error);
  //     // error code 4902 说明用户钱包里没有该网络，需要添加进去
  //     if (error.code === 4902) {
  //       if (chainIdHex === "0x89") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0x89",
  //               chainName: "Polygon Mainnet",
  //               rpcUrls: ["https://polygon-rpc.com"],
  //               nativeCurrency: {
  //                 name: "MATIC",
  //                 symbol: "MATIC",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://polygonscan.com"],
  //             },
  //           ],
  //         });
  //       } else if (chainIdHex === "0x13881") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0x13881",
  //               chainName: "Mumbai",
  //               rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
  //               nativeCurrency: {
  //                 name: "MATIC",
  //                 symbol: "MATIC",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://mumbai.polygonscan.com"],
  //             },
  //           ],
  //         });
  //       } else if (chainIdHex === "0x13a") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0x13a",
  //               chainName: "Filecoin - Mainnet",
  //               rpcUrls: ["https://api.node.glif.io"],
  //               nativeCurrency: {
  //                 name: "FIL",
  //                 symbol: "FIL",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://filfox.info"],
  //             },
  //           ],
  //         });
  //       } else if (chainIdHex === "0xc45") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0xc45",
  //               chainName: "Filecoin - Hyperspace testnet",
  //               rpcUrls: ["https://filecoin-hyperspace.chainup.net/rpc/v1"],
  //               nativeCurrency: {
  //                 name: "tFIL",
  //                 symbol: "tFIL",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://hyperspace.filfox.info"],
  //             },
  //           ],
  //         });
  //       } else if (chainIdHex === "0x38") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0x38",
  //               chainName: "Binance Smart Chain Mainnet",
  //               rpcUrls: ["https://bsc-dataseed.binance.org"],
  //               nativeCurrency: {
  //                 name: "BNB",
  //                 symbol: "BNB",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://bscscan.com"],
  //             },
  //           ],
  //         });
  //       } else if (chainIdHex === "0x61") {
  //         await ethereum.request?.({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0x61",
  //               chainName: "Binance Smart Chain Testnet",
  //               rpcUrls: [
  //                 "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  //               ],
  //               nativeCurrency: {
  //                 name: "tBNB",
  //                 symbol: "tBNB",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://testnet.bscscan.com"],
  //             },
  //           ],
  //         });
  //       } else {
  //         DataverseKernel.instance.exception.advancedException.assertUnrecognizedChainID();
  //       }
  //     } else {
  //       throw error;
  //     }
  //   }
  // }

  async switchNetwork(chainId: number) {
    console.log({ chainId });
    return;
  }

  async ethereumRequest({ method, params }: { method: string; params: any }) {
    const provider = this.provider as ethers.providers.Web3Provider;
    const ethereum = provider.provider;
    if (method === "wallet_requestPermissions") {
      return this.requestPermissions();
    } else if (method === "wallet_switchEthereumChain") {
      return this.switchNetwork(Number(params?.[0]?.chainId));
    } else {
      const res = await ethereum.request?.({
        method,
        params,
      });
      return res;
    }
  }

  async onChainChanged(networkIDstring: string) {
    console.log({ networkIDstring });
    this.reference = String(Number(networkIDstring));
    this.provider = new ethers.providers.Web3Provider(this.ethereum, "any");
    this.signer = (this.provider as ethers.providers.Web3Provider).getSigner();
    // TODO: fix it
    // DataverseKernel.instance.eventListener.communicatorFromBackgroundToOthers.sendMessageToAllTabs(
    //   {
    //     type: "request",
    //     method: "chainChanged",
    //     params: {
    //       chain:
    //         await DataverseKernel.instance.kernel.core.sysBuildChainByChainId({
    //           chainId: Number(networkIDstring),
    //         }),
    //       wallet: this.wallet,
    //     },
    //   },
    // );
  }

  async onAccountsChanged(accounts: Array<string>) {
    console.log({ accounts });
    this.address = accounts[0];
    const provider = new ethers.providers.Web3Provider(this.ethereum, "any");
    this.provider = provider;
    this.signer = provider.getSigner();
    // TODO: fix it
    // DataverseKernel.instance.eventListener.communicatorFromBackgroundToOthers.sendMessageToAllTabs(
    //   {
    //     type: "request",
    //     method: "accountsChanged",
    //     params: {
    //       accounts: accounts.map(account => getChecksumAddress(account)),
    //       wallet: this.wallet,
    //     },
    //   },
    // );
  }
}
