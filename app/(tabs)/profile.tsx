import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Heart, History, CircleUser as UserCircle, Settings, Bell, LogOut, ChevronRight, Wine, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WineCard } from '@/components/WineCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/providers/AuthProvider';
import { wineStorageService, SavedWine } from '@/services/wineStorageService';
import { WineType } from '@/types/wine';
import * as ImagePicker from 'expo-image-picker';
import { userService } from '@/services/userService';

export default function ProfileScreen() {
  const { signOut, user, deleteAccount } = useAuth();
  const [favorites, setFavorites] = useState<WineType[]>([]);
  const [savedWines, setSavedWines] = useState<WineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
      // Initialize avatar URL from user metadata
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [favoritesData, savedWinesData] = await Promise.all([
        wineStorageService.getUserFavorites(),
        wineStorageService.getUserSavedWines()
      ]);

      setFavorites(convertSavedWinesToWineType(favoritesData));
      setSavedWines(convertSavedWinesToWineType(savedWinesData));
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const convertSavedWinesToWineType = (savedWines: SavedWine[]): WineType[] => {
    return savedWines.map(wine => ({
      id: `saved-${wine.id}`,
      name: wine.wine_name,
      type: wine.wine_type || 'Vinho',
      region: wine.region || 'Região não informada',
      year: wine.vintage || '2020',
      rating: wine.rating || 4.0,
      price: wine.price_range || 'Preço não informado',
      imageUrl: wine.image_url || 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
      description: wine.description,
      grapes: wine.grape_varieties?.join(', ') || wine.wine_name,
      characteristics: [],
      pairings: wine.food_pairings || [],
      aromas: []
    }));
  };

  const handleFavoriteChange = async (wineId: string, isFavorite: boolean) => {
    try {
      // Atualizar estado local imediatamente para melhor UX
      if (isFavorite) {
        // Adicionar aos favoritos
        const savedWine = savedWines.find(w => w.id === wineId);
        if (savedWine) {
          setFavorites(prev => {
            // Verificar se já existe para evitar duplicatas
            const exists = prev.some(f => f.id === wineId);
            if (!exists) {
              return [...prev, savedWine];
            }
            return prev;
          });
        }
      } else {
        // Remover dos favoritos
        setFavorites(prev => prev.filter(w => w.id !== wineId));
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      // Recarregar dados em caso de erro
      loadUserData();
    }
  };

  const toggleNotifications = () => setNotifications(!notifications);
  const toggleLocationServices = () => setLocationServices(!locationServices);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            setLoggingOut(true);
            signOut();
            setTimeout(() => setLoggingOut(false), 2000);
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await deleteAccount();
            } catch (error) {
              console.error('Erro ao excluir conta:', error);
              Alert.alert('Erro', 'Não foi possível excluir sua conta. Tente novamente.');
              setDeletingAccount(false);
            }
          }
        }
      ]
    );
  };
  const handleEditPhoto = async () => {
    try {
      // 1. Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
        return;
      }

      // 2. Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploadingAvatar(true);

        // 3. Upload image
        const publicUrl = await userService.uploadAvatar(user.id, result.assets[0].uri);

        if (publicUrl) {
          setAvatarUrl(publicUrl);
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        } else {
          Alert.alert('Erro', 'Falha ao atualizar a foto de perfil. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Error changing photo:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Wine size={64} color={colors.primary} />
          <Text style={styles.loginTitle}>Faça login para ver seu perfil</Text>
          <Text style={styles.loginSubtitle}>
            Acesse sua biblioteca de vinhos, favoritos e muito mais
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.header}
      >
        <Image
          source={{ uri: avatarUrl || 'https://images.pexels.com/photos/2147486/pexels-photo-2147486.jpeg' }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>
          {user?.email ? user.email.split('@')[0] : 'Usuário'}
        </Text>
        <Text style={styles.profileBio}>Enófilo e amante de vinhos</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{savedWines.length}</Text>
            <Text style={styles.statLabel}>Vinhos Salvos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Regiões</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando seus vinhos...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Heart size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Favoritos</Text>
              </View>
              {favorites.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Ver Todos</Text>
                </TouchableOpacity>
              )}
            </View>

            {favorites.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoritesContainer}
              >
                {favorites.slice(0, 5).map((wine) => (
                  <WineCard
                    key={wine.id}
                    wine={wine}
                    compact
                    showActions
                    isFavorite={true}
                    onFavoriteChange={(isFavorite) => handleFavoriteChange(wine.id, isFavorite)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Heart size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Nenhum favorito ainda</Text>
                <Text style={styles.emptyStateSubtext}>
                  Favorite vinhos para vê-los aqui
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <History size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Vinhos Salvos</Text>
              </View>
              {savedWines.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Ver Todos</Text>
                </TouchableOpacity>
              )}
            </View>

            {savedWines.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoritesContainer}
              >
                {savedWines.slice(0, 5).map((wine) => (
                  <WineCard
                    key={wine.id}
                    wine={wine}
                    compact
                    showActions
                    isFavorite={favorites.some(f => f.id === wine.id)}
                    onFavoriteChange={(isFavorite) => handleFavoriteChange(wine.id, isFavorite)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Wine size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Nenhum vinho salvo</Text>
                <Text style={styles.emptyStateSubtext}>
                  Use o scanner para analisar e salvar vinhos
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Settings size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Configurações</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={[styles.settingsItem, uploadingAvatar && styles.settingsItemDisabled]}
            onPress={handleEditPhoto}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size={20} color={colors.primary} />
            ) : (
              <UserCircle size={20} color={colors.text} />
            )}
            <Text style={styles.settingsLabel}>
              {uploadingAvatar ? 'Enviando foto...' : 'Editar Foto'}
            </Text>
            {!uploadingAvatar && <ChevronRight size={16} color={colors.textSecondary} />}
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <View style={styles.settingsItem}>
            <Bell size={20} color={colors.text} />
            <Text style={styles.settingsLabel}>Notificações</Text>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notifications ? colors.primary : colors.card}
            />
          </View>

          <View style={styles.settingsDivider} />

          <View style={styles.settingsItem}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/674783/pexels-photo-674783.jpeg' }}
              style={styles.locationIcon}
            />
            <Text style={styles.settingsLabel}>Usar Localização</Text>
            <Switch
              value={locationServices}
              onValueChange={toggleLocationServices}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={locationServices ? colors.primary : colors.card}
            />
          </View>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={[styles.settingsItem, deletingAccount && styles.settingsItemDisabled]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount || loggingOut}
          >
            {deletingAccount ? (
              <ActivityIndicator size={20} color="#EF4444" />
            ) : (
              <Trash2 size={20} color="#EF4444" />
            )}
            <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>
              {deletingAccount ? 'Excluindo conta...' : 'Excluir conta'}
            </Text>
            {!deletingAccount && <ChevronRight size={16} color={colors.textSecondary} />}
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={[styles.settingsItem, loggingOut && styles.settingsItemDisabled]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size={20} color={colors.textSecondary} />
            ) : (
              <LogOut size={20} color={colors.text} />
            )}
            <Text style={[styles.settingsLabel, loggingOut && styles.settingsLabelDisabled]}>
              {loggingOut ? 'Saindo...' : 'Sair'}
            </Text>
            {!loggingOut && <ChevronRight size={16} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.textLight,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileBio: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  favoritesContainer: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  settingsItemDisabled: {
    opacity: 0.6,
  },
  settingsLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  settingsLabelDisabled: {
    color: colors.textSecondary,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});