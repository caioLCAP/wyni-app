import { supabase, isConfigured } from './supabaseClient';
import { WineType, WineFilter } from '@/types/wine';

// Function to analyze wine label image and return wine data
export const analyzeWineLabel = async (imageUri: string): Promise<WineType | null> => {
  try {
    // Simulate API call delay for processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!isConfigured) {
      return null;
    }
    
    // Query Supabase for a random wine from the database
    const { data: wineData, error } = await supabase
      .from('grapes')
      .select(`
        *,
        country:origin_country_id(name),
        characteristics:grape_characteristics(
          characteristic:characteristics(name)
        ),
        aromas:grape_aromas(
          aroma:aromas(name)
        ),
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(name)
        ),
        regions:grape_regions(
          region:regions(name)
        )
      `)
      .limit(10); // Get 10 wines to randomly select from

    if (error) {
      return null;
    }

    if (wineData && wineData.length > 0) {
      // Randomly select one wine from the results
      const randomWine = wineData[Math.floor(Math.random() * wineData.length)];
      
      // Generate random year and price for demo purposes
      const currentYear = new Date().getFullYear();
      const randomYear = Math.floor(Math.random() * 20) + (currentYear - 25); // Random year from 25 years ago to 5 years ago
      const randomPrice = Math.floor(Math.random() * 500) + 50; // Random price between R$ 50 and R$ 550

      return {
        id: randomWine.id,
        name: randomWine.name,
        type: randomWine.wine_type || randomWine.type,
        region: randomWine.country?.name || 'Região Desconhecida',
        year: randomYear.toString(),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3.0 and 5.0
        price: `R$ ${randomPrice},00`,
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: randomWine.description || 'Vinho de qualidade excepcional com características únicas.',
        grapes: randomWine.name,
        characteristics: randomWine.characteristics?.map(c => c.characteristic.name) || [],
        pairings: randomWine.food_pairings?.map(p => p.food_pairing.name) || [],
        aromas: randomWine.aromas?.map(a => a.aroma.name) || []
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Function to search for a specific wine by name in the database
export const searchWineByName = async (wineName: string): Promise<WineType | null> => {
  try {
    if (!isConfigured) {
      return null;
    }

    const { data: wineData, error } = await supabase
      .from('grapes')
      .select(`
        *,
        country:origin_country_id(name),
        characteristics:grape_characteristics(
          characteristic:characteristics(name)
        ),
        aromas:grape_aromas(
          aroma:aromas(name)
        ),
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(name)
        ),
        regions:grape_regions(
          region:regions(name, country:countries(name))
        )
      `)
      .ilike('name', `%${wineName}%`)
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    if (wineData) {
      const currentYear = new Date().getFullYear();
      const randomYear = Math.floor(Math.random() * 20) + (currentYear - 25);
      const randomPrice = Math.floor(Math.random() * 500) + 50;

      // Construir informação de região mais detalhada
      let regionInfo = wineData.country?.name || 'Região Desconhecida';
      if (wineData.regions && wineData.regions.length > 0) {
        const region = wineData.regions[0].region;
        regionInfo = `${region.name}, ${region.country?.name || wineData.country?.name}`;
      }

      return {
        id: wineData.id,
        name: wineData.name,
        type: wineData.wine_type || wineData.type,
        region: regionInfo,
        year: randomYear.toString(),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        price: `R$ ${randomPrice},00`,
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: wineData.description || `${wineData.name} é uma uva ${wineData.wine_type?.toLowerCase() || 'especial'} com características únicas e tradição vinícola. Originária de ${regionInfo}, oferece uma experiência sensorial excepcional com aromas e sabores distintivos.`,
        grapes: wineData.name,
        characteristics: wineData.characteristics?.map(c => c.characteristic.name) || [],
        pairings: wineData.food_pairings?.map(p => p.food_pairing.name) || [],
        aromas: wineData.aromas?.map(a => a.aroma.name) || []
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Function to get recommended wines based on weather condition
export const getRecommendedWines = async (weatherCondition: string): Promise<WineType[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!isConfigured) {
      return [];
    }

    let wineTypeFilter: string[] = [];
    
    switch (weatherCondition) {
      case 'sunny':
        wineTypeFilter = ['Vinho Branco', 'Vinho Rosé'];
        break;
      case 'rainy':
        wineTypeFilter = ['Vinho Tinto'];
        break;
      case 'windy':
        wineTypeFilter = ['Espumante'];
        break;
      default:
        wineTypeFilter = ['Vinho Tinto', 'Vinho Branco', 'Espumante'];
    }

    const { data: wineData, error } = await supabase
      .from('grapes')
      .select(`
        *,
        country:origin_country_id(name),
        characteristics:grape_characteristics(
          characteristic:characteristics(name)
        ),
        aromas:grape_aromas(
          aroma:aromas(name)
        ),
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(name)
        )
      `)
      .in('wine_type', wineTypeFilter)
      .limit(5);

    if (error) {
      return [];
    }

    if (wineData && wineData.length > 0) {
      return wineData.map(wine => {
        const currentYear = new Date().getFullYear();
        const randomYear = Math.floor(Math.random() * 20) + (currentYear - 25);
        const randomPrice = Math.floor(Math.random() * 500) + 50;

        return {
          id: wine.id,
          name: wine.name,
          type: wine.wine_type || wine.type,
          region: wine.country?.name || 'Região Desconhecida',
          year: randomYear.toString(),
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          price: `R$ ${randomPrice},00`,
          imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
          description: wine.description || 'Vinho de qualidade excepcional.',
          grapes: wine.name,
          characteristics: wine.characteristics?.map(c => c.characteristic.name) || [],
          pairings: wine.food_pairings?.map(p => p.food_pairing.name) || []
        };
      });
    }

    return [];
  } catch (error) {
    return [];
  }
};

// Function to get wines with filtering
export const getWines = async (filters: WineFilter & { search?: string }): Promise<WineType[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!isConfigured) {
      return [];
    }

    let query = supabase
      .from('grapes')
      .select(`
        *,
        country:origin_country_id(name),
        characteristics:grape_characteristics(
          characteristic:characteristics(name)
        ),
        aromas:grape_aromas(
          aroma:aromas(name)
        ),
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(name)
        )
      `);

    // Apply search
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      query = query.in('wine_type', filters.type);
    }

    const { data: wineData, error } = await query.limit(20);

    if (error) {
      return [];
    }

    if (wineData && wineData.length > 0) {
      return wineData.map(wine => {
        const currentYear = new Date().getFullYear();
        const randomYear = Math.floor(Math.random() * 20) + (currentYear - 25);
        const randomPrice = Math.floor(Math.random() * 500) + 50;

        return {
          id: wine.id,
          name: wine.name,
          type: wine.wine_type || wine.type,
          region: wine.country?.name || 'Região Desconhecida',
          year: randomYear.toString(),
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          price: `R$ ${randomPrice},00`,
          imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
          description: wine.description || 'Vinho de qualidade excepcional.',
          grapes: wine.name,
          characteristics: wine.characteristics?.map(c => c.characteristic.name) || [],
          pairings: wine.food_pairings?.map(p => p.food_pairing.name) || []
        };
      });
    }

    return [];
  } catch (error) {
    return [];
  }
};