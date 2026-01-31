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

            // 1. Verificar/Criar bucket 'avatars'
            console.log('Verificando buckets existentes...');
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                console.error('Erro ao listar buckets:', listError);
            } else {
                console.log('Buckets encontrados:', buckets?.map(b => b.name).join(', '));
            }

            const avatarBucket = buckets?.find(b => b.name === 'avatars');

            if (!avatarBucket) {
                console.log('Bucket "avatars" não encontrado. Tentando criar...');
                const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
                    public: true,
                    fileSizeLimit: 1024 * 1024 * 5, // 5MB
                    allowedMimeTypes: ['image/jpeg', 'image/png']
                });

                if (createBucketError) {
                    console.error('Erro ao tentar criar bucket "avatars":', createBucketError);
                    if (createBucketError.message && createBucketError.message.includes('new row violates row-level security')) {
                        console.error('ERRO CRÍTICO: Você precisa criar o bucket "avatars" publicamente no painel do Supabase.');
                    }
                } else {
                    console.log('Bucket "avatars" criado com sucesso!');
                }
            }

            // 2. Definir caminho do arquivo
            const fileName = `${userId}/${Date.now()}.jpg`;
            const filePath = `avatars/${fileName}`;

            console.log('Fazendo upload para:', filePath);

            // 2. Converter URI para ArrayBuffer (mais robusto que Blob direto)
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

            // 5. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log('Upload concluído. URL:', publicUrl);

            // 6. Atualizar metadados do usuário
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
