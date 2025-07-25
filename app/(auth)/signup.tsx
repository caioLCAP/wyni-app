import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes('User already registered')) {
      return 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
    }
    if (error?.message?.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (error?.message?.includes('Invalid email')) {
      return 'Por favor, digite um e-mail válido.';
    }
    if (error?.message?.includes('Signup is disabled')) {
      return 'O cadastro está temporariamente desabilitado. Tente novamente mais tarde.';
    }
    if (error?.message?.includes('Email rate limit exceeded')) {
      return 'Muitas tentativas de cadastro. Aguarde alguns minutos antes de tentar novamente.';
    }
    return error?.message || 'Erro ao criar conta. Tente novamente.';
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um e-mail válido');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signUpError) throw signUpError;

      // Automatically sign in after successful sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 48,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    description: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 32,
      lineHeight: 24,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    input: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    signUpButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    signUpButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: 'rgba(220,38,38,0.8)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: '#FFFFFF',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg' }}
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Crie sua conta para começar a explorar o mundo dos vinhos.
            </Text>

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
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor="rgba(255,255,255,0.6)"
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
                  if (error) setError(null);
                }}
                secureTextEntry
                autoComplete="new-password"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha novamente"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                autoComplete="new-password"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}