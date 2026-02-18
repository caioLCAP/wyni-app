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
  TextInput,
  Image,
} from 'react-native';
import { X, Wine, Calendar, MapPin, Grape, Percent, Utensils, DollarSign, Save, Share2, Cloud, Sun, Clock, Star } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/constants/colors';
import { wineStorageService, WineAnalysisData, SavedWine } from '@/services/wineStorageService';
import { useAuth } from '@/providers/AuthProvider';
import { shareService, ShareWineData } from '@/services/shareService';
import { locationService } from '@/services/locationService';

interface WineAnalysisResult {
  wineName?: string;
  winery?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grapeVarieties?: string[];
  alcoholContent?: string;
  wineType?: string;
  style?: string;
  tastingNotes?: string;
  foodPairings?: string[];
  priceRange?: string;
  servingTemp?: string;
  preservation?: string;
  occasions?: string[];
  description?: string;
  confidence?: number;
}

interface WineAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: WineAnalysisResult | null;
  onSaveWine?: (savedWine: SavedWine) => void;
  imageUri?: string | null; // Image to be uploaded
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function WineAnalysisModal({
  visible,
  onClose,
  analysis,
  onSaveWine,
  imageUri
}: WineAnalysisModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [momentType, setMomentType] = React.useState('');
  const [weatherCondition, setWeatherCondition] = React.useState('');
  const [userLocation, setUserLocation] = React.useState<{ city?: string, country?: string } | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [isSavingDetails, setIsSavingDetails] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [likedCharacteristic, setLikedCharacteristic] = React.useState('');

  const likedOptions = ['Uva', 'Região', 'Produtor', 'Estilo', 'Momento/clima', 'Não sei dizer'];

  React.useEffect(() => {
    if (visible && isSavingDetails) {
      loadContextData();
    }
  }, [visible, isSavingDetails]);

  const loadContextData = async () => {
    setLocationLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation({
          city: location.city,
          country: location.country
        });

        // Simular clima baseado na localização (latitude)
        const context = locationService.getLocationContext();
        if (context) {
          const conditions = ['Ensolarado', 'Chuvoso', 'Nublado', 'Ventoso', 'Agradável'];
          const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
          setWeatherCondition(randomCondition);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contexto:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSaveWine = async () => {
    if (!analysis) return;

    // Se ainda não está mostrando os detalhes, mostrar primeiro
    if (!isSavingDetails) {
      setIsSavingDetails(true);
      return;
    }

    if (!user) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para salvar vinhos',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Fazer Login', onPress: () => {
              onClose();
              // Aqui você pode navegar para a tela de login
            }
          }
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
        foodPairings: analysis.foodPairings,
        priceRange: analysis.priceRange,
        description: analysis.description,
        location_city: userLocation?.city,
        location_country: userLocation?.country,
        moment_type: momentType,
        rating: rating > 0 ? rating : (analysis.confidence ? analysis.confidence * 5 : undefined),
        weather: weatherCondition,
        // Adicionando a característica que mais gostou como parte da descrição ou notas, se desejar salvar
        tastingNotes: likedCharacteristic
          ? (analysis.tastingNotes ? `${analysis.tastingNotes}\n\nO que mais gostou: ${likedCharacteristic}` : `O que mais gostou: ${likedCharacteristic}`)
          : analysis.tastingNotes,
        imageUri: imageUri || undefined // Pass image to be uploaded
      };

      const savedWine = await wineStorageService.saveWineFromAI(wineData);

      Alert.alert(
        'Sucesso!',
        'Vinho salvo com sucesso na sua biblioteca',
        [{ text: 'OK', onPress: onClose }]
      );

      if (savedWine) {
        onSaveWine?.(savedWine);
        setIsSavingDetails(false); // Resetar estado após salvar
      }
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

  const handleShare = async () => {
    if (!analysis) return;

    try {
      console.log('Análise completa:', JSON.stringify(analysis, null, 2));
      console.log('Food Pairings:', analysis.foodPairings);
      console.log('Tasting Notes:', analysis.tastingNotes);

      let fullAnalysisText = '🍷 ANÁLISE COMPLETA DO VINHO\n';
      fullAnalysisText += '═══════════════════════════\n\n';

      // Informações Básicas
      if (analysis.wineName || analysis.winery || analysis.vintage || analysis.wineType || analysis.alcoholContent) {
        fullAnalysisText += '📋 INFORMAÇÕES BÁSICAS\n';
        fullAnalysisText += '─────────────────────\n';

        if (analysis.wineName) fullAnalysisText += `🍷 Nome: ${analysis.wineName}\n`;
        if (analysis.winery) fullAnalysisText += `🏛️ Vinícola: ${analysis.winery}\n`;
        if (analysis.vintage) fullAnalysisText += `📅 Safra: ${analysis.vintage}\n`;
        if (analysis.wineType) fullAnalysisText += `🍇 Tipo: ${analysis.wineType}\n`;
        if (analysis.style) fullAnalysisText += `🎨 Estilo: ${analysis.style}\n`; // Novo
        if (analysis.alcoholContent) fullAnalysisText += `🌡️ Teor Alcoólico: ${analysis.alcoholContent}\n`;
        fullAnalysisText += '\n';
      }

      // Origem
      if (analysis.region || analysis.country) {
        fullAnalysisText += '🌍 ORIGEM\n';
        fullAnalysisText += '─────────────────────\n';
        if (analysis.region) fullAnalysisText += `📍 Região: ${analysis.region}\n`;
        if (analysis.country) fullAnalysisText += `🗺️ País: ${analysis.country}\n`;
        fullAnalysisText += '\n';
      }

      // Serviço e Guarda (Novo)
      if (analysis.servingTemp || analysis.preservation || (analysis.occasions && analysis.occasions.length > 0)) {
        fullAnalysisText += '🕰️ SERVIÇO E MOMENTO\n';
        fullAnalysisText += '─────────────────────\n';
        if (analysis.servingTemp) fullAnalysisText += `🌡️ Temperatura: ${analysis.servingTemp}\n`;
        if (analysis.preservation) fullAnalysisText += `📦 Guarda: ${analysis.preservation}\n`;

        if (analysis.occasions && analysis.occasions.length > 0) {
          fullAnalysisText += '🎉 Ocasiões:\n';
          analysis.occasions.forEach(occasion => {
            fullAnalysisText += `   • ${occasion}\n`;
          });
        }
        fullAnalysisText += '\n';
      }

      // Castas
      if (analysis.grapeVarieties && Array.isArray(analysis.grapeVarieties) && analysis.grapeVarieties.length > 0) {
        fullAnalysisText += '🍇 CASTAS/UVAS\n';
        fullAnalysisText += '─────────────────────\n';
        analysis.grapeVarieties.forEach((grape, index) => {
          fullAnalysisText += `  ${index + 1}. ${grape}\n`;
        });
        fullAnalysisText += '\n';
      }

      // Descrição & Notas
      if (analysis.description) {
        fullAnalysisText += '📝 DESCRIÇÃO\n';
        fullAnalysisText += '─────────────────────\n';
        fullAnalysisText += `${analysis.description}\n\n`;
      }

      if (analysis.tastingNotes) {
        fullAnalysisText += '👃 NOTAS DE DEGUSTAÇÃO\n';
        fullAnalysisText += '─────────────────────\n';
        fullAnalysisText += `${analysis.tastingNotes}\n\n`;
      }

      // Harmonizações
      const hasPairings = analysis.foodPairings &&
        (Array.isArray(analysis.foodPairings) ? analysis.foodPairings.length > 0 : typeof analysis.foodPairings === 'string');

      if (hasPairings) {
        fullAnalysisText += '🍽️ HARMONIZAÇÕES\n';
        fullAnalysisText += '─────────────────────\n';

        if (Array.isArray(analysis.foodPairings)) {
          analysis.foodPairings.forEach((pairing, index) => {
            fullAnalysisText += `  ${index + 1}. ${pairing}\n`;
          });
        } else {
          fullAnalysisText += `${analysis.foodPairings}\n`;
        }
        fullAnalysisText += '\n';
      }

      // Preço e Confiança
      if (analysis.priceRange) {
        fullAnalysisText += '💰 FAIXA DE PREÇO ESTIMADA\n';
        fullAnalysisText += '─────────────────────\n';
        fullAnalysisText += `${analysis.priceRange}\n\n`;
      }

      if (analysis.confidence) {
        fullAnalysisText += '📊 CONFIANÇA DA ANÁLISE\n';
        fullAnalysisText += '─────────────────────\n';
        fullAnalysisText += `${Math.round(analysis.confidence * 100)}%\n\n`;
      }

      fullAnalysisText += '═══════════════════════════\n';
      fullAnalysisText += '📱 Analisado com WYNI\n';

      await Clipboard.setStringAsync(fullAnalysisText);
      Alert.alert('Copiado! ✅', 'Análise copiada para a área de transferência.', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      Alert.alert('Erro', 'Não foi possível copiar os dados.');
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
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.scannedImage} resizeMode="cover" />
            </View>
          )}
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

                {analysis.style && (
                  <View style={styles.infoItem}>
                    <Star size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Estilo</Text>
                      <Text style={styles.infoValue}>{analysis.style}</Text>
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

              {/* Serviço e Momento (Novo) */}
              {(analysis.servingTemp || analysis.preservation || (analysis.occasions && analysis.occasions.length > 0)) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Serviço & Momento</Text>

                  {analysis.servingTemp && (
                    <View style={styles.infoItem}>
                      <Percent size={20} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Temperatura Ideal</Text>
                        <Text style={styles.infoValue}>{analysis.servingTemp}</Text>
                      </View>
                    </View>
                  )}

                  {analysis.preservation && (
                    <View style={styles.infoItem}>
                      <Clock size={20} color={colors.primary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Potencial de Guarda</Text>
                        <Text style={styles.infoValue}>{analysis.preservation}</Text>
                      </View>
                    </View>
                  )}

                  {analysis.occasions && analysis.occasions.length > 0 && (
                    <View style={styles.infoItem}>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Ocasiões Sugeridas</Text>
                        <View style={styles.tagsContainer}>
                          {analysis.occasions.map((occasion, index) => (
                            <View key={index} style={styles.pairingTag}>
                              <Text style={styles.pairingTagText}>{occasion}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

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

              {/* Contexto do Momento - Só exibe quando clicar em salvar */}
              {isSavingDetails && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Registro do Momento</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Tipo de Momento</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ex: Jantar romântico, Happy hour, Presente..."
                      placeholderTextColor={colors.textSecondary}
                      value={momentType}
                      onChangeText={setMomentType}
                    />
                  </View>

                  <View style={styles.contextRow}>
                    <View style={styles.contextItem}>
                      <Cloud size={20} color={colors.primary} />
                      <View style={styles.contextContent}>
                        <Text style={styles.contextLabel}>Clima</Text>
                        {locationLoading ? (
                          <Text style={styles.contextValue}>Carregando...</Text>
                        ) : (
                          <TextInput
                            style={styles.contextValueInput}
                            value={weatherCondition}
                            onChangeText={setWeatherCondition}
                            placeholder="Clima"
                            placeholderTextColor={colors.textSecondary}
                          />
                        )}
                      </View>
                    </View>

                    <View style={styles.contextItem}>
                      <MapPin size={20} color={colors.primary} />
                      <View style={styles.contextContent}>
                        <Text style={styles.contextLabel}>Local</Text>
                        <Text style={styles.contextValue} numberOfLines={1}>
                          {locationLoading ? 'Carregando...' : (userLocation?.city ? `${userLocation.city}, ${userLocation.country}` : 'Não identificado')}
                        </Text>
                      </View>
                      {!locationLoading && userLocation?.city && (
                        <TouchableOpacity onPress={() => setUserLocation(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <X size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Rating UI */}
                  <View style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Sua Avaliação</Text>
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                          <Star
                            size={32}
                            color={star <= rating ? colors.secondary : colors.textSecondary + '40'}
                            fill={star <= rating ? colors.secondary : 'none'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Liked Characteristic UI */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>O que mais gostou nesse vinho?</Text>
                    <View style={styles.tagsContainer}>
                      {likedOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.pairingTag,
                            likedCharacteristic === option && { backgroundColor: colors.primary }
                          ]}
                          onPress={() => setLikedCharacteristic(option)}
                        >
                          <Text style={[
                            styles.pairingTagText,
                            likedCharacteristic === option && { color: colors.textLight }
                          ]}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
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
                    {saving ? 'Salvando...' : (isSavingDetails ? 'Confirmar e Salvar' : 'Salvar na Biblioteca')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomPadding} />
            </>
          )}
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
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scannedImage: {
    width: '100%',
    height: '100%',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  contextItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextContent: {
    marginLeft: 8,
    flex: 1,
  },
  contextLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  contextValueInput: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  selectionTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionTagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectionTagText: {
    fontSize: 14,
    color: colors.text,
  },
  selectionTagTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
});