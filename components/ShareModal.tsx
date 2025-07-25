import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { X, MessageCircle, Facebook, Instagram, Twitter, Share } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { shareService, ShareWineData } from '@/services/shareService';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  wine: ShareWineData;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ShareModal({ visible, onClose, wine }: ShareModalProps) {
  const handleShare = async (platform: string) => {
    try {
      switch (platform) {
        case 'whatsapp':
          await shareService.shareToWhatsApp(wine);
          break;
        case 'facebook':
          await shareService.shareToFacebook(wine);
          break;
        case 'instagram':
          await shareService.shareToInstagram(wine);
          break;
        case 'twitter':
          await shareService.shareToTwitter(wine);
          break;
        case 'more':
          await shareService.shareWine(wine);
          break;
      }
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
    },
    {
      id: 'more',
      name: 'Mais opções',
      icon: Share,
      color: colors.primary,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Compartilhar Vinho</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.wineInfo}>
            <Text style={styles.wineName}>{wine.name}</Text>
            {wine.winery && (
              <Text style={styles.wineDetails}>{wine.winery}</Text>
            )}
            {wine.region && (
              <Text style={styles.wineDetails}>{wine.region}</Text>
            )}
          </View>

          <View style={styles.optionsContainer}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.shareOption}
                onPress={() => handleShare(option.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                  <option.icon size={24} color={option.color} />
                </View>
                <Text style={styles.optionName}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  wineInfo: {
    padding: 20,
    alignItems: 'center',
  },
  wineName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  wineDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});