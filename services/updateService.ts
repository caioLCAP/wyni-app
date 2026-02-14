import { Alert, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';

/**
 * Service to handle app updates check and prompting
 */
export const updateService = {
    /**
     * Check if a new version is available in the store
     * and prompt the user to update if necessary.
     */
    checkAndPromptForUpdate: async () => {
        try {
            // Em desenvolvimento ou Expo Go, isso pode falhar ou não retornar dados corretos
            // Mas em produção (build standalone), funcionará conforme esperado.
            const updateNeeded = await VersionCheck.needUpdate();

            if (updateNeeded && updateNeeded.isNeeded) {
                Alert.alert(
                    'Nova atualização disponível',
                    'Uma nova versão do WYNI está disponível. Por favor, atualize para continuar aproveitando as novidades!',
                    [
                        {
                            text: 'Mais tarde',
                            style: 'cancel',
                        },
                        {
                            text: 'Atualizar Agora',
                            onPress: () => {
                                const storeUrl = updateNeeded.storeUrl;
                                if (storeUrl) {
                                    Linking.openURL(storeUrl);
                                } else {
                                    // Fallback se não conseguir obter a URL da loja automaticamente
                                    const fallbackUrl = Platform.select({
                                        ios: 'https://apps.apple.com/app/6758225955', // Substitua pelo ID real quando tiver
                                        android: 'market://details?id=com.luispedrosa.wyni', // Ajuste para o seu Bundle ID
                                        default: 'https://wyni.app'
                                    });
                                    Linking.openURL(fallbackUrl);
                                }
                            },
                        },
                    ],
                    { cancelable: true }
                );
            }
        } catch (error) {
            console.log('Erro ao verificar atualização:', error);
            // Silenciosamente falha, não queremos incomodar o usuário com erros de verificação
        }
    }
};
