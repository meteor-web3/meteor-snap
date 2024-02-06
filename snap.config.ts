import { resolve, join } from "path";

import { merge, type SnapConfig } from "@metamask/snaps-cli";
import Dotenv from "dotenv-webpack";
import webpack, { Configuration } from "webpack";

const config: SnapConfig = {
  bundler: "webpack",
  input: resolve(__dirname, "src/index.ts"),
  server: {
    port: 8080,
  },
  // polyfills: {
  //   assert: true,
  //   buffer: true,
  //   crypto: true,
  //   https: true,
  //   url: true,
  //   os: true,
  //   http: true,
  //   stream: true,
  //   path: true,
  //   // process: true,
  //   zlib: true,
  //   util: true,
  //   events: true,
  //   punycode: true,
  //   string_decoder: true,
  //   querystring: true,
  // },
  // sourceMap: false,
  customizeWebpackConfig: config => {
    const rules = config.module?.rules;
    if (Array.isArray(rules)) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (
          typeof rule === "object" &&
          typeof rule?.use === "object" &&
          "loader" in rule.use &&
          rule.use.loader?.includes("swc-loader") &&
          typeof rule.use.options !== "string"
        ) {
          // rule.use.options = {
          //   ...rule.use.options,
          //   sourceMaps: true,
          // };
          rules[i] = rule;
        }
      }
    }
    const mergedConfig = merge<Configuration>(
      {
        ...config,
        plugins: [],
        module: {
          ...config.module,
          rules,
        },
      },
      {
        mode: "development",
        // devtool: "eval-source-map",
        output: {
          clean: true,
        },
        externals: {
          "@lit-protocol/sdk-nodejs": "LitProtocolSdkNodejs",
          // "@dataverse/communicator": "communicator",
        },
        resolve: {
          // fallback: {
          //   process: require.resolve("process/browser"),
          //   fs: require.resolve("browserify-fs"),
          //   worker_threads: require.resolve("webworkify"),
          //   net: require.resolve("net-browserify"),
          //   tls: require.resolve("tls-browserify"),
          //   async_hooks: require.resolve("async-hook-browser"),
          //   // core: join(__dirname, "core"),
          // },
          fallback: {
            assert: resolve("./", "node_modules/assert"),
            buffer: require.resolve("buffer"),
            // crypto: require.resolve("crypto-browserify"),
            https: require.resolve("https-browserify"),
            url: false,
            os: require.resolve("os-browserify/browser"),
            http: require.resolve("stream-http"),
            stream: require.resolve("stream-browserify"),
            path: require.resolve("path-browserify"),
            process: require.resolve("process/browser"),
            core: join(__dirname, "core"),
            fs: false,
            zlib: false,
          },
        },
        plugins: (
          [
            new webpack.ProvidePlugin({
              process: resolve("./", "node_modules/process/browser.js"),
              Buffer: ["buffer", "Buffer"],
              window: [resolve("./", "polyfill/window.js"), "window"],
              localStorage: [
                resolve("./", "polyfill/localStorage.js"),
                "localStorage",
              ],
              Blob: [require.resolve("blob-polyfill"), "Blob"],
              File: [require.resolve("blob-polyfill"), "File"],
              FileReader: [require.resolve("blob-polyfill"), "FileReader"],
              EventEmitter: [
                resolve("./", "polyfill/event-emitter.js"),
                "EventEmitter",
              ],
              emitter: [resolve("./", "polyfill/event-emitter.js"), "emitter"],
              FormData: [
                require.resolve("formdata-polyfill/FormData.js"),
                "FormData",
              ],
            }),
            new webpack.NormalModuleReplacementPlugin(/node:/, resource => {
              const request = resource.request.replace(/^node:/, "");
              resource.request = request;
              // console.log(`replaced: ${resource.request} with: ${request}`);
            }),
            new webpack.NormalModuleReplacementPlugin(/^crypto$/, resource => {
              const request = resource.request.replace(
                /crypto.*$/,
                resolve("./", "polyfill/crypto.js"),
              );
              resource.request = request;
              // console.log(`replaced: ${resource.request} with: ${request}`);
            }),
            new Dotenv({
              path: "./.env",
            }),
          ] as any[]
        ).concat(config.plugins || []),
        optimization: {
          minimize: false,
        },
      },
    );
    console.log({ mergedConfig, rules: mergedConfig.module?.rules });
    mergedConfig.module?.rules?.forEach(rule => {
      console.log({
        rule,
        use: typeof rule === "object" ? rule?.use : null,
      });
    });
    return mergedConfig;
  },
  evaluate: false,
};

export default config;
