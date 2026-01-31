import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { ChevronRight, Search, Wine, Filter, X, Utensils, Grape, MapPin } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { FilterChip } from '@/components/FilterChip';
import { CollapsibleFilterSection } from '@/components/CollapsibleFilterSection';
import { usePairings } from '@/hooks/usePairings';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PairingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('wine');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    grapes: any[];
    wineTypes: any[];
    countries: any[];
    regions: any[];
    characteristics: any[];
    aromas: any[];
    foodCategories: any[];
    foodNames: any[];
    dietaryRestrictions: any[];
  }>({
    grapes: [],
    wineTypes: [],
    countries: [],
    regions: [],
    characteristics: [],
    aromas: [],
    foodCategories: [],
    foodNames: [],
    dietaryRestrictions: []
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    loading,
    grapes,
    foodPairings,
    characteristics,
    aromas,
    countries,
    regions,
    wineTypes,
    filterDataByGrape,
    filterDataByWineType,
    updateFilteredRegions,
    resetFilters,
    searchPairings
  } = usePairings(activeTab as 'wine' | 'food');

  const hasActiveFilters = () => {
    return Object.values(selectedFilters).some(filters => filters.length > 0) || searchQuery.trim().length > 0;
  };

  // New function to encapsulate the search logic
  const handleSearch = async () => {
    try {
      setIsSearching(true); // Use local loading state for search
      const results = await searchPairings({
        search: searchQuery,
        grapeIds: selectedFilters.grapes,
        wineTypes: selectedFilters.wineTypes,
        foodCategories: selectedFilters.foodCategories,
        foodNames: selectedFilters.foodNames,
        dietaryRestrictions: selectedFilters.dietaryRestrictions,
        characteristicIds: selectedFilters.characteristics,
        aromaIds: selectedFilters.aromas,
        countryIds: selectedFilters.countries,
        regionIds: selectedFilters.regions
      });
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching pairings:', error);
    } finally {
      setIsSearching(false); // Reset local loading state
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
      wineTypes: [],
      countries: [],
      regions: [],
      characteristics: [],
      aromas: [],
      foodCategories: [],
      foodNames: [],
      dietaryRestrictions: []
    });
    setSearchQuery('');
    setSearchResults([]);
    resetFilters();
  };

  const tabs = [
    { id: 'wine', label: 'Por Vinho', icon: Wine },
    { id: 'food', label: 'Por Comida', icon: Utensils },
  ];

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
          filterDataByGrape(newValues[0]);
        } else if (newValues.length === 0) {
          resetFilters();
        }
      }

      // If selecting wine types, update available grapes
      if (category === 'wineTypes') {
        if (newValues.length > 0) {
          filterDataByWineType(newValues[0]); // For now, only handle one wine type
        } else {
          resetFilters();
        }
      }

      // If toggling countries, update the filtered regions
      if (category === 'countries') {
        updateFilteredRegions(newValues);
        // Clear selected regions when changing countries
        updatedFilters.regions = [];
      }

      return updatedFilters;
    });
  };

  const renderWelcomeMessage = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>
        {activeTab === 'wine'
          ? 'Descubra Harmonizações Perfeitas'
          : 'Encontre o Vinho Ideal'}
      </Text>
      <Text style={styles.welcomeText}>
        {activeTab === 'wine'
          ? 'Explore combinações deliciosas para seus vinhos favoritos. Use os filtros para encontrar as melhores harmonizações gastronômicas.'
          : 'Descubra vinhos que combinam perfeitamente com suas receitas favoritas. Utilize os filtros para encontrar a harmonização ideal.'}
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

  const renderFilters = () => {
    if (activeTab === 'wine') {
      return (
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

          {/* Add padding at the bottom to ensure content is not hidden by the fixed button */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.filtersScroll} contentContainerStyle={styles.filtersScrollContent}>
        <CollapsibleFilterSection title="Pratos" initialExpanded={false}>
          <View style={styles.filterRow}>
            {(foodPairings || []).map(food => (
              <FilterChip
                key={food.id}
                label={food.name}
                selected={selectedFilters.foodNames.includes(food.name)}
                onPress={() => toggleFilter('foodNames', food.name)}
              />
            ))}
          </View>
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Categorias de Comida">
          <View style={styles.filterRow}>
            {Array.from(new Set((foodPairings || []).map(food => food.category))).map(category => (
              <FilterChip
                key={category}
                label={category}
                selected={selectedFilters.foodCategories.includes(category)}
                onPress={() => toggleFilter('foodCategories', category)}
              />
            ))}
          </View>
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Restrições Alimentares">
          <View style={styles.filterRow}>
            {['vegano', 'vegetariano', 'sem glúten'].map(restriction => (
              <FilterChip
                key={restriction}
                label={restriction}
                selected={selectedFilters.dietaryRestrictions.includes(restriction)}
                onPress={() => toggleFilter('dietaryRestrictions', restriction)}
              />
            ))}
          </View>
        </CollapsibleFilterSection>

        {/* Add padding at the bottom to ensure content is not hidden by the fixed button */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  if (showFilters) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.filterFullScreen}
      >

        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                // The main screen does clearFilters(). Let's keep consistency.
                clearFilters();
              }}
            >
              <tab.icon
                size={20}
                color={activeTab === tab.id ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={clearFilters} style={styles.clearFilterButton}>
          <Text style={styles.clearText}>Limpar filtros</Text>
        </TouchableOpacity>



        <View style={styles.filterContentContainer}>
          {renderFilters()}

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
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => {
              setActiveTab(tab.id);
              clearFilters();
            }}
          >
            <tab.icon
              size={20}
              color={activeTab === tab.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasActiveFilters() && (
        <View style={[styles.searchContainer]}>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.card }]}
            onPress={() => setShowFilters(true)}
          >
            <View style={styles.searchPlaceholder}>
              <Text style={[styles.searchPlaceholderText, { color: colors.textSecondary }]}>
                {activeTab === 'wine' ? "Buscar vinhos e filtros..." : "Buscar pratos e filtros..."}
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
          <Text style={styles.loadingText}>Buscando harmonizações...</Text>
        </View>
      ) : !hasActiveFilters() ? (
        renderWelcomeMessage()
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              {activeTab === 'wine' ? (
                <>
                  <Text style={styles.resultTitle}>{item.name}</Text>
                  <View style={styles.resultMeta}>
                    <Wine size={16} color={colors.primary} />
                    <Text style={styles.resultMetaText}>{item.wine_type}</Text>
                  </View>
                  {item.country && (
                    <View style={styles.resultMeta}>
                      <MapPin size={16} color={colors.primary} />
                      <Text style={styles.resultMetaText}>{item.country.name}</Text>
                    </View>
                  )}
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Harmoniza com:</Text>
                  <View style={styles.tagsContainer}>
                    {(item.food_pairings || [])
                      .filter(fp => fp.food_pairing)
                      .map(({ id, food_pairing }) => (
                        <View key={id} style={styles.tag}>
                          <Text style={styles.tagText}>{food_pairing.name}</Text>
                        </View>
                      ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.resultTitle}>{item.name}</Text>
                  <Text style={styles.resultCategory}>{item.category}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Vinhos Recomendados:</Text>
                  {(item.grape_pairings || [])
                    .filter(gp => gp.grape)
                    .map(({ id, grape }) => (
                      <View key={id} style={styles.wineRecommendation}>
                        <View style={styles.wineTypeTag}>
                          <Text style={styles.wineTypeText}>{grape.wine_type}</Text>
                        </View>
                        <Text style={styles.grapeName}>{grape.name}</Text>
                        <Text style={styles.grapeDescription}>{grape.description}</Text>
                      </View>
                    ))}
                </>
              )}
            </View>
          ))}
        </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  searchBarContainer: {
    padding: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    minHeight: 40,
    paddingVertical: 8,
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
  resultsContainer: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultMetaText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultCategory: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  wineRecommendation: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  wineTypeTag: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  wineTypeText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  grapeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  grapeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  clearFilterButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
});