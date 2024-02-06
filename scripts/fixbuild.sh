target_dir='./node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.d.ts & test -e $target_dir/ceramic-http-client.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.d.ts...'
cp ./scripts/patch/ceramic-http-client.d.ts $target_dir/ceramic-http-client.d.ts
fi

target_dir='./node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.js & test -e $target_dir/ceramic-http-client.js
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.js...'
cp ./scripts/patch/ceramic-http-client.js $target_dir/ceramic-http-client.js
fi

target_dir='./node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.js & test -e $target_dir/document.js
then
echo 'replace @ceramicnetwork/http-client/lib/document.js...'
cp ./scripts/patch/document.js $target_dir/document.js
fi

target_dir='./node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.d.ts & test -e $target_dir/document.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/document.d.ts...'
cp ./scripts/patch/document.d.ts $target_dir/document.d.ts
fi

target_dir='./node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.d.ts & test -e $target_dir/model-instance-document.d.ts
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.d.ts...'
cp ./scripts/patch/model-instance-document.d.ts $target_dir/model-instance-document.d.ts
fi

target_dir='./node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.js & test -e $target_dir/model-instance-document.js
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.js...'
cp ./scripts/patch/model-instance-document.js $target_dir/model-instance-document.js
fi

target_dir='./node_modules/metamask-extension-provider'
if test -e ./scripts/patch/index.js & test -e $target_dir/index.js
then
echo 'replace metamask-extension-provider/index...'
cp ./scripts/patch/index.js $target_dir/index.js
fi

target_dir='./node_modules/tls-browserify'
if test -e ./scripts/patch/tls-browserify/index.js & test -e $target_dir/index.js
then
echo 'replace tls-browserify/index...'
cp ./scripts/patch/tls-browserify/index.js $target_dir/index.js
fi

target_dir='./node_modules/blob-polyfill'
if test -e ./scripts/patch/blob-polyfill/Blob.js & test -e $target_dir/Blob.js
then
echo 'replace blob-polyfill/Blob.js...'
cp ./scripts/patch/blob-polyfill/Blob.js $target_dir/Blob.js
fi

target_dir='./node_modules/@lit-protocol/lit-node-client-nodejs/src/lib/'
if test -e ./scripts/patch/lit-node-client-nodejs.js & test -e $target_dir/lit-node-client-nodejs.js
then
echo 'replace @lit-protocol/lit-node-client-nodejs/src/lib/lit-node-client-nodejs...'
cp ./scripts/patch/lit-node-client-nodejs.js $target_dir/lit-node-client-nodejs.js
fi

target_dir='./node_modules/@lit-protocol/uint8arrays/src/lib/'
if test -e ./scripts/patch/uint8arrays.js & test -e $target_dir/uint8arrays.js
then
echo 'replace @lit-protocol/uint8arrays/src/lib/uint8arrays...'
cp ./scripts/patch/uint8arrays.js $target_dir/uint8arrays.js
fi


# fix pnpm link
target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.d.ts & test -e $target_dir/ceramic-http-client.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.d.ts...'
cp ./scripts/patch/ceramic-http-client.d.ts $target_dir/ceramic-http-client.d.ts
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.js & test -e $target_dir/ceramic-http-client.js
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.js...'
cp ./scripts/patch/ceramic-http-client.js $target_dir/ceramic-http-client.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.js & test -e $target_dir/document.js
then
echo 'replace @ceramicnetwork/http-client/lib/document.js...'
cp ./scripts/patch/document.js $target_dir/document.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.d.ts & test -e $target_dir/document.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/document.d.ts...'
cp ./scripts/patch/document.d.ts $target_dir/document.d.ts
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.d.ts & test -e $target_dir/model-instance-document.d.ts
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.d.ts...'
cp ./scripts/patch/model-instance-document.d.ts $target_dir/model-instance-document.d.ts
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.js & test -e $target_dir/model-instance-document.js
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.js...'
cp ./scripts/patch/model-instance-document.js $target_dir/model-instance-document.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/metamask-extension-provider'
if test -e ./scripts/patch/index.js & test -e $target_dir/index.js
then
echo 'replace metamask-extension-provider/index...'
cp ./scripts/patch/index.js $target_dir/index.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/web3-core-requestmanager@1.7.0/node_modules/web3-core-requestmanager/src'
if test -e ./scripts/patch/web3-core-requestmanager/givenProvider.js & test -e $target_dir/givenProvider.js
then
echo 'replace web3-core-requestmanager/givenProvider.js...'
cp ./scripts/patch/web3-core-requestmanager/givenProvider.js $target_dir/givenProvider.js
fi
target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/web3-core-requestmanager@1.7.0/node_modules/web3-core-requestmanager/lib'
if test -e ./scripts/patch/web3-core-requestmanager/givenProvider.js & test -e $target_dir/givenProvider.js
then
echo 'replace web3-core-requestmanager/lib/givenProvider.js...'
cp ./scripts/patch/web3-core-requestmanager/lib/givenProvider.js $target_dir/givenProvider.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/cross-fetch@3.1.8/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js & test -e $target_dir/browser-polyfill.js
then
echo 'replace cross-fetch@3.1.8/dist/browser-polyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js $target_dir/browser-polyfill.js
fi
target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/cross-fetch@3.1.8/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js & test -e $target_dir/browser-ponyfill.js
then
echo 'replace cross-fetch@3.1.8/dist/browser-ponyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js $target_dir/browser-ponyfill.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/@lit-protocol+nacl@2.2.61/node_modules/@lit-protocol/nacl/src/lib'
if test -e ./scripts/patch/@lit-protocol+nacl@2.2.61/lib/nacl.js & test -e $target_dir/nacl.js
then
echo 'replace @lit-protocol+nacl@2.2.61/lib/nacl.js...'
cp ./scripts/patch/@lit-protocol+nacl@2.2.61/lib/nacl.js $target_dir/nacl.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/@lit-protocol+lit-node-client-nodejs@2.1.160_@ethersproject+contracts@5.7.0_@ethersproject+ha_u7bjz54hvmqah5ondnxpgaqctq/node_modules/@lit-protocol/lit-node-client-nodejs/src/lib/'
if test -e ./scripts/patch/lit-node-client-nodejs.js & test -e $target_dir/lit-node-client-nodejs.js
then
echo 'replace @lit-protocol/lit-node-client-nodejs/src/lib/lit-node-client-nodejs...'
cp ./scripts/patch/lit-node-client-nodejs.js $target_dir/lit-node-client-nodejs.js
fi

target_dir='./node_modules/@dataverse/dataverse-kernel/node_modules/.pnpm/@lit-protocol+lit-node-client-nodejs@2.1.160_@ethersproject+contracts@5.7.0_@ethersproject+ha_u7bjz54hvmqah5ondnxpgaqctq/node_modules/@lit-protocol/uint8arrays/src/lib/'
if test -e ./scripts/patch/uint8arrays.js & test -e $target_dir/uint8arrays.js
then
echo 'replace @lit-protocol/uint8arrays/src/lib/uint8arrays...'
cp ./scripts/patch/uint8arrays.js $target_dir/uint8arrays.js
fi


# fix pnpm install
target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.d.ts & test -e $target_dir/ceramic-http-client.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.d.ts...'
cp ./scripts/patch/ceramic-http-client.d.ts $target_dir/ceramic-http-client.d.ts
fi

target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/ceramic-http-client.js & test -e $target_dir/ceramic-http-client.js
then
echo 'replace @ceramicnetwork/http-client/lib/ceramic-http-client.js...'
cp ./scripts/patch/ceramic-http-client.js $target_dir/ceramic-http-client.js
fi

target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.js & test -e $target_dir/document.js
then
echo 'replace @ceramicnetwork/http-client/lib/document.js...'
cp ./scripts/patch/document.js $target_dir/document.js
fi

target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/http-client/lib/'
if test -e ./scripts/patch/document.d.ts & test -e $target_dir/document.d.ts
then
echo 'replace @ceramicnetwork/http-client/lib/document.d.ts...'
cp ./scripts/patch/document.d.ts $target_dir/document.d.ts
fi

target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.d.ts & test -e $target_dir/model-instance-document.d.ts
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.d.ts...'
cp ./scripts/patch/model-instance-document.d.ts $target_dir/model-instance-document.d.ts
fi

target_dir='./node_modules/.pnpm/@ceramicnetwork+http-client@3.4.1_typescript@4.7.4/node_modules/@ceramicnetwork/stream-model-instance/lib/'
if test -e ./scripts/patch/model-instance-document.js & test -e $target_dir/model-instance-document.js
then
echo 'replace @ceramicnetwork/stream-model-instance/lib/model-instance-document.js...'
cp ./scripts/patch/model-instance-document.js $target_dir/model-instance-document.js
fi

target_dir='./node_modules/.pnpm/web3-core-requestmanager@1.7.0/node_modules/web3-core-requestmanager/src'
if test -e ./scripts/patch/web3-core-requestmanager/givenProvider.js & test -e $target_dir/givenProvider.js
then
echo 'replace web3-core-requestmanager/givenProvider.js...'
cp ./scripts/patch/web3-core-requestmanager/givenProvider.js $target_dir/givenProvider.js
fi
target_dir='./node_modules/.pnpm/web3-core-requestmanager@1.7.0/node_modules/web3-core-requestmanager/lib'
if test -e ./scripts/patch/web3-core-requestmanager/givenProvider.js & test -e $target_dir/givenProvider.js
then
echo 'replace web3-core-requestmanager/lib/givenProvider.js...'
cp ./scripts/patch/web3-core-requestmanager/lib/givenProvider.js $target_dir/givenProvider.js
fi

target_dir='./node_modules/.pnpm/cross-fetch@3.1.8/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js & test -e $target_dir/browser-polyfill.js
then
echo 'replace cross-fetch@3.1.8/dist/browser-polyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js $target_dir/browser-polyfill.js
fi
target_dir='./node_modules/.pnpm/cross-fetch@3.1.8/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js & test -e $target_dir/browser-ponyfill.js
then
echo 'replace cross-fetch@3.1.8/dist/browser-ponyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js $target_dir/browser-ponyfill.js
fi
target_dir='./node_modules/.pnpm/cross-fetch@3.1.8_encoding@0.1.13/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js & test -e $target_dir/browser-polyfill.js
then
echo 'replace cross-fetch@3.1.8_encoding@0.1.13/dist/browser-polyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-polyfill.js $target_dir/browser-polyfill.js
fi
target_dir='./node_modules/.pnpm/cross-fetch@3.1.8_encoding@0.1.13/node_modules/cross-fetch/dist'
if test -e ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js & test -e $target_dir/browser-ponyfill.js
then
echo 'replace cross-fetch@3.1.8_encoding@0.1.13/dist/browser-ponyfill.js...'
cp ./scripts/patch/cross-fetch@3.1.8/browser-ponyfill.js $target_dir/browser-ponyfill.js
fi

target_dir='./node_modules/.pnpm/@lit-protocol+nacl@2.2.61/node_modules/@lit-protocol/nacl/src/lib'
if test -e ./scripts/patch/@lit-protocol+nacl@2.2.61/lib/nacl.js & test -e $target_dir/nacl.js
then
echo 'replace @lit-protocol+nacl@2.2.61/lib/nacl.js...'
cp ./scripts/patch/@lit-protocol+nacl@2.2.61/lib/nacl.js $target_dir/nacl.js
fi
target_dir='./node_modules/.pnpm/@lit-protocol+nacl@3.0.27/node_modules/@lit-protocol/nacl/src/lib'
if test -e ./scripts/patch/@lit-protocol+nacl@3.0.27/lib/nacl.js & test -e $target_dir/nacl.js
then
echo 'replace @lit-protocol+nacl@3.0.27/lib/nacl.js...'
cp ./scripts/patch/@lit-protocol+nacl@3.0.27/lib/nacl.js $target_dir/nacl.js
fi

target_dir='./node_modules/.pnpm/node_modules/@lit-protocol/core/src/lib'
if test -e ./scripts/patch/lit-core.js & test -e $target_dir/lit-core.js
then
echo 'replace @lit-protocol/core/src/lib/lit-core.js...'
cp ./scripts/patch/lit-core.js $target_dir/lit-core.js
fi

target_dir='./node_modules/.pnpm/node_modules/@lit-protocol/uint8arrays/src/lib'
if test -e ./scripts/patch/uint8arrays.js & test -e $target_dir/uint8arrays.js
then
echo 'replace @lit-protocol/uint8arrays/src/lib/uint8arrays...'
cp ./scripts/patch/uint8arrays.js $target_dir/uint8arrays.js
fi