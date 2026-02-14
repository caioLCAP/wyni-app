import 'dotenv/config';

module.exports = {
  expo: {
    name: "WYNI - O vinho do seu jeito",
    slug: "wyni-app",
    version: "1.0.3", // Atualizado de 1.0.2
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
      buildNumber: "2", // Incrementado para sinalizar nova build à Apple
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Adicionando as permissões diretamente no infoPlist para redundância e clareza
        NSCameraUsageDescription: "O WYNI utiliza a câmera para que você possa tirar fotos de rótulos de vinhos e identificá-los automaticamente na nossa base de dados.",
        NSPhotoLibraryUsageDescription: "O WYNI acessa sua galeria para que você possa selecionar fotos de vinhos já tiradas e salvá-las em sua adega pessoal.",
        NSLocationWhenInUseUsageDescription: "Usamos sua localização para mostrar lojas de vinhos e vinícolas próximas a você no mapa.",
      }
    },
    android: {
      package: "com.luispedrosa.wyni",
      versionCode: 2, // Incrementado também no Android
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
          "locationAlwaysAndWhenInUsePermission": "O WYNI usa sua localização para encontrar vinhos e vinícolas próximos a você, como por exemplo, sugerir lojas na sua cidade atual.",
          "locationWhenInUsePermission": "O WYNI usa sua localização para encontrar vinhos e eventos próximos enquanto você usa o app."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "O WYNI acessa sua galeria para você importar fotos de vinhos e organizar sua coleção pessoal.",
          "cameraPermission": "O WYNI utiliza a câmera para escanear rótulos e fornecer informações detalhadas sobre a garrafa instantaneamente."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "O WYNI utiliza a câmera para escanear rótulos e fornecer informações detalhadas sobre a garrafa instantaneamente."
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