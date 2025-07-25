import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Star, Wine, Grape, Heart, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WineType } from '@/types/wine';
import { wineStorageService } from '@/services/wineStorageService';
import { shareService, ShareWineData } from '@/services/shareService';
import { useAuth } from '@/providers/AuthProvider';

interface WineCardProps {
  wine: WineType;
  featured?: boolean;
  horizontal?: boolean;
  compact?: boolean;
  showActions?: boolean;
  isFavorite?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export function WineCard({ 
  wine, 
  featured, 
  horizontal, 
  compact, 
  showActions = false,
  isFavorite = false,
  onFavoriteChange 
}: WineCardProps) {
  const { user } = useAuth();
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavoritePress = async () => {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para favoritar vinhos');
      return;
    }

    if (favoriteLoading) return;

    try {
      setFavoriteLoading(true);
      
      // Para recomendações de IA (vinhos com id começando com 'ai-'), precisamos salvar primeiro
      if (wine.id.startsWith('ai-')) {
        if (!isFavorite) {
          // Verificar se já existe um vinho similar salvo
          const existingWine = await wineStorageService.findSavedWineByName(wine.name);
          
          let wineToFavorite;
          if (existingWine) {
            // Usar o vinho existente
            wineToFavorite = existingWine;
          } else {
            // Salvar o vinho primeiro
            wineToFavorite = await wineStorageService.saveWineFromAI({
              wineName: wine.name,
              wineType: wine.type,
              region: wine.region,
              description: wine.description,
              grapeVarieties: wine.grapes ? [wine.grapes] : [],
              foodPairings: wine.pairings || [],
              priceRange: wine.price,
              rating: wine.rating,
              vintage: wine.year
            });
          }

          if (wineToFavorite) {
            // Verificar se já é favorito antes de tentar favoritar
            const isAlreadyFavorite = await wineStorageService.isWineFavorite(wineToFavorite.id);
            
            if (!isAlreadyFavorite) {
              await wineStorageService.toggleFavorite(wineToFavorite.id);
              onFavoriteChange?.(true);
            } else {
              // Já é favorito, apenas atualizar o estado
              onFavoriteChange?.(true);
            }
          }
        } else {
          // Remover dos favoritos - encontrar o vinho salvo
          const savedWine = await wineStorageService.findSavedWineByName(wine.name);
          
          if (savedWine) {
            await wineStorageService.toggleFavorite(savedWine.id);
            onFavoriteChange?.(false);
          }
        }
      } else {
        // Para vinhos salvos, apenas alternar favorito
        const wineId = wine.id.replace('saved-', '');
        const newFavoriteStatus = await wineStorageService.toggleFavorite(wineId);
        onFavoriteChange?.(newFavoriteStatus);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      Alert.alert('Erro', 'Não foi possível favoritar o vinho');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSharePress = async () => {
    try {
      const shareData: ShareWineData = {
        name: wine.name,
        region: wine.region,
        vintage: wine.year,
        description: wine.description,
        rating: wine.rating,
        grapes: wine.grapes,
      };

      await shareService.shareWine(shareData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o vinho');
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard}>
        <Image source={{ uri: wine.imageUrl }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {wine.name}
          </Text>
          <Text style={styles.compactRegion} numberOfLines={1}>
            {wine.region}
          </Text>
          {showActions && (
            <View style={styles.compactActions}>
              <TouchableOpacity 
                onPress={handleFavoritePress}
                disabled={favoriteLoading}
                style={styles.actionButton}
              >
                <Heart 
                  size={16} 
                  color={isFavorite ? colors.secondary : colors.textSecondary}
                  fill={isFavorite ? colors.secondary : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSharePress}
                style={styles.actionButton}
              >
                <Share2 size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard}>
        <Image source={{ uri: wine.imageUrl }} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text style={styles.name} numberOfLines={2}>
              {wine.name}
            </Text>
            {showActions && (
              <View style={styles.horizontalActions}>
                <TouchableOpacity 
                  onPress={handleFavoritePress}
                  disabled={favoriteLoading}
                  style={styles.actionButton}
                >
                  <Heart 
                    size={20} 
                    color={isFavorite ? colors.secondary : colors.textSecondary}
                    fill={isFavorite ? colors.secondary : 'none'}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSharePress}
                  style={styles.actionButton}
                >
                  <Share2 size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.typeContainer}>
            <Wine size={16} color={colors.primary} />
            <Text style={styles.typeText}>{wine.type}</Text>
          </View>

          {wine.characteristics && wine.characteristics.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Características:</Text>
              <View style={styles.tagsContainer}>
                {wine.characteristics.map((char, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{char}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {wine.aromas && wine.aromas.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Aromas:</Text>
              <View style={styles.tagsContainer}>
                {wine.aromas.map((aroma, index) => (
                  <View key={index} style={[styles.tag, styles.aromaTag]}>
                    <Text style={[styles.tagText, styles.aromaTagText]}>{aroma}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.ratingContainer}>
              <Star size={16} color={colors.secondary} fill={colors.secondary} />
              <Text style={styles.rating}>{wine.rating}</Text>
            </View>
            <Text style={styles.price}>{wine.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        featured && styles.featuredCard
      ]}
    >
      <Image 
        source={{ uri: wine.imageUrl }} 
        style={[
          styles.image,
          featured && styles.featuredImage
        ]} 
      />
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text 
            style={[
              styles.name,
              featured && styles.featuredName
            ]} 
            numberOfLines={2}
          >
            {wine.name}
          </Text>
          {showActions && (
            <View style={styles.cardActions}>
              <TouchableOpacity 
                onPress={handleFavoritePress}
                disabled={favoriteLoading}
                style={styles.actionButton}
              >
                <Heart 
                  size={18} 
                  color={isFavorite ? colors.secondary : colors.textSecondary}
                  fill={isFavorite ? colors.secondary : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSharePress}
                style={styles.actionButton}
              >
                <Share2 size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.region} numberOfLines={1}>
          {wine.region} • {wine.year}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.ratingContainer}>
            <Star size={16} color={colors.secondary} fill={colors.secondary} />
            <Text style={styles.rating}>{wine.rating}</Text>
          </View>
          <Text style={styles.price}>{wine.price}</Text>
        </View>
        <View style={styles.wineTypeTag}>
          <Text style={styles.wineTypeText}>{wine.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    width: 180,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredCard: {
    width: 200,
  },
  image: {
    width: '100%',
    height: 200,
  },
  featuredImage: {
    height: 250,
  },
  content: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  featuredName: {
    fontSize: 18,
  },
  region: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  wineTypeTag: {
    backgroundColor: colors.primaryLight + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wineTypeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  horizontalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  horizontalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  horizontalContent: {
    padding: 16,
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  horizontalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  sectionContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  aromaTag: {
    backgroundColor: colors.secondaryLight + '20',
  },
  aromaTagText: {
    color: colors.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compactCard: {
    width: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: '100%',
    height: 120,
  },
  compactContent: {
    padding: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  compactRegion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  compactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
});