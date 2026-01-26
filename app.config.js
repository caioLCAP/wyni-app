import 'dotenv/config';

module.exports = {
  expo: {
    name: "WYNI - O vinho do seu jeito",
    slug: "wyni-app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "wyni-app",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#57004e"
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
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/splash.png",
        backgroundColor: "#57004e"
      }
    },
    web: {
      bundler: "metro",
      output: "single"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "O WYNI usa sua localização para encontrar vinhos, vinícolas e eventos próximos a você, personalizando sua experiência.",
          "locationWhenInUsePermission": "O WYNI usa sua localização para encontrar vinhos e eventos próximos enquanto você usa o app."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "O WYNI precisa acessar sua galeria para que você possa importar fotos de rótulos de vinhos para análise e salvamento.",
          "cameraPermission": "O WYNI precisa usar sua câmera para fotografar e analisar rótulos de vinhos."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "O WYNI precisa acessar sua câmera para escanear e identificar rótulos de vinhos em tempo real."
        }
      ]
    ],
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
