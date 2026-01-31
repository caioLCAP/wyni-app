import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { WineCard } from '@/components/WineCard';
import { FilterChip } from '@/components/FilterChip';
import { CollapsibleFilterSection } from '@/components/CollapsibleFilterSection';
import { supabase } from '@/services/supabaseClient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LibraryScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Reference data
  const [grapes, setGrapes] = useState<any[]>([]);
  const [allGrapes, setAllGrapes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [allRegions, setAllRegions] = useState<any[]>([]);
  const [aromas, setAromas] = useState<any[]>([]);
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [wineTypes, setWineTypes] = useState<any[]>([]);

  // Selected filters
  const [selectedFilters, setSelectedFilters] = useState<{
    grapes: any[];
    countries: any[];
    regions: any[];
    aromas: any[];
    characteristics: any[];
    wineTypes: any[];
  }>({
    grapes: [],
    countries: [],
    regions: [],
    aromas: [],
    characteristics: [],
    wineTypes: []
  });

  // Load reference data
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [grapesData, countriesData, regionsData, aromasData, characteristicsData] = await Promise.all([
        supabase.from('grapes').select('id, name, type, wine_type'),
        supabase.from('countries').select('id, name'),
        supabase.from('regions').select('id, name, country:countries(id, name)'),
        supabase.from('aromas').select('id, name, category'),
        supabase.from('characteristics').select('id, name, category')
      ]);

      const grapes = grapesData.data || [];
      setGrapes(grapes);
      setAllGrapes(grapes);

      // Extract unique wine types
      const uniqueWineTypes = Array.from(new Set(grapes.map(g => g.wine_type))).filter(Boolean);
      setWineTypes(uniqueWineTypes);

      setCountries(countriesData.data || []);
      setRegions(regionsData.data || []);
      setAllRegions(regionsData.data || []);
      setAromas(aromasData.data || []);
      setCharacteristics(characteristicsData.data || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const hasActiveFilters = () => {
    return searchQuery.trim().length > 0 ||
      Object.values(selectedFilters).some(filters => filters.length > 0);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('grapes')
        .select(`
          *,
          country:origin_country_id(id, name),
          characteristics:grape_characteristics(
            characteristic:characteristics(*)
          ),
          aromas:grape_aromas(
            aroma:aromas(*)
          ),
          regions:grape_regions(
            region:regions(*)
          )
        `);

      // Apply text search
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply filters
      if (selectedFilters.grapes.length) {
        query = query.in('id', selectedFilters.grapes);
      }
      if (selectedFilters.wineTypes.length) {
        query = query.in('wine_type', selectedFilters.wineTypes);
      }
      if (selectedFilters.countries.length) {
        query = query.in('origin_country_id', selectedFilters.countries);
      }
      if (selectedFilters.characteristics.length) {
        query = query.in('characteristics.characteristic_id', selectedFilters.characteristics);
      }
      if (selectedFilters.aromas.length) {
        query = query.in('aromas.aroma_id', selectedFilters.aromas);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      console.error('Error searching wines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (!searchQuery && !hasActiveFilters()) {
      Alert.alert(
        'Nenhum filtro selecionado',
        'Por favor, selecione pelo menos um filtro ou digite um termo de busca.'
      );
      return;
    }
    setShowFilters(false);
    handleSearch();
  };

  const clearFilters = () => {
    setSelectedFilters({
      grapes: [],
      countries: [],
      regions: [],
      aromas: [],
      characteristics: [],
      wineTypes: []
    });
    setSearchQuery('');
    setWines([]);
    setRegions(allRegions);
    setGrapes(allGrapes);
    setWineTypes(Array.from(new Set(allGrapes.map(g => g.wine_type))).filter(Boolean));
  };

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      let updatedFilters = {
        ...prev,
        [category]: newValues
      };

      // If selecting a grape, update wine types
      if (category === 'grapes') {
        if (newValues.length === 1) {
          // When selecting a single grape
          const selectedGrape = allGrapes.find(g => g.id === newValues[0]);
          if (selectedGrape) {
            updatedFilters.wineTypes = [selectedGrape.wine_type];
          }
        } else if (newValues.length > 1) {
          // When multiple grapes are selected
          const selectedWineTypes = allGrapes
            .filter(g => newValues.includes(g.id))
            .map(g => g.wine_type);
          updatedFilters.wineTypes = Array.from(new Set(selectedWineTypes));
        } else {
          // When no grapes are selected
          updatedFilters.wineTypes = [];
        }
      }

      // If selecting wine types, update available grapes
      if (category === 'wineTypes') {
        if (newValues.length > 0) {
          const filteredGrapes = allGrapes.filter(g => newValues.includes(g.wine_type));
          setGrapes(filteredGrapes);
        } else {
          setGrapes(allGrapes);
        }
      }

      // If toggling countries, update the filtered regions
      if (category === 'countries') {
        if (newValues.length === 0) {
          setRegions(allRegions);
        } else {
          const filtered = allRegions.filter(region =>
            newValues.includes(region.country?.id)
          );
          setRegions(filtered);
        }

        // Clear selected regions when changing countries
        updatedFilters.regions = [];
      }

      return updatedFilters;
    });
  };

  const renderWelcomeMessage = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>Biblioteca de Vinhos</Text>
      <Text style={styles.welcomeText}>
        Explore nossa coleção de vinhos usando a barra de busca acima ou aplique filtros para encontrar o vinho perfeito para você.
      </Text>
      <TouchableOpacity
        style={styles.startSearchButton}
        onPress={() => setShowFilters(true)}
      >
        <Filter size={20} color={colors.textLight} />
        <Text style={styles.startSearchButtonText}>Abrir Filtros</Text>
      </TouchableOpacity>
    </View>
  );

  if (showFilters) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.filterFullScreen}
      >
        <View style={styles.filterHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilters(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.filterHeaderTitle}>Filtros</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        </View>



        <View style={styles.filterContentContainer}>
          <ScrollView style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
            <CollapsibleFilterSection title="Tipos de Vinho" initialExpanded={false}>
              <View style={styles.filterRow}>
                {wineTypes.map(type => (
                  <FilterChip
                    key={type}
                    label={type}
                    selected={selectedFilters.wineTypes.includes(type)}
                    onPress={() => toggleFilter('wineTypes', type)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection title="Uvas">
              <View style={styles.filterRow}>
                {grapes.map(grape => (
                  <FilterChip
                    key={grape.id}
                    label={grape.name}
                    selected={selectedFilters.grapes.includes(grape.id)}
                    onPress={() => toggleFilter('grapes', grape.id)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection title="Características">
              <View style={styles.filterRow}>
                {characteristics.map(char => (
                  <FilterChip
                    key={char.id}
                    label={char.name}
                    selected={selectedFilters.characteristics.includes(char.id)}
                    onPress={() => toggleFilter('characteristics', char.id)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection title="Aromas">
              <View style={styles.filterRow}>
                {aromas.map(aroma => (
                  <FilterChip
                    key={aroma.id}
                    label={aroma.name}
                    selected={selectedFilters.aromas.includes(aroma.id)}
                    onPress={() => toggleFilter('aromas', aroma.id)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection title="Países">
              <View style={styles.filterRow}>
                {countries.map(country => (
                  <FilterChip
                    key={country.id}
                    label={country.name}
                    selected={selectedFilters.countries.includes(country.id)}
                    onPress={() => toggleFilter('countries', country.id)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection title="Regiões">
              <View style={styles.filterRow}>
                {regions.map(region => (
                  <FilterChip
                    key={region.id}
                    label={region.name}
                    selected={selectedFilters.regions.includes(region.id)}
                    onPress={() => toggleFilter('regions', region.id)}
                  />
                ))}
              </View>
            </CollapsibleFilterSection>

            {/* Add padding at the bottom to ensure content is not hidden by the fixed button */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {hasActiveFilters() && (
        <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.card }]}
            onPress={() => setShowFilters(true)}
          >
            <View style={styles.searchPlaceholder}>
              <Text style={[styles.searchPlaceholderText, { color: colors.textSecondary }]}>
                Buscar vinhos...
              </Text>
            </View>
            <View style={[styles.filterIconBadge, { backgroundColor: colors.primary + '10' }]}>
              <Filter size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando vinhos...</Text>
        </View>
      ) : (
        <FlatList
          data={wines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WineCard
              wine={{
                id: item.id,
                name: item.name,
                type: item.wine_type,
                region: item.country?.name,
                description: item.description,
                characteristics: item.characteristics?.map(c => c.characteristic.name) || [],
                aromas: item.aromas?.map(a => a.aroma.name) || [],
                imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg'
              }}
              horizontal
            />
          )}
          ListEmptyComponent={renderWelcomeMessage}
          contentContainerStyle={styles.wineList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterFullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContentContainer: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    zIndex: 10, // Ensure it's on top
    backgroundColor: 'transparent', // Let parent bg show through
  },
  searchBarContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchPlaceholderText: {
    fontSize: 16,
  },
  filterIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height: '100%',
    minHeight: 40, // Ensure minimum tappable area
    paddingVertical: 8, // Add padding for easier tapping
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight + '20',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  filterHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
  },
  filtersScroll: {
    flex: 1,
  },
  filtersScrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to account for the fixed button
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80, // Adjust this value based on your button height
  },
  wineList: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  welcomeContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startSearchButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startSearchButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});