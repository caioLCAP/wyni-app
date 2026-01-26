import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabaseClient';
import { useTheme } from '@/hooks/useTheme';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true); // Novo estado para controlar a verificação inicial

  useEffect(() => {
    // 1. Ouve mudanças na autenticação (caso o setSession funcione)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setVerifying(false);
      }
    });

    const handleDeepLink = async (url: string | null) => {
      if (!url) {
        // Se não tem URL, verifica se já existe sessão ativa (ex: navegação interna)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setVerifying(false);
        } else {
          // Se demorar muito e não achar sessão, libera a tela mas o usuário pode ter erro
          setTimeout(() => setVerifying(false), 2000);
        }
        return;
      }

      console.log('Processando link:', url);

      try {
        // O link vem no formato: scheme://path#access_token=...&refresh_token=...
        let paramsString = '';
        if (url.includes('#')) {
          paramsString = url.split('#')[1];
        } else if (url.includes('?')) {
          paramsString = url.split('?')[1];
        }

        if (paramsString) {
          const params: { [key: string]: string } = {};
          paramsString.split('&').forEach((pair) => {
            // CORREÇÃO: Tokens podem conter múltiplos '=' (base64), então juntamos o resto
            const parts = pair.split('=');
            const key = parts[0];
            const value = parts.slice(1).join('=');

            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });

          // Verifica se o Supabase retornou um erro na URL (ex: link expirado)
          if (params.error_description) {
            const msg = params.error_description.replace(/\+/g, ' ');
            Alert.alert('Link Inválido', `${msg}\n\nDica: Se você usa Outlook ou e-mail corporativo, o antivírus pode ter clicado no link antes de você.`);
            setVerifying(false);
            return;
          }

          if (params.access_token && params.refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            
            if (error) {
              console.log('Erro setSession:', error);
              Alert.alert('Link Expirado', 'Este link já foi usado ou expirou. Solicite um novo.');
            } else {
              // Sucesso: o onAuthStateChange vai cuidar de setVerifying(false)
              Alert.alert('Sucesso', 'Sessão recuperada. Defina sua nova senha.');
            }
          }
        }
      } catch (error) {
        console.log('Erro ao recuperar sessão:', error);
      } finally {
        // Garante que o loading pare em caso de erro de parse
        setVerifying(false);
      }
    };

    // 1. Verifica se o app abriu do zero (Cold Start)
    Linking.getInitialURL().then(handleDeepLink);

    // 2. Verifica se o app já estava aberto e recebeu o link (Warm Start)
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      subscription.remove();
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      
      // Verifica se a sessão foi estabelecida corretamente antes de tentar atualizar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Sessão não encontrada', 'O link não autenticou corretamente. Tente solicitar um novo e-mail.');
        return;
      }
      
      // Atualiza a senha do usuário logado (o link de recuperação já faz o login automaticamente)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Sua senha foi atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);

    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    buttonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (verifying) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.subtitle, { marginTop: 20 }]}>Validando link de segurança...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Nova Senha</Text>
      <Text style={styles.subtitle}>Digite sua nova senha abaixo.</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nova Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a nova senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Atualizar Senha</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}