import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

// Define types based on the database schema
type Country = {
  id: string;
  name: string;
};

type Region = {
  id: string;
  name: string;
  country?: Country;
  country_id?: string;
};

type Grape = {
  id: string;
  name: string;
  type: string;
  wine_type: string | null;
  description: string | null;
  origin_country_id: string | null;
  grape_characteristics?: Array<{ characteristic_id: string }>;
  grape_aromas?: Array<{ aroma_id: string }>;
  grape_regions?: Array<{ region_id: string }>;
  food_pairings?: Array<{
    id: string;
    food_pairing: {
      id: string;
      name: string;
      category: string;
      dietary_restrictions: string[] | null;
    };
  }>;
};

type FoodPairing = {
  id: string;
  name: string;
  category: string;
  dietary_restrictions: string[] | null;
  grape_pairings?: Array<{
    id: string;
    grape: {
      id: string;
      name: string;
      wine_type: string;
      description: string | null;
    };
  }>;
};

type Characteristic = {
  id: string;
  name: string;
  category: string;
};

type Aroma = {
  id: string;
  name: string;
  category: string;
};

export function usePairings(mode: 'wine' | 'food') {
  const [loading, setLoading] = useState(true);
  const [allGrapes, setAllGrapes] = useState<Grape[]>([]);
  const [grapes, setGrapes] = useState<Grape[]>([]);
  const [allFoodPairings, setAllFoodPairings] = useState<FoodPairing[]>([]);
  const [foodPairings, setFoodPairings] = useState<FoodPairing[]>([]);
  const [allCharacteristics, setAllCharacteristics] = useState<Characteristic[]>([]);
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [allAromas, setAllAromas] = useState<Aroma[]>([]);
  const [aromas, setAromas] = useState<Aroma[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Compute unique wine types from grapes
  const wineTypes = Array.from(new Set(grapes.map(grape => grape.wine_type).filter(Boolean))) as string[];

  // Fetch all data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        grapesData,
        foodPairingsData,
        characteristicsData,
        aromasData,
        countriesData,
        regionsData
      ] = await Promise.all([
        supabase.from('grapes').select('*, grape_characteristics(characteristic_id), grape_aromas(aroma_id), grape_regions(region_id)'),
        supabase.from('food_pairings').select('*'),
        supabase.from('characteristics').select('*'),
        supabase.from('aromas').select('*'),
        supabase.from('countries').select('*'),
        supabase.from('regions').select('*, country:countries(*)')
      ]);

      if (grapesData.error) throw new Error(grapesData.error.message);
      if (foodPairingsData.error) throw new Error(foodPairingsData.error.message);
      if (characteristicsData.error) throw new Error(characteristicsData.error.message);
      if (aromasData.error) throw new Error(aromasData.error.message);
      if (countriesData.error) throw new Error(countriesData.error.message);
      if (regionsData.error) throw new Error(regionsData.error.message);

      // Ensure we always set arrays, even if the response is null
      setAllGrapes(grapesData.data || []);
      setGrapes(grapesData.data || []);
      setAllFoodPairings(foodPairingsData.data || []);
      setFoodPairings(foodPairingsData.data || []);
      setAllCharacteristics(characteristicsData.data || []);
      setCharacteristics(characteristicsData.data || []);
      setAllAromas(aromasData.data || []);
      setAromas(aromasData.data || []);
      setAllCountries(countriesData.data || []);
      setCountries(countriesData.data || []);
      setAllRegions(regionsData.data || []);
      setRegions(regionsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const filterDataByGrape = useCallback((grapeId: string) => {
    // Find the selected grape
    const selectedGrape = allGrapes.find(grape => grape.id === grapeId);
    if (!selectedGrape) return;

    // Filter grapes by wine type of the selected grape
    const filteredGrapes = allGrapes.filter(grape => 
      grape.wine_type === selectedGrape.wine_type
    );
    setGrapes(filteredGrapes);

    // Get all characteristic IDs associated with these grapes
    const characteristicIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_characteristics?.map(gc => gc.characteristic_id) || []
      )
    );

    // Filter characteristics
    const filteredCharacteristics = allCharacteristics.filter(char => 
      characteristicIds.has(char.id)
    );
    setCharacteristics(filteredCharacteristics);

    // Get all aroma IDs associated with these grapes
    const aromaIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_aromas?.map(ga => ga.aroma_id) || []
      )
    );

    // Filter aromas
    const filteredAromas = allAromas.filter(aroma => 
      aromaIds.has(aroma.id)
    );
    setAromas(filteredAromas);

    // Get all region IDs associated with these grapes
    const regionIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_regions?.map(gr => gr.region_id) || []
      )
    );

    // Filter regions
    const filteredRegions = allRegions.filter(region => 
      regionIds.has(region.id)
    );
    setRegions(filteredRegions);

    // Get unique country IDs from filtered regions and grapes
    const countryIds = new Set([
      ...filteredRegions.map(region => region.country?.id).filter(Boolean),
      ...filteredGrapes.map(grape => grape.origin_country_id).filter(Boolean)
    ]);

    // Filter countries
    const filteredCountries = allCountries.filter(country => 
      countryIds.has(country.id)
    );
    setCountries(filteredCountries);
  }, [allGrapes, allCharacteristics, allAromas, allRegions, allCountries]);

  const filterDataByWineType = useCallback((wineType: string) => {
    // Filter grapes by wine type
    const filteredGrapes = allGrapes.filter(grape => grape.wine_type === wineType);
    setGrapes(filteredGrapes);

    // Get all characteristic IDs associated with these grapes
    const characteristicIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_characteristics?.map(gc => gc.characteristic_id) || []
      )
    );

    // Filter characteristics
    const filteredCharacteristics = allCharacteristics.filter(char => 
      characteristicIds.has(char.id)
    );
    setCharacteristics(filteredCharacteristics);

    // Get all aroma IDs associated with these grapes
    const aromaIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_aromas?.map(ga => ga.aroma_id) || []
      )
    );

    // Filter aromas
    const filteredAromas = allAromas.filter(aroma => 
      aromaIds.has(aroma.id)
    );
    setAromas(filteredAromas);

    // Get all region IDs associated with these grapes
    const regionIds = new Set(
      filteredGrapes.flatMap(grape => 
        grape.grape_regions?.map(gr => gr.region_id) || []
      )
    );

    // Filter regions
    const filteredRegions = allRegions.filter(region => 
      regionIds.has(region.id)
    );
    setRegions(filteredRegions);

    // Get unique country IDs from filtered regions and grapes
    const countryIds = new Set([
      ...filteredRegions.map(region => region.country?.id).filter(Boolean),
      ...filteredGrapes.map(grape => grape.origin_country_id).filter(Boolean)
    ]);

    // Filter countries
    const filteredCountries = allCountries.filter(country => 
      countryIds.has(country.id)
    );
    setCountries(filteredCountries);
  }, [allGrapes, allCharacteristics, allAromas, allRegions, allCountries]);

  const updateFilteredRegions = useCallback((countryIds: string[]) => {
    if (countryIds.length === 0) {
      setRegions(allRegions);
    } else {
      const filteredRegions = allRegions.filter(region => 
        countryIds.includes(region.country?.id || '')
      );
      setRegions(filteredRegions);
    }
  }, [allRegions]);

  const resetFilters = useCallback(() => {
    setGrapes(allGrapes);
    setCharacteristics(allCharacteristics);
    setAromas(allAromas);
    setCountries(allCountries);
    setRegions(allRegions);
    setFoodPairings(allFoodPairings);
  }, [allGrapes, allCharacteristics, allAromas, allCountries, allRegions, allFoodPairings]);

  const searchPairings = useCallback(async (params: {
    search?: string;
    grapeIds?: string[];
    wineTypes?: string[];
    characteristicIds?: string[];
    aromaIds?: string[];
    foodCategories?: string[];
    foodNames?: string[];
    dietaryRestrictions?: string[];
    countryIds?: string[];
    regionIds?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query;

      if (mode === 'wine') {
        query = supabase
          .from('grapes')
          .select(`
            *,
            food_pairings:grape_food_pairings(
              id,
              food_pairing:food_pairings(
                id,
                name,
                category,
                dietary_restrictions
              )
            ),
            country:countries(id, name)
          `);

        if (params.grapeIds?.length) {
          query = query.in('id', params.grapeIds);
        }

        if (params.wineTypes?.length) {
          query = query.in('wine_type', params.wineTypes);
        }

        if (params.countryIds?.length) {
          query = query.in('origin_country_id', params.countryIds);
        }
      } else {
        query = supabase
          .from('food_pairings')
          .select(`
            *,
            grape_pairings:grape_food_pairings(
              id,
              grape:grapes(
                id,
                name,
                wine_type,
                description
              )
            )
          `);

        if (params.foodNames?.length) {
          query = query.in('name', params.foodNames);
        }

        if (params.foodCategories?.length) {
          query = query.in('category', params.foodCategories);
        }

        if (params.dietaryRestrictions?.length) {
          query = query.contains('dietary_restrictions', params.dietaryRestrictions);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching pairings');
      return [];
    } finally {
      setLoading(false);
    }
  }, [mode]);

  return {
    loading,
    error,
    grapes,
    foodPairings,
    characteristics,
    aromas,
    countries,
    regions,
    wineTypes, // Now explicitly returning wineTypes
    filterDataByGrape,
    filterDataByWineType,
    updateFilteredRegions,
    resetFilters,
    searchPairings
  };
}