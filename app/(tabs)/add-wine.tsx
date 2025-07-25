import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { FilterChip } from '@/components/FilterChip';
import { colors } from '@/constants/colors';

export default function AddWineScreen() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [wineType, setWineType] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);
  const [selectedAromas, setSelectedAromas] = useState<string[]>([]);
  const [selectedFoodPairings, setSelectedFoodPairings] = useState<string[]>([]);

  // Reference data
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [characteristics, setCharacteristics] = useState([]);
  const [aromas, setAromas] = useState([]);
  const [foodPairings, setFoodPairings] = useState([]);

  // Wine types
  const wineTypes = [
    'Vinho Tinto',
    'Vinho Branco',
    'Vinho Rosé',
    'Espumante',
    'Vinho de Sobremesa'
  ];

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [countriesData, characteristicsData, aromasData, foodPairingsData] = await Promise.all([
        supabase.from('countries').select('*').order('name'),
        supabase.from('characteristics').select('*').order('name'),
        supabase.from('aromas').select('*').order('name'),
        supabase.from('food_pairings').select('*').order('name')
      ]);

      if (countriesData.error) throw countriesData.error;
      if (characteristicsData.error) throw characteristicsData.error;
      if (aromasData.error) throw aromasData.error;
      if (foodPairingsData.error) throw foodPairingsData.error;

      setCountries(countriesData.data || []);
      setCharacteristics(characteristicsData.data || []);
      setAromas(aromasData.data || []);
      setFoodPairings(foodPairingsData.data || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados de referência');
    }
  };

  useEffect(() => {
    if (selectedCountry) {
      loadRegions(selectedCountry);
    } else {
      setRegions([]);
      setSelectedRegions([]);
    }
  }, [selectedCountry]);

  const loadRegions = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
      Alert.alert('Erro', 'Não foi possível carregar as regiões');
    }
  };

  const checkDuplicateName = async (grapeName: string) => {
    try {
      const { data, error } = await supabase
        .from('grapes')
        .select('id')
        .eq('name', grapeName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking duplicate name:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!name || !wineType || !selectedCountry) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Check for duplicate name
      const isDuplicate = await checkDuplicateName(name);
      if (isDuplicate) {
        Alert.alert('Erro', 'Já existe um vinho cadastrado com este nome. Por favor, escolha um nome diferente.');
        return;
      }

      // Insert the grape
      const { data: grapeData, error: grapeError } = await supabase
        .from('grapes')
        .insert({
          name,
          description,
          type: wineType,
          wine_type: wineType,
          origin_country_id: selectedCountry
        })
        .select()
        .single();

      if (grapeError) throw grapeError;

      // Insert characteristics relationships
      if (selectedCharacteristics.length > 0) {
        const { error: charError } = await supabase
          .from('grape_characteristics')
          .insert(
            selectedCharacteristics.map(charId => ({
              grape_id: grapeData.id,
              characteristic_id: charId
            }))
          );
        if (charError) throw charError;
      }

      // Insert aroma relationships
      if (selectedAromas.length > 0) {
        const { error: aromaError } = await supabase
          .from('grape_aromas')
          .insert(
            selectedAromas.map(aromaId => ({
              grape_id: grapeData.id,
              aroma_id: aromaId
            }))
          );
        if (aromaError) throw aromaError;
      }

      // Insert region relationships
      if (selectedRegions.length > 0) {
        const { error: regionError } = await supabase
          .from('grape_regions')
          .insert(
            selectedRegions.map(regionId => ({
              grape_id: grapeData.id,
              region_id: regionId
            }))
          );
        if (regionError) throw regionError;
      }

      // Insert food pairing relationships
      if (selectedFoodPairings.length > 0) {
        const { error: foodError } = await supabase
          .from('grape_food_pairings')
          .insert(
            selectedFoodPairings.map(foodId => ({
              grape_id: grapeData.id,
              food_pairing_id: foodId
            }))
          );
        if (foodError) throw foodError;
      }

      Alert.alert('Sucesso', 'Vinho adicionado com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Error saving wine:', error);
      Alert.alert('Erro', 'Não foi possível salvar o vinho');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setWineType('');
    setSelectedCountry('');
    setSelectedRegions([]);
    setSelectedCharacteristics([]);
    setSelectedAromas([]);
    setSelectedFoodPairings([]);
  };

  const toggleSelection = (setter: Function, currentValues: string[]) => (id: string) => {
    setter(
      currentValues.includes(id)
        ? currentValues.filter(v => v !== id)
        : [...currentValues, id]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Salvando vinho...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>Nome do Vinho *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Digite o nome do vinho"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Vinho *</Text>
          <View style={styles.chipContainer}>
            {wineTypes.map((type, index) => (
              <FilterChip
                key={`${type}-${index}`}
                label={type}
                selected={wineType === type}
                onPress={() => setWineType(type === wineType ? '' : type)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva as características do vinho"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>País de Origem *</Text>
          <View style={styles.chipContainer}>
            {countries.map((country, index) => (
              <FilterChip
                key={`${country.id}-${index}`}
                label={country.name}
                selected={selectedCountry === country.id}
                onPress={() => setSelectedCountry(
                  selectedCountry === country.id ? '' : country.id
                )}
              />
            ))}
          </View>
        </View>

        {selectedCountry && regions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Regiões</Text>
            <View style={styles.chipContainer}>
              {regions.map((region, index) => (
                <FilterChip
                  key={`${region.id}-${index}`}
                  label={region.name}
                  selected={selectedRegions.includes(region.id)}
                  onPress={() => toggleSelection(setSelectedRegions, selectedRegions)(region.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Características</Text>
          <View style={styles.chipContainer}>
            {characteristics.map((char, index) => (
              <FilterChip
                key={`${char.id}-${index}`}
                label={char.name}
                selected={selectedCharacteristics.includes(char.id)}
                onPress={() => toggleSelection(setSelectedCharacteristics, selectedCharacteristics)(char.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Aromas</Text>
          <View style={styles.chipContainer}>
            {aromas.map((aroma, index) => (
              <FilterChip
                key={`${aroma.id}-${index}`}
                label={aroma.name}
                selected={selectedAromas.includes(aroma.id)}
                onPress={() => toggleSelection(setSelectedAromas, selectedAromas)(aroma.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Harmonizações</Text>
          <View style={styles.chipContainer}>
            {foodPairings.map((food, index) => (
              <FilterChip
                key={`${food.id}-${index}`}
                label={food.name}
                selected={selectedFoodPairings.includes(food.id)}
                onPress={() => toggleSelection(setSelectedFoodPairings, selectedFoodPairings)(food.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}>
            <Text style={styles.saveButtonText}>Salvar Vinho</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 48,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});