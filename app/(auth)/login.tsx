import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase, isConfigured } from '@/services/supabaseClient';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formOpacity = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Check if Supabase is configured on component mount
  useEffect(() => {
    if (!isConfigured) {
      setError('Aplicativo não está configurado corretamente. Entre em contato com o suporte.');
    }
  }, []);

  const handleShowLogin = () => {
    setShowLogin(true);
    Animated.timing(formOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getErrorMessage = (error: any) => {
    // Check for configuration errors first
    if (error?.message?.includes('Supabase não está configurado')) {
      return 'Aplicativo não está configurado corretamente. Entre em contato com o suporte.';
    }

    if (error?.message?.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    if (error?.message?.includes('Email not confirmed')) {
      return 'Por favor, confirme seu e-mail antes de fazer login.';
    }
    if (error?.message?.includes('Too many requests')) {
      return 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.';
    }
    if (error?.message?.includes('Invalid email')) {
      return 'Por favor, digite um e-mail válido.';
    }
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    return error?.message || 'Erro ao fazer login. Tente novamente.';
  };

  const handleLogin = async () => {
    // Check configuration first
    if (!isConfigured) {
      setError('Aplicativo não está configurado corretamente. Entre em contato com o suporte.');
      return;
    }

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um e-mail válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

    } catch (err) {
      if (mounted.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const { width } = Dimensions.get('window');
  const LOGO_SIZE = Math.min(width * 0.8, 400);
  const LOGO_SIZE_SMALL = Math.min(width * 0.6, 300);

  const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: '100%',
    },
    gradient: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: showLogin ? 32 : 48,
    },
    logoTextContainer: {
      alignItems: 'center',
    },
    logoImage: {
      width: showLogin ? LOGO_SIZE_SMALL : LOGO_SIZE,
      height: showLogin ? LOGO_SIZE_SMALL * 0.7 : LOGO_SIZE * 0.7,
      marginBottom: 16,
    },
    logoText: {
      fontSize: showLogin ? 48 : 64,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      letterSpacing: 2,
    },
    logoSubtext: {
      fontSize: showLogin ? 14 : 16,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '500',
      marginTop: 4,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    enterButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 99,
      paddingVertical: 14,
      paddingHorizontal: 36,
      alignItems: 'center',
      marginTop: 48,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    enterButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    formContainer: {
      width: '100%',
      maxWidth: 320,
      marginTop: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 6,
    },
    input: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 20,
      padding: 4,
    },
    forgotPasswordText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '500',
    },
    loginButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      marginBottom: 16,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: 'rgba(220,38,38,0.8)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      width: '100%',
    },
    errorText: {
      color: '#FFFFFF',
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    signUpContainer: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    signUpText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
    },
    signUpLink: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
      padding: 4,
    },
    configurationWarning: {
      backgroundColor: 'rgba(255,193,7,0.9)',
      padding: 16,
      borderRadius: 8,
      marginBottom: 24,
      width: '100%',
      maxWidth: 320,
    },
    configurationWarningText: {
      color: '#000000',
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  return (
    <ImageBackground
      source={require('@/assets/images/fundo.jpg')}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoTextContainer}>
                <Image
                  source={require('@/assets/images/wyni.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {!isConfigured && (
              <View style={styles.configurationWarning}>
                <Text style={styles.configurationWarningText}>
                  O aplicativo precisa ser configurado com as credenciais do Supabase para funcionar corretamente.
                </Text>
              </View>
            )}

            {!showLogin ? (
              <>
                <TouchableOpacity
                  style={[styles.enterButton, !isConfigured && { opacity: 0.5 }]}
                  onPress={handleShowLogin}
                  disabled={!isConfigured}
                >
                  <Text style={styles.enterButtonText}>Entrar</Text>
                </TouchableOpacity>
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Não tem uma conta?</Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity disabled={!isConfigured}>
                      <Text style={[styles.signUpLink, !isConfigured && { opacity: 0.5 }]}>Criar conta</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                <TouchableOpacity
                  style={[styles.signUpContainer, { marginTop: 24 }]}
                  onPress={() => router.replace('/(tabs)')}
                >
                  <Text style={[styles.signUpText, { textDecorationLine: 'underline', opacity: 0.9 }]}>
                    Continuar como visitante
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>E-mail</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError(null); // Clear error when user starts typing
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    editable={!loading && isConfigured}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError(null); // Clear error when user starts typing
                    }}
                    secureTextEntry
                    autoComplete="password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    editable={!loading && isConfigured}
                  />
                </View>

                <Link href="/forgot-password" asChild>
                  <TouchableOpacity style={styles.forgotPassword} disabled={loading || !isConfigured}>
                    <Text style={[styles.forgotPasswordText, !isConfigured && { opacity: 0.5 }]}>Esqueceu sua senha?</Text>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity
                  style={[styles.loginButton, (loading || !isConfigured) && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading || !isConfigured}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Não tem uma conta?</Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity disabled={loading || !isConfigured}>
                      <Text style={[styles.signUpLink, !isConfigured && { opacity: 0.5 }]}>Criar conta</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}