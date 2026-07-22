const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && (moduleName === "react-native-maps" || moduleName.startsWith("react-native-maps/"))) {
    return {
      filePath: path.resolve(__dirname, "metro-stubs/react-native-maps.js"),
      type: "sourceFile"
    };
  }

  if (
    moduleName === "../Utilities/Platform" &&
    context.originModulePath &&
    context.originModulePath.includes("Libraries/ReactPrivate/ReactNativePrivateInterface.js")
  ) {
    return {
      filePath: path.resolve(__dirname, "shims/Platform.web.js"),
      type: "sourceFile"
    };
  }

  if (typeof originalResolveRequest === "function") {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
