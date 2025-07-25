import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Sun, CloudRain, Wind, ThermometerSun, Clock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { WineCard } from '@/components/WineCard';
import { SectionHeader } from '@/components/SectionHeader';
import { aiWineRecommendationService } from '@/services/aiWineRecommendationService';
import { wineStorageService } from '@/services/wineStorageService';
import { useAuth } from '@/providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [dailyWines, setDailyWines] = useState([]);
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const [loading, setLoading] = useState(true);
  const [favoriteStates, setFavoriteStates] = useState({});

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const recommendations = await aiWineRecommendationService.getDailyRecommendations();
        
        // Convert AI recommendations to WineCard format
        const wineCards = recommendations.map(rec => ({
          id: rec.id,
          name: rec.name,
          region: rec.region,
          year: rec.year,
          type: rec.type,
          rating: rec.rating,
          price: rec.price,
          imageUrl: rec.imageUrl,
          description: rec.description,
          grapes: rec.grapes,
          characteristics: rec.characteristics,
          pairings: rec.pairings,
          aromas: rec.aromas,
          aiReason: rec.aiReason
        }));
        
        setDailyWines(wineCards);
        
        // Load favorite states for authenticated users
        if (user) {
          await loadFavoriteStates(wineCards);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  const loadFavoriteStates = async (wines) => {
    if (!user) return;
    
    const states = {};
    for (const wine of wines) {
      try {
        // Para recomendações de IA, verificar se existe um vinho similar salvo
        const savedWine = await wineStorageService.findSavedWineByName(wine.name);
        
        if (savedWine) {
          const isFavorite = await wineStorageService.isWineFavorite(savedWine.id);
          states[wine.id] = { isFavorite, savedWineId: savedWine.id };
        } else {
          states[wine.id] = { isFavorite: false, savedWineId: null };
        }
      } catch (error) {
        states[wine.id] = { isFavorite: false, savedWineId: null };
      }
    }
    setFavoriteStates(states);
  };

  const handleFavoriteChange = async (wineId, isFavorite) => {
    if (!user) {
      return;
    }

    // Atualizar estado local imediatamente para melhor UX
    setFavoriteStates(prev => ({
      ...prev,
      [wineId]: { 
        ...prev[wineId], 
        isFavorite 
      }
    }));

    try {
      const wine = dailyWines.find(w => w.id === wineId);
      if (!wine) return;

      if (isFavorite) {
        // Verificar se já existe um vinho similar
        let savedWine = await wineStorageService.findSavedWineByName(wine.name);
        
        if (!savedWine) {
          // Salvar o vinho primeiro
          savedWine = await wineStorageService.saveWineFromAI({
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

        if (savedWine) {
          // Verificar se já é favorito antes de tentar favoritar
          const isAlreadyFavorite = await wineStorageService.isWineFavorite(savedWine.id);
          
          if (!isAlreadyFavorite) {
            await wineStorageService.toggleFavorite(savedWine.id);
          }
          
          setFavoriteStates(prev => ({
            ...prev,
            [wineId]: { isFavorite: true, savedWineId: savedWine.id }
          }));
        }
      } else {
        // Remover dos favoritos
        const currentState = favoriteStates[wineId];
        if (currentState?.savedWineId) {
          await wineStorageService.toggleFavorite(currentState.savedWineId);
        } else {
          // Buscar o vinho salvo pelo nome
          const savedWine = await wineStorageService.findSavedWineByName(wine.name);
          if (savedWine) {
            await wineStorageService.toggleFavorite(savedWine.id);
          }
        }
        
        setFavoriteStates(prev => ({
          ...prev,
          [wineId]: { ...prev[wineId], isFavorite: false }
        }));
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      // Reverter estado em caso de erro
      setFavoriteStates(prev => ({
        ...prev,
        [wineId]: { 
          ...prev[wineId], 
          isFavorite: !isFavorite 
        }
      }));
    }
  };

  const renderWeatherIcon = () => {
    switch (weatherCondition) {
      case 'sunny':
        return <Sun size={24} color={colors.textLight} />;
      case 'rainy':
        return <CloudRain size={24} color={colors.textLight} />;
      case 'windy':
        return <Wind size={24} color={colors.textLight} />;
      default:
        return <ThermometerSun size={24} color={colors.textLight} />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia, Enófilo';
    if (hour < 18) return 'Boa tarde, Enófilo';
    return 'Boa noite, Enófilo';
  };

  const getDayContext = () => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const today = new Date().getDay();
    return days[today];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg' }}
        style={styles.header}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Descobertas do {getDayContext()}</Text>
            </View>
            <View style={styles.weatherContainer}>
              {renderWeatherIcon()}
              <Text style={styles.weatherText}>
                Sugestões perfeitas para hoje
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.featuredContainer}>
          <View style={styles.sectionHeaderContainer}>
            <SectionHeader title="Sugestão do Dia" seeAllLink="library" />
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Gerando sugestões personalizadas...</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.featuredScrollContent}
            >
              {dailyWines.map((wine) => (
                <View key={wine.id} style={styles.wineCardContainer}>
                  <WineCard 
                    wine={wine} 
                    featured 
                    showActions={true}
                    isFavorite={favoriteStates[wine.id]?.isFavorite || false}
                    onFavoriteChange={(isFavorite) => handleFavoriteChange(wine.id, isFavorite)}
                  />
                  {wine.aiReason && (
                    <View style={styles.reasonContainer}>
                      <Text style={styles.reasonText}>{wine.aiReason}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Desafio de Degustação" />
          <TouchableOpacity disabled>
            <ImageBackground
              source={{ uri: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg' }}
              style={styles.challengeCard}
              imageStyle={styles.challengeCardImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.challengeGradient}
              >
                <View style={styles.comingSoonBadge}>
                  <Clock size={16} color={colors.textLight} />
                  <Text style={styles.comingSoonText}>Em breve</Text>
                </View>
                <Text style={styles.challengeTitle}>Desafie seus Amigos</Text>
                <Text style={styles.challengeSubtitle}>
                  Compare suas impressões e aprenda junto
                </Text>
                <View style={styles.disabledButton}>
                  <Text style={styles.disabledButtonText}>Funcionalidade em desenvolvimento</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Perfil Sensorial" />
          <TouchableOpacity disabled>
            <ImageBackground
              source={{ uri: 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg' }}
              style={styles.aromaCard}
              imageStyle={styles.aromaCardImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.aromaContent}
              >
                <View style={styles.comingSoonBadge}>
                  <Clock size={16} color={colors.textLight} />
                  <Text style={styles.comingSoonText}>Em breve</Text>
                </View>
                <Text style={styles.aromaTitle}>Explore Aromas e Sabores</Text>
                <Text style={styles.aromaDescription}>
                  Descubra a roda de aromas e treine seu paladar
                </Text>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 300,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  weatherText: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: -24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
  },
  featuredContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  featuredScrollContent: {
    paddingVertical: 16,
  },
  wineCardContainer: {
    marginRight: 16,
  },
  reasonContainer: {
    backgroundColor: '#4E054C' + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4E054C' + '20',
    maxWidth: 200,
  },
  reasonText: {
    fontSize: 12,
    color: '#4E054C',
    fontWeight: '500',
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  section: {
    marginTop: 40,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  challengeCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
  },
  challengeCardImage: {
    borderRadius: 24,
  },
  challengeGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,193,7,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  aromaCard: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 32,
  },
  aromaCardImage: {
    borderRadius: 24,
  },
  aromaContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  aromaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  aromaDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});