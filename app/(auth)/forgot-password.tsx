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
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabaseClient';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes('Invalid email')) {
      return 'Por favor, digite um e-mail válido.';
    }
    if (error?.message?.includes('Email rate limit exceeded')) {
      return 'Muitas tentativas de recuperação. Aguarde alguns minutos antes de tentar novamente.';
    }
    if (error?.message?.includes('User not found')) {
      return 'Não encontramos uma conta com este e-mail.';
    }
    return error?.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.';
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail');
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

      const redirectUrl = Linking.createURL('/reset-password');
      console.log('Password Reset Redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      lineHeight: 24,
    },
    inputContainer: {
      marginBottom: 24,
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
    resetButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    resetButtonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: '#FEE2E2',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: '#DC2626',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 18,
    },
    successContainer: {
      backgroundColor: '#DCFCE7',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    successText: {
      color: '#15803D',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Recuperar Senha</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              E-mail enviado com sucesso! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </Text>
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
          />
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.resetButtonText}>Enviar Instruções</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}