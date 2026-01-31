import { supabase } from './supabaseClient';

export class UserService {
    private static instance: UserService;

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    /**
     * Upload user avatar to Supabase and update user metadata
     */
    async uploadAvatar(userId: string, imageUri: string): Promise<string | null> {
        try {
            console.log('Iniciando upload do avatar...');

            // 1. Definir caminho do arquivo
            // Usamos apenas o ID e o timestamp. Não precisamos adicionar 'avatars/' no início
            // pois o método .from('avatars') já seleciona o bucket correto.
            const fileName = `${userId}/${Date.now()}.jpg`;
            const filePath = `${fileName}`;

            console.log('Fazendo upload para:', filePath);

            // 2. Converter URI para ArrayBuffer (mais robusto que Blob direto em React Native)
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            console.log('Tamanho do arquivo:', arrayBuffer.byteLength);

            if (arrayBuffer.byteLength === 0) {
                throw new Error('Falha ao ler o arquivo: tamanho 0 bytes');
            }

            // 3. Upload para o Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                throw uploadError;
            }

            // 4. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log('Upload concluído. URL:', publicUrl);

            // 5. Atualizar metadados do usuário
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) {
                console.error('Erro ao atualizar usuário:', updateError);
                throw updateError;
            }

            return publicUrl;
        } catch (error: any) {
            console.error('Erro no serviço de upload de avatar:', error);
            return null;
        }
    }

    /**
     * Get current user profile data
     */
    async getUserProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}

export const userService = UserService.getInstance();
