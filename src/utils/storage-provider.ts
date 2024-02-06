import { ILocalStorageProvider } from "@dataverse/dataverse-kernel";

export class SnapStorageProvider implements ILocalStorageProvider {
  async setItem(key: string, val: any) {
    const oldState = await snap.request({
      method: "snap_manageState",
      params: {
        operation: "get",
      },
    });
    console.log("snap-set: ", { oldState, key, val });
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: {
          ...oldState,
          [key]: val,
        },
      },
    });
  }
  async getItem(key: string) {
    const state = await snap.request({
      method: "snap_manageState",
      params: {
        operation: "get",
      },
    });
    console.log("snap-get: ", { state, item: state?.[key] });
    return state?.[key];
  }
  async getKeys() {
    return Object.keys(
      await snap.request({
        method: "snap_manageState",
        params: {
          operation: "get",
        },
      }),
    );
  }
  async removeItem(key: string) {
    const oldState = await snap.request({
      method: "snap_manageState",
      params: {
        operation: "get",
      },
    });
    console.log({ oldState, key });
    delete oldState[key];
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: oldState,
      },
    });
  }
  async clear() {
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "clear",
      },
    });
  }
}
