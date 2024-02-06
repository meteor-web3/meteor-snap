import {
  DataverseKernel,
  StorageProvider,
  StorageProviderName,
} from "@dataverse/dataverse-kernel";
import { OnInstallHandler, OnRpcRequestHandler } from "@metamask/snaps-types";

import { CORRECT_CODE, UNKNOWN_CODE } from "./constants";
import { MetaMask } from "./crypto-wallet/metamask";
import { deepFind } from "./utils";
import { SnapStorageProvider } from "./utils/storage-provider";

console.log("init walletInstance...");
const walletInstance = new MetaMask((globalThis as any).ethereum);

console.log("init snapStorageProvider...");
const snapStorageProvider = new SnapStorageProvider();

try {
  if (!DataverseKernel.instance) {
    console.log("init DataverseKernel...");
    DataverseKernel.init({
      localStorageProvider: snapStorageProvider,
    });
  }
  if (!globalThis.crypto) {
    throw new Error("globalThis.crypto has been tampered with.");
  }
} catch (e) {
  console.warn(e);
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  let result: { code: string; result?: any; error?: string };
  let params: any = request.params;
  try {
    console.log("received request", { request, origin });
    // preprocess request.params
    if (
      params &&
      Object.keys(params).length === 1 &&
      Object.keys(params)[0] === "__PARAM__"
    ) {
      params = params.__PARAM__;
    }
    if (request.method.startsWith("ETHEREUM_REQUEST_")) {
      // use ethereum to handle request
      if (!walletInstance.provider) {
        // connect wallet first
        await walletInstance.connect();
      }
      const res = await walletInstance.ethereumRequest({
        method: request.method.split("ETHEREUM_REQUEST_")[1],
        params,
      });
      result = { code: CORRECT_CODE, result: res };
    } else {
      // check the IPFSProvider, Only DataverseIPFS can be supported in Snap
      const storageProvider: StorageProvider = deepFind(
        params,
        "storageProvider",
      );
      if (storageProvider !== undefined) {
        console.log({ storageProviderName: storageProvider });
      }
      if (
        storageProvider !== undefined &&
        storageProvider.name !== StorageProviderName.Dataverse
      ) {
        throw new Error(
          "Only DataverseIPFS can be supported in Snap, Please use Dataverse as StorageProvider.",
        );
      }
      // forward to kernel for execution
      let res: any;
      if (request.method === "connectWallet") {
        // only MetaMask's walletInstance is supported in Snap
        res = await DataverseKernel.instance.eventListener.connectWallet(
          {
            ...params,
            walletInstance,
          },
          { origin },
        );
      } else {
        // check if connected wallet
        const currentWallet =
          await DataverseKernel.instance.drivers.cryptoWallet.hostWallet.getCurrentWalletByHost(
            origin,
          );
        if (!currentWallet) {
          // connect wallet first
          await DataverseKernel.instance.eventListener.connectWallet(
            {
              walletInstance,
            },
            { origin },
          );
        }
        res = await DataverseKernel.instance.eventListener[request.method](
          params,
          {
            origin,
          },
        );
      }
      result = { code: CORRECT_CODE, result: res };
    }
  } catch (error) {
    result = {
      code: error?.code || UNKNOWN_CODE,
      error: error?.msg || error?.message,
    };
  }
  console.log("response", { result });
  return JSON.parse(JSON.stringify(result));
  // switch (request.method) {
  //   case "hello":
  //     console.log({ globalThis, ethereum: (globalThis as any).ethereum });
  //     return snap.request({
  //       method: "snap_dialog",
  //       params: {
  //         type: "confirmation",
  //         content: panel([
  //           text(`Hello, **${origin}**!`),
  //           text("This custom confirmation is just for display purposes."),
  //           text(
  //             "But you can edit the snap source code to make it do something, if you want to!",
  //           ),
  //         ]),
  //       },
  //     });
  //   default:
  //     throw new Error("Method not found.");
  // }
};

// export const onInstall: OnInstallHandler = async () => {};
