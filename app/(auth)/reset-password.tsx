import React, { useState, useEffect, useRef } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabaseClient';
import { useTheme } from '@/hooks/useTheme';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true); // Novo estado para controlar a verificação inicial
  const processedRef = useRef(false);
  const routerParams = useLocalSearchParams();

  useEffect(() => {
    // Safety timeout: stop verifying after 10 seconds regardless of what happens
    const safetyTimeout = setTimeout(() => {
      setVerifying((current) => {
        if (current) {
          console.log('Safety timeout triggered: stopping verification.');
          return false;
        }
        return current;
      });
    }, 10000);

    // 1. Ouve mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setVerifying(false);
      }
    });

    const handleDeepLink = async (url: string | null) => {
      // Tenta usar parâmetros do router se a URL vier vazia
      if (!url && (!routerParams || Object.keys(routerParams).length === 0)) {
        // Se não tem URL E não tem routerParams
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setVerifying(false);
        } else {
          setTimeout(() => setVerifying(false), 2000);
        }
        return;
      }

      // Evita processamento duplo
      if (processedRef.current) return;
      processedRef.current = true;

      console.log('Processando link:', url);
      console.log('Router Params:', JSON.stringify(routerParams));

      try {
        let params: { [key: string]: string } = {};

        // 1. Tenta extrair da URL (String Parse)
        if (url) {
          let paramsString = '';
          if (url.includes('#')) {
            paramsString = url.split('#')[1];
          } else if (url.includes('?')) {
            paramsString = url.split('?')[1];
          }

          if (paramsString) {
            paramsString.split('&').forEach((pair) => {
              const parts = pair.split('=');
              const key = parts[0];
              const value = parts.slice(1).join('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });
          }
        }

        // 2. Mescla com parâmetros do Expo Router (se existirem e não tivermos achado na URL)
        // Router Params já vem decodificados
        if (Object.keys(params).length === 0 && routerParams) {
          if (typeof routerParams.code === 'string') params.code = routerParams.code;
          if (typeof routerParams.access_token === 'string') params.access_token = routerParams.access_token;
          if (typeof routerParams.refresh_token === 'string') params.refresh_token = routerParams.refresh_token;
          if (typeof routerParams.error_description === 'string') params.error_description = routerParams.error_description;
        }

        if (Object.keys(params).length > 0) {
          // Lógica de validação (igual ao anterior)
          if (params.error_description) {
            const msg = params.error_description.replace(/\+/g, ' ');
            Alert.alert('Link Inválido', `${msg}\n\nDica: Se você usa Outlook ou e-mail corporativo, o antivírus pode ter clicado no link antes de você.`);
            setVerifying(false);
            return;
          }

          if (params.code) {
            console.log('Detectado código PKCE via deep link.');
            const { error } = await supabase.auth.exchangeCodeForSession(params.code);
            if (error) {
              console.log('Erro exchangeCodeForSession:', error);

              // Verifica se, apesar do erro, temos sessão (ex: race condition)
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                console.log('Sessão encontrada apesar do erro.');
                setVerifying(false); // Silently succeed
                return;
              }

              Alert.alert('Link Inválido', 'Não foi possível validar o código de recuperação.', [
                { text: 'OK', onPress: () => setVerifying(false) }
              ]);
            } else {
              console.log('Sucesso no exchangeCodeForSession.');
              Alert.alert('Sucesso', 'Sessão recuperada. Defina sua nova senha.', [
                { text: 'OK', onPress: () => setVerifying(false) }
              ]);
            }
          } else if (params.access_token && params.refresh_token) {
            console.log('Detectado access_token via deep link.');
            const { error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (error) {
              console.log('Erro setSession:', error);
              // Check if session exists anyway
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                console.log('Sessão encontrada apesar do erro de setSession.');
                setVerifying(false);
                return;
              }

              Alert.alert('Link Expirado', 'Este link já foi usado ou expirou. Solicite um novo.', [
                { text: 'OK', onPress: () => setVerifying(false) }
              ]);
            } else {
              console.log('Sucesso no setSession.');
              Alert.alert('Sucesso', 'Sessão recuperada. Defina sua nova senha.', [
                { text: 'OK', onPress: () => setVerifying(false) }
              ]);
            }
          } else {
            console.log('Parâmetros não encontrados na URL:', params);
            setVerifying(false);
          }
        } else {
          console.log('URL sem parâmetros detectada.');
          // Se estamos no fluxo de dev/tunnel, às vezes o link chega "pelado"
          // Tenta verificar se já existe sessão (caso o browser tenha setado cookies?? não em nativo)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setVerifying(false);
          } else {
            Alert.alert('Link Incompleto', 'O link não contém as informações de recuperação. Tente solicitar novamente.');
            setVerifying(false);
          }
        }
      } catch (error) {
        console.log('Erro ao recuperar sessão:', error);
        setVerifying(false);
      }
      // Removed finally block to rely on explicit setVerifying calls or Alert callbacks
      // finally {
      //   setVerifying(false);
      // }
    };

    // 1. Verifica se o app abriu do zero (Cold Start)
    Linking.getInitialURL().then((url) => {
      handleDeepLink(url);
    });

    // 2. Verifica se o app já estava aberto e recebeu o link (Warm Start)
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      clearTimeout(safetyTimeout);
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
      console.error('Erro handleUpdatePassword:', error);
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