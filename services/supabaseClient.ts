import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-url.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.includes('ixqjqjqjqjqjqjqjqjqj'); // Check for placeholder URL

let supabase;

if (!isConfigured) {
  // Create a mock client that will throw meaningful errors
  supabase = {
    auth: {
      signInWithPassword: async () => {
        throw new Error('Supabase não está configurado. Por favor, configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env com os valores reais do seu projeto Supabase.');
      },
      signUp: async () => {
        throw new Error('Supabase não está configurado. Por favor, configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env com os valores reais do seu projeto Supabase.');
      },
      signOut: async () => {
        throw new Error('Supabase não está configurado. Por favor, configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env com os valores reais do seu projeto Supabase.');
      },
      resetPasswordForEmail: async () => {
        throw new Error('Supabase não está configurado. Por favor, configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env com os valores reais do seu projeto Supabase.');
      },
      onAuthStateChange: () => {
        return { data: { subscription: null }, error: null };
      },
      getSession: async () => {
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        return { data: { user: null }, error: null };
      }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            throw new Error('Supabase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env com os valores reais do seu projeto Supabase.');
          }
        }),
        ilike: () => ({
          in: () => Promise.resolve({ data: [], error: null })
        }),
        in: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    global: {
      headers: {
        'X-Client-Info': 'expo-app'
      }
    }
  });
}

export { supabase, isConfigured };

// Type definitions for our database tables
export type Grape = {
  id: string;
  name: string;
  type: string;
  origin_country_id: string;
  description: string;
  wine_type?: string;
  country?: Country;
  characteristics?: Characteristic[];
  aromas?: Aroma[];
  food_pairings?: FoodPairing[];
  regions?: Region[];
};

export type Country = {
  id: string;
  name: string;
};

export type Region = {
  id: string;
  name: string;
  country_id: string;
  country?: Country;
};

export type Characteristic = {
  id: string;
  name: string;
  category: string;
};

export type Aroma = {
  id: string;
  name: string;
  category: string;
};

export type FoodPairing = {
  id: string;
  name: string;
  category: string;
  dietary_restrictions: string[];
};

// Search grapes with filters
export async function searchGrapes(filters: {
  search?: string;
  type?: string[];
  characteristics?: string[];
  aromas?: string[];
  countries?: string[];
  regions?: string[];
}) {
  if (!isConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('grapes')
      .select(`
        id,
        name,
        type,
        wine_type,
        description,
        country:origin_country_id(id, name),
        characteristics:grape_characteristics(
          characteristic:characteristics(*)
        ),
        aromas:grape_aromas(
          aroma:aromas(*)
        ),
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(*)
        ),
        regions:grape_regions(
          region:regions(*)
        )
      `);

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.type?.length) {
      query = query.in('type', filters.type);
    }

    if (filters.characteristics?.length) {
      query = query.in('characteristics.characteristic_id', filters.characteristics);
    }

    if (filters.aromas?.length) {
      query = query.in('aromas.aroma_id', filters.aromas);
    }

    if (filters.countries?.length) {
      query = query.in('origin_country_id', filters.countries);
    }

    if (filters.regions?.length) {
      query = query.in('regions.region_id', filters.regions);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

// Get complete grape details including all relationships
export async function getGrapeDetails(grapeId: string) {
  if (!isConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
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
        food_pairings:grape_food_pairings(
          food_pairing:food_pairings(*)
        ),
        regions:grape_regions(
          region:regions(
            *,
            country:countries(*)
          )
        )
      `)
      .eq('id', grapeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
}