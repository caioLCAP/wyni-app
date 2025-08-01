import 'dotenv/config';

module.exports = {
  expo: {
    name: "WYNI - O vinho do seu jeito",
    slug: "wyni-app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#6a005f"
    },
    newArchEnabled: true,
    owner: "luis-pedrosa",
    ios: {
      bundleIdentifier: "com.luispedrosa.wyni",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.luispedrosa.wyni",
      versionCode: 1
    },
    web: {
      bundler: "metro",
      output: "single"
    },
    plugins: ["expo-router", "expo-font", "expo-web-browser"],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "f49ab8f2-bd95-4c9d-ab8c-93dbe0739a57"
      }
    },
    assetBundlePatterns: ["**/*"]
  }
};
