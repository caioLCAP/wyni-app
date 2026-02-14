import { useLocalSearchParams, Stack, router } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { wineStorageService, SavedWine } from '@/services/wineStorageService';
import { WineDetailsCard } from '@/components/WineDetailsCard';
import { colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WineDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [wine, setWine] = useState<SavedWine | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadWine();
        }
    }, [id]);

    const loadWine = async () => {
        try {
            if (typeof id === 'string') {
                const data = await wineStorageService.getSavedWineById(id);
                setWine(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!wine) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalhes do Vinho</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.notFoundText}>Vinho não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Prepara os dados para o WineDetailsCard
    // Tenta extrair informações mais detalhadas do ai_analysis se disponível
    const characteristics = wine.ai_analysis?.characteristics || [];
    const aromas = wine.ai_analysis?.aromas || [];

    // Formata a localização
    const location = wine.location_city
        ? `${wine.location_city}${wine.location_country ? `, ${wine.location_country}` : ''}`
        : wine.location_country;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Detalhes</Text>
                <View style={{ width: 40 }} />
            </View>

            <WineDetailsCard
                wine={{
                    id: wine.id,
                    name: wine.wine_name,
                    region: wine.region || 'Região desconhecida',
                    grapes: Array.isArray(wine.grape_varieties)
                        ? wine.grape_varieties.join(', ')
                        : (wine.grape_varieties || ''),
                    year: wine.vintage || 'NV',
                    type: wine.wine_type || 'Vinho',
                    rating: wine.rating || 0,
                    price: wine.price_range || '',
                    imageUrl: wine.image_url || 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
                    description: wine.tasting_notes || wine.description, // Prioriza tasting_notes que pode ter "O que mais gostou"
                    pairings: wine.food_pairings || [],
                    characteristics: characteristics,
                    aromas: aromas,
                    weather: wine.weather,
                    moment: wine.moment_type,
                    location: location
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFoundText: {
        fontSize: 16,
        color: colors.textSecondary,
    }
});
