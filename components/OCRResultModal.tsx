import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { X, Wine, Calendar, MapPin, Grape, Percent, Copy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

interface OCRResult {
  fullText: string;
  textBlocks: Array<{
    text: string;
    confidence?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
}

interface WineAnalysis {
  wineName?: string;
  winery?: string;
  vintage?: string;
  region?: string;
  alcoholContent?: string;
  grapeVarieties?: string[];
  allText: string;
}

interface OCRResultModalProps {
  visible: boolean;
  onClose: () => void;
  ocrResult: OCRResult | null;
  wineAnalysis: WineAnalysis | null;
  onSaveWine?: (analysis: WineAnalysis) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OCRResultModal({ 
  visible, 
  onClose, 
  ocrResult, 
  wineAnalysis,
  onSaveWine 
}: OCRResultModalProps) {
  const handleSaveWine = () => {
    if (wineAnalysis && onSaveWine) {
      onSaveWine(wineAnalysis);
    }
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copiado!', 'Texto copiado para a área de transferência.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Texto Extraído</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {wineAnalysis && (
            <View style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>Informações do Vinho</Text>
              
              {wineAnalysis.wineName && (
                <View style={styles.infoItem}>
                  <Wine size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Nome do Vinho</Text>
                    <Text style={styles.infoValue}>{wineAnalysis.wineName}</Text>
                  </View>
                </View>
              )}

              {wineAnalysis.vintage && (
                <View style={styles.infoItem}>
                  <Calendar size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Safra</Text>
                    <Text style={styles.infoValue}>{wineAnalysis.vintage}</Text>
                  </View>
                </View>
              )}

              {wineAnalysis.region && (
                <View style={styles.infoItem}>
                  <MapPin size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Região</Text>
                    <Text style={styles.infoValue}>{wineAnalysis.region}</Text>
                  </View>
                </View>
              )}

              {wineAnalysis.alcoholContent && (
                <View style={styles.infoItem}>
                  <Percent size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teor Alcoólico</Text>
                    <Text style={styles.infoValue}>{wineAnalysis.alcoholContent}</Text>
                  </View>
                </View>
              )}

              {wineAnalysis.grapeVarieties && wineAnalysis.grapeVarieties.length > 0 && (
                <View style={styles.infoItem}>
                  <Grape size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Uvas Identificadas</Text>
                    <Text style={styles.infoValue}>
                      {wineAnalysis.grapeVarieties.join(', ')}
                    </Text>
                  </View>
                </View>
              )}

              {onSaveWine && (wineAnalysis.wineName || wineAnalysis.vintage) && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveWine}>
                  <Text style={styles.saveButtonText}>Salvar Informações do Vinho</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.textSection}>
            <View style={styles.textHeader}>
              <Text style={styles.sectionTitle}>Texto Completo</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(ocrResult?.fullText || '')}
              >
                <Copy size={16} color={colors.primary} />
                <Text style={styles.copyButtonText}>Copiar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.extractedText}>
                {ocrResult?.fullText || 'Nenhum texto encontrado'}
              </Text>
            </View>
          </View>

          {ocrResult?.textBlocks && ocrResult.textBlocks.length > 0 && (
            <View style={styles.blocksSection}>
              <Text style={styles.sectionTitle}>Blocos de Texto Detectados</Text>
              <Text style={styles.sectionSubtitle}>
                {ocrResult.textBlocks.length} bloco(s) de texto encontrado(s)
              </Text>
              {ocrResult.textBlocks.map((block, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.textBlock}
                  onPress={() => copyToClipboard(block.text)}
                >
                  <Text style={styles.blockIndex}>#{index + 1}</Text>
                  <Text style={styles.blockText}>{block.text}</Text>
                  <Copy size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  analysisSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  textSection: {
    marginBottom: 24,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  textContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  extractedText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  blocksSection: {
    marginBottom: 32,
  },
  textBlock: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  blockIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
    minWidth: 24,
  },
  blockText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  bottomPadding: {
    height: 32,
  },
});