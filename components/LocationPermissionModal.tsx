import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MapPin, X, Sparkles, Globe } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function LocationPermissionModal({ 
  visible, 
  onAllow, 
  onDeny, 
  onClose 
}: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <MapPin size={48} color={colors.primary} />
            </View>
            <View style={styles.aiIndicator}>
              <Sparkles size={20} color="#8B5CF6" />
            </View>
          </View>

          <Text style={styles.title}>Recomendações Personalizadas</Text>
          <Text style={styles.subtitle}>
            Permita o acesso à sua localização para receber sugestões de vinhos personalizadas
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Globe size={24} color={colors.textLight} />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Vinhos da sua região</Text>
                <Text style={styles.benefitDescription}>
                  Descubra vinhos disponíveis na sua área e produtores locais
                </Text>
              </View>
            </View>

            <View style={styles.benefit}>
              <Sparkles size={24} color="#8B5CF6" />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Sugestões inteligentes</Text>
                <Text style={styles.benefitDescription}>
                  IA considera seu clima, cultura e preferências regionais
                </Text>
              </View>
            </View>

            <View style={styles.benefit}>
              <MapPin size={24} color={colors.textLight} />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Experiência local</Text>
                <Text style={styles.benefitDescription}>
                  Harmonizações com a culinária e tradições da sua região
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Sua localização é usada apenas para personalizar recomendações e não é compartilhada com terceiros
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
            <Text style={styles.allowButtonText}>Permitir Localização</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.denyButton} onPress={onDeny}>
            <Text style={styles.denyButtonText}>Continuar sem localização</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  benefitContent: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.8,
    lineHeight: 20,
  },
  privacyNote: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  privacyText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
  },
  actions: {
    padding: 24,
    paddingBottom: 48,
  },
  allowButton: {
    backgroundColor: colors.textLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  denyButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
});