import React from "react";
import { Connector, RequestType, SYSTEM_CALL, MeteorSnapProvider, StorageProviderName } from "@meteor-web3/connector";

import { PageContainer } from "./styled";

import { Snap } from "@/types";
import { connectSnap, getSnap, sendHello } from "@/utils/snap";

const appId = "9aaae63f-3445-47d5-8785-c23dd16e4965";

const postModelId =
  "kjzl6hvfrbw6c8h0oiiv2ccikb2thxsu98sy0ydi6oshj6sjuz9dga94463anvf";

const postVersion = "0.0.1";

// const storageProvider: any = {
//   name: StorageProviderName.Lighthouse,
//   apiKey: "9d632fe6.e756cc9797c345dc85595a688017b226", // input your api key to call createBareFile successfully
// };

// const storageProvider: any = {
//   name: StorageProviderName.Web3Storage,
//   apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDg5NkQ1YjhCNmJBM0IwNDEzNDdlQmNDRUQzMDkxMTQ4NDc2MEZEMEIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MjgwMTQwMDg2NTgsIm5hbWUiOiJscWIifQ.jvEWmpMHWEvg49nZs1L-Rd0EOwGIGALkMwu2ng4beFY", // input your api key to call createBareFile successfully
// } as any;

const storageProvider: any = {
  name: StorageProviderName.Dataverse,
  apiKey: "test",
}

const connector = new Connector(new MeteorSnapProvider());

const requestMethod = <T extends SYSTEM_CALL>({ method, params }: {
  method: T;
  params?: RequestType[T];
}) => {
  return connector.runOS({ method, params });
};

export const Home = () => {
  const [snap, setSnap] = React.useState<Snap>();
  const [folderId, setFolderId] = React.useState<string>();
  const [fileId, setFileId] = React.useState<string>();
  const [pkh, setPkh] = React.useState<string>();
  const [address, setAddress] = React.useState<string>();

  const handleConnectSnap = async () => {
    let installedSnap = await getSnap();

    if (!installedSnap) {
      await connectSnap();
      installedSnap = await getSnap();
    }
    setSnap(installedSnap);
  };

  const connectWallet = async () => {
    // const res = await requestMethod({
    //   method: "connectWallet",
    // } as any);
    const res = await connector.connectWallet();
    setAddress(res.address);
    console.log(res);
  };

  const createCapability = async () => {
    const res = await requestMethod({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId
      },
    });
    console.log(res);
    setPkh(res.pkh)
  };

  const checkCapability = async () => {
    const res = await requestMethod({
      method: SYSTEM_CALL.checkCapability,
      params: {
        appId
      },
    });
    console.log(res);
  };

  const createFolder = async () => {
    const res = await requestMethod({
      method: SYSTEM_CALL.createFolder,
      params: {
        folderName: "Private",
      },
    });
    console.log(res);
    setFolderId(res.newFolder.folderId);
    console.log(res.newFolder.folderId);
  };

  const updateFolderBaseInfo = async () => {
    const res = await requestMethod({
      method: SYSTEM_CALL.updateFolderBaseInfo,
      params: {
        folderId: folderId!,
        folderName: new Date().toISOString(),
        folderDescription: new Date().toISOString(),
      },
    });
    console.log(res);
  };

  const loadFolderTrees = async () => {
    const folders = await requestMethod({
      method: SYSTEM_CALL.loadFolderTrees,
      params: void 0,
    });
    console.log({ folders });
    return folders;
  };

  const createFile = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: false,
      images: false,
      videos: false,
    });

    const res = await requestMethod({
      method: SYSTEM_CALL.createIndexFile,
      params: {
        modelId: postModelId,
        fileName: "create a file",
        fileContent: {
          modelVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link",
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted,
        },
      },
    });
    console.log(res);
    setFileId(res.fileContent.file.fileId);
  }

  const updateIndexFile = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: true,
      images: true,
      videos: false,
    });

    const res = await requestMethod({
      method: SYSTEM_CALL.updateIndexFile,
      params: {
        fileId: fileId!,
        fileName: "update the file",
        fileContent: {
          modelVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link",
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted,
        },
      },
    });
    console.log(res);
  };

  const loadFile = async () => {
    const file = await requestMethod({
      method: SYSTEM_CALL.loadFile,
      params: fileId!,
    });
    console.log(file);
    return file;
  };

  const loadFilesBy = async () => {
    const fileRecord = await requestMethod({
      method: SYSTEM_CALL.loadFilesBy,
      params: {
        modelId: postModelId,
        pkh,
      },
    });
    console.log(fileRecord);
  };

  const createBareFile = async (event: any) => {
    try {
      const file = event.target.files[0];
      console.log(file);
      if (!file) {
        return;
      }
      const fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileBase64: string = await new Promise(resolve => {
        reader.addEventListener("load", async (e: any) => {
          resolve(e.target.result);
        });
      });

      console.log(fileBase64);

      const res = await requestMethod({
        method: SYSTEM_CALL.createBareFile,
        params: {
          folderId,
          fileBase64,
          fileName,
          // encrypted: true,
          storageProvider,
        },
      });
      console.log(res);
      setFileId(res.newFile.fileId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateBareFile = async (event: any) => {
    try {
      const file = event.target.files[0];
      console.log(file);
      if (!file) {
        return;
      }
      const fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileBase64: string = await new Promise(resolve => {
        reader.addEventListener("load", async (e: any) => {
          resolve(e.target.result);
        });
      });

      console.log(fileBase64);

      const res = await requestMethod({
        method: SYSTEM_CALL.updateBareFile,
        params: {
          fileId: fileId!,
          fileBase64,
          fileName,
          encrypted: true,
          storageProvider,
        },
      });
      console.log(res);
      setFileId(res.currentFile.fileId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loadBareFileContent = async () => {
    try {
      const res = await requestMethod({
        method: SYSTEM_CALL.loadBareFileContent,
        params: fileId!,
      });
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageContainer>
      <button onClick={handleConnectSnap}>Connect Snap</button>
      <button onClick={connectWallet}>connectWallet</button>
      <button onClick={createCapability}>createCapability</button>
      <button onClick={checkCapability}>checkCapability</button>
      <button onClick={createFolder}>createFolder</button>
      <button onClick={updateFolderBaseInfo}>updateFolderBaseInfo</button>
      <button onClick={loadFolderTrees}>loadFolderTrees</button>
      <button onClick={createFile}>createFile</button>
      <button onClick={updateIndexFile}>updateIndexFile</button>
      <button onClick={loadFile}>loadFile</button>
      <button onClick={loadFilesBy}>loadFilesBy</button>
      <button>
        <span>createBareFile</span>
        <input
          type='file'
          onChange={createBareFile}
          name='createBareFile'
          style={{ width: "168px", marginLeft: "10px" }}
        />
      </button>
      <button>
        <span>updateBareFile</span>
        <input
          type='file'
          onChange={updateBareFile}
          name='updateBareFile'
          style={{ width: "168px", marginLeft: "10px" }}
        />
      </button>
      <button onClick={loadBareFileContent}>loadBareFileContent</button>
    </PageContainer>
  );
};
