import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Wine, Calendar, MapPin, Grape, Percent, Utensils, DollarSign, Save, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { wineStorageService, WineAnalysisData } from '@/services/wineStorageService';
import { useAuth } from '@/providers/AuthProvider';
import { ShareModal } from '@/components/ShareModal';
import { ShareWineData } from '@/services/shareService';

interface WineAnalysisResult {
  wineName?: string;
  winery?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grapeVarieties?: string[];
  alcoholContent?: string;
  wineType?: string;
  tastingNotes?: string;
  foodPairings?: string[];
  priceRange?: string;
  description?: string;
  confidence?: number;
}

interface WineAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: WineAnalysisResult | null;
  onSaveWine?: (analysis: WineAnalysisResult) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function WineAnalysisModal({ 
  visible, 
  onClose, 
  analysis,
  onSaveWine 
}: WineAnalysisModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  const handleSaveWine = async () => {
    if (!analysis) return;

    if (!user) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para salvar vinhos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => {
            onClose();
            // Aqui você pode navegar para a tela de login
          }}
        ]
      );
      return;
    }

    try {
      setSaving(true);
      
      const wineData: WineAnalysisData = {
        wineName: analysis.wineName,
        winery: analysis.winery,
        vintage: analysis.vintage,
        region: analysis.region,
        country: analysis.country,
        grapeVarieties: analysis.grapeVarieties,
        alcoholContent: analysis.alcoholContent,
        wineType: analysis.wineType,
        tastingNotes: analysis.tastingNotes,
        foodPairings: analysis.foodPairings,
        priceRange: analysis.priceRange,
        description: analysis.description,
      };

      await wineStorageService.saveWineFromAI(wineData);
      
      Alert.alert(
        'Sucesso!',
        'Vinho salvo com sucesso na sua biblioteca',
        [{ text: 'OK', onPress: onClose }]
      );
      
      onSaveWine?.(analysis);
    } catch (error) {
      console.error('Erro ao salvar vinho:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar o vinho. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const getShareData = (): ShareWineData => {
    return {
      name: analysis?.wineName || 'Vinho Analisado',
      winery: analysis?.winery,
      region: analysis?.region,
      vintage: analysis?.vintage,
      description: analysis?.description,
      rating: 4.5, // Default rating for AI analysis
      grapes: Array.isArray(analysis?.grapeVarieties) ? analysis.grapeVarieties.join(', ') : (analysis?.grapeVarieties || 'Não especificado'),
    };
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Análise do Vinho</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {analysis && (
            <>
              {/* Informações Básicas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações Básicas</Text>
                
                {analysis.wineName && (
                  <View style={styles.infoItem}>
                    <Wine size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Nome do Vinho</Text>
                      <Text style={styles.infoValue}>{analysis.wineName}</Text>
                    </View>
                  </View>
                )}

                {analysis.winery && (
                  <View style={styles.infoItem}>
                    <Wine size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Vinícola</Text>
                      <Text style={styles.infoValue}>{analysis.winery}</Text>
                    </View>
                  </View>
                )}

                {analysis.vintage && (
                  <View style={styles.infoItem}>
                    <Calendar size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Safra</Text>
                      <Text style={styles.infoValue}>{analysis.vintage}</Text>
                    </View>
                  </View>
                )}

                {analysis.wineType && (
                  <View style={styles.infoItem}>
                    <Wine size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Tipo</Text>
                      <Text style={styles.infoValue}>{analysis.wineType}</Text>
                    </View>
                  </View>
                )}

                {analysis.alcoholContent && (
                  <View style={styles.infoItem}>
                    <Percent size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Teor Alcoólico</Text>
                      <Text style={styles.infoValue}>{analysis.alcoholContent}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Origem */}
              {(analysis.region || analysis.country) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Origem</Text>
                  
                  {analysis.region && (
                    <View style={styles.infoItem}>
                      <MapPin size={20} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Região</Text>
                        <Text style={styles.infoValue}>{analysis.region}</Text>
                      </View>
                    </View>
                  )}

                  {analysis.country && (
                    <View style={styles.infoItem}>
                      <MapPin size={20} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>País</Text>
                        <Text style={styles.infoValue}>{analysis.country}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Uvas */}
              {analysis.grapeVarieties && Array.isArray(analysis.grapeVarieties) && analysis.grapeVarieties.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Castas/Uvas</Text>
                  <View style={styles.tagsContainer}>
                    {analysis.grapeVarieties.map((grape, index) => (
                      <View key={index} style={styles.grapeTag}>
                        <Grape size={16} color={colors.primary} />
                        <Text style={styles.grapeTagText}>{grape}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Descrição */}
              {analysis.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Descrição</Text>
                  <Text style={styles.descriptionText}>{analysis.description}</Text>
                </View>
              )}

              {/* Notas de Degustação */}
              {analysis.tastingNotes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notas de Degustação</Text>
                  <Text style={styles.descriptionText}>{analysis.tastingNotes}</Text>
                </View>
              )}

              {/* Harmonizações */}
              {analysis.foodPairings && Array.isArray(analysis.foodPairings) && analysis.foodPairings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Harmonizações</Text>
                  <View style={styles.tagsContainer}>
                    {analysis.foodPairings.map((pairing, index) => (
                      <View key={index} style={styles.pairingTag}>
                        <Utensils size={16} color={colors.secondary} />
                        <Text style={styles.pairingTagText}>{pairing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Faixa de Preço */}
              {analysis.priceRange && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Faixa de Preço Estimada</Text>
                  <View style={styles.infoItem}>
                    <DollarSign size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoValue}>{analysis.priceRange}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Botão Salvar */}
              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSaveWine}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.textLight} size="small" />
                  ) : (
                    <Save size={20} color={colors.textLight} />
                  )}
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Salvando...' : 'Salvar na Biblioteca'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomPadding} />
            </>
          )}
        </ScrollView>
      </View>
      </Modal>

      {analysis && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          wine={getShareData()}
        />
      )}
    </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
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
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grapeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  grapeTagText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  pairingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pairingTagText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  actionSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});