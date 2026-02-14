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
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { wineStorageService } from '@/services/wineStorageService';
import { FilterChip } from '@/components/FilterChip';
import { CollapsibleSection } from '@/components/CollapsibleSection';
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

  // Novos campos opcionais
  const [vintage, setVintage] = useState('');
  const [producer, setProducer] = useState('');
  const [alcoholContent, setAlcoholContent] = useState('');
  const [servingTemperature, setServingTemperature] = useState('');
  const [agingPotential, setAgingPotential] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Reference data
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [aromas, setAromas] = useState<any[]>([]);
  const [foodPairings, setFoodPairings] = useState<any[]>([]);

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

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Não foi possível capturar a foto');
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

      // Upload image if exists
      let imageUrl = null;
      if (imageUri) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          imageUrl = await wineStorageService.uploadWineImage(user.id, imageUri);
        }
      }

      // Insert the grape
      const { data: grapeData, error: grapeError } = await supabase
        .from('grapes')
        .insert({
          name,
          description,
          type: wineType,
          wine_type: wineType,
          origin_country_id: selectedCountry,
          vintage: vintage || null,
          producer: producer || null,
          alcohol_content: alcoholContent || null,
          serving_temperature: servingTemperature || null,
          aging_potential: agingPotential || null,
          price: price || null,
          image_url: imageUrl
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

      Alert.alert('Sucesso', 'Vinho adicionado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.push('/')
        }
      ]);
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
    setVintage('');
    setProducer('');
    setAlcoholContent('');
    setServingTemperature('');
    setAgingPotential('');
    setPrice('');
    setImageUri(null);
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

        {/* Informações Básicas */}
        <CollapsibleSection title="Informações Básicas" defaultExpanded={true} required={true}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome do Vinho *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite o nome do vinho"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
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

          <View style={styles.fieldGroup}>
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
        </CollapsibleSection>

        {/* Foto do Vinho */}
        <CollapsibleSection title="Foto do Vinho" defaultExpanded={true}>
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color={colors.textSecondary} />
                <Text style={styles.imagePlaceholderText}>Nenhuma foto selecionada</Text>
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImageFromGallery}>
                <ImageIcon size={20} color={colors.textLight} />
                <Text style={styles.imageButtonText}>Galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={takePhoto}>
                <Camera size={20} color={colors.textLight} />
                <Text style={styles.imageButtonText}>Câmera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CollapsibleSection>

        {/* Detalhes do Produto */}
        <CollapsibleSection title="Detalhes do Produto" defaultExpanded={false}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Safra / Ano</Text>
            <TextInput
              style={styles.input}
              value={vintage}
              onChangeText={setVintage}
              placeholder="Ex: 2020"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Produtor / Vinícola</Text>
            <TextInput
              style={styles.input}
              value={producer}
              onChangeText={setProducer}
              placeholder="Nome do produtor ou vinícola"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Teor Alcoólico</Text>
            <TextInput
              style={styles.input}
              value={alcoholContent}
              onChangeText={setAlcoholContent}
              placeholder="Ex: 13.5%"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Preço</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Ex: R$ 150,00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </CollapsibleSection>

        {/* Origem */}
        <CollapsibleSection title="Origem" defaultExpanded={false} required={true}>
          <View style={styles.fieldGroup}>
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
            <View style={styles.fieldGroup}>
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
        </CollapsibleSection>

        {/* Características */}
        <CollapsibleSection title="Características" defaultExpanded={false}>
          <View style={styles.fieldGroup}>
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
        </CollapsibleSection>

        {/* Aromas */}
        <CollapsibleSection title="Aromas" defaultExpanded={false}>
          <View style={styles.fieldGroup}>
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
        </CollapsibleSection>

        {/* Harmonizações */}
        <CollapsibleSection title="Harmonizações" defaultExpanded={false}>
          <View style={styles.fieldGroup}>
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
        </CollapsibleSection>

        {/* Recomendações de Consumo */}
        <CollapsibleSection title="Recomendações de Consumo" defaultExpanded={false}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Temperatura de Serviço</Text>
            <TextInput
              style={styles.input}
              value={servingTemperature}
              onChangeText={setServingTemperature}
              placeholder="Ex: 16-18°C"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Potencial de Guarda</Text>
            <TextInput
              style={styles.input}
              value={agingPotential}
              onChangeText={setAgingPotential}
              placeholder="Ex: 5-10 anos"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </CollapsibleSection>

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
  fieldGroup: {
    marginBottom: 16,
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
  imageSection: {
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: 200,
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  removeImageText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
  },
  imagePlaceholder: {
    width: 200,
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
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