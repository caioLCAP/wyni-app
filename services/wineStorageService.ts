import { supabase, isConfigured } from './supabaseClient';
import { WineType } from '@/types/wine';

export interface SavedWine {
  id: string;
  user_id: string;
  wine_name: string;
  winery?: string;
  wine_type?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grape_varieties?: string[];
  alcohol_content?: string;
  tasting_notes?: string;
  food_pairings?: string[];
  price_range?: string;
  description?: string;
  rating?: number;
  image_url?: string;
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  weather?: string;
  location_city?: string;
  location_country?: string;
  moment_type?: string;
}

export interface WineAnalysisData {
  wineName?: string;
  winery?: string;
  vintage?: string;
  region?: string;
  country?: string;
  grapeVarieties?: string[];
  alcoholContent?: string;
  wineType?: string;
  tastingNotes?: string;
  foodPairings?: string[];
  priceRange?: string;
  description?: string;
  rating?: number;
  weather?: string;
  location_city?: string;
  location_country?: string;
  moment_type?: string;
  imageUri?: string; // Local URI for upload
}

export class WineStorageService {
  private static instance: WineStorageService;

  public static getInstance(): WineStorageService {
    if (!WineStorageService.instance) {
      WineStorageService.instance = new WineStorageService();
    }
    return WineStorageService.instance;
  }

  /**
   * Upload wine image to Supabase Storage
   */
  async uploadWineImage(userId: string, imageUri: string): Promise<string | null> {
    if (!isConfigured) return null;

    try {
      console.log('Iniciando upload da imagem do vinho...');

      // 1. Definir caminho do arquivo
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;
      const filePath = `${fileName}`;

      console.log('Fazendo upload para:', filePath);

      // 2. Converter URI para ArrayBuffer
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Falha ao ler o arquivo: tamanho 0 bytes');
      }

      // 3. Upload para o Supabase Storage (bucket 'wines')
      // Nota: Certifique-se de criar o bucket 'wines' no Supabase
      const { data, error: uploadError } = await supabase.storage
        .from('wines')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        // Se o bucket não existir ou der erro, retornamos null e o código usará a imagem padrão
        return null;
      }

      // 4. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('wines')
        .getPublicUrl(filePath);

      console.log('Upload concluído. URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Erro no serviço de upload de imagem de vinho:', error);
      return null;
    }
  }

  /**
   * Converte arrays para formato PostgreSQL correto
   */
  private formatArrayForPostgres(value: any): string[] | null {
    if (!value) return null;

    try {
      let arrayValue: any[] = [];

      if (Array.isArray(value)) {
        arrayValue = value;
      } else if (typeof value === 'string') {
        // Se for uma string, tentar dividir por vírgulas ou usar como item único
        if (value.includes(',')) {
          arrayValue = value.split(',');
        } else {
          arrayValue = [value];
        }
      } else {
        return null;
      }

      // Filtrar e limpar os valores
      const cleanArray = arrayValue
        .filter(item => item != null && item !== undefined)
        .map(item => String(item).trim())
        .filter(item => item.length > 0)
        .filter(item => item !== 'null' && item !== 'undefined');

      return cleanArray.length > 0 ? cleanArray : null;
    } catch (error) {
      console.error('Erro ao formatar array:', error);
      return null;
    }
  }

  /**
   * Verifica se já existe um vinho similar salvo pelo usuário
   */
  private async findSimilarWine(analysis: WineAnalysisData): Promise<SavedWine | null> {
    if (!isConfigured) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('saved_wines')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      // Procurar por vinho similar baseado no nome
      const wineName = analysis.wineName?.toLowerCase().trim();
      if (!wineName) {
        return null;
      }

      const similarWine = data.find((wine: SavedWine) => {
        const savedWineName = wine.wine_name?.toLowerCase().trim();
        if (!savedWineName) return false;

        // Verificar se os nomes são exatamente iguais ou muito similares
        return savedWineName === wineName ||
          savedWineName.includes(wineName) ||
          wineName.includes(savedWineName);
      });

      return similarWine || null;
    } catch (error) {
      console.error('Erro ao buscar vinho similar:', error);
      return null;
    }
  }

  /**
   * Normaliza o nome do vinho para comparação
   */
  private normalizeWineName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' '); // Normaliza espaços
  }

  /**
   * Busca vinho salvo por nome exato ou similar
   */
  async findSavedWineByName(wineName: string): Promise<SavedWine | null> {
    if (!isConfigured) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('saved_wines')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const normalizedSearchName = this.normalizeWineName(wineName);

      // Procurar por correspondência exata primeiro
      let foundWine = data.find((wine: SavedWine) => {
        const normalizedWineName = this.normalizeWineName(wine.wine_name || '');
        return normalizedWineName === normalizedSearchName;
      });

      // Se não encontrou correspondência exata, procurar por similaridade
      if (!foundWine) {
        foundWine = data.find((wine: SavedWine) => {
          const normalizedWineName = this.normalizeWineName(wine.wine_name || '');
          return normalizedWineName.includes(normalizedSearchName) ||
            normalizedSearchName.includes(normalizedWineName);
        });
      }

      return foundWine || null;
    } catch (error) {
      console.error('Erro ao buscar vinho por nome:', error);
      return null;
    }
  }

  /**
   * Salva um vinho analisado pela IA no banco de dados
   */
  async saveWineFromAI(analysis: WineAnalysisData): Promise<SavedWine | null> {
    if (!isConfigured) {
      throw new Error('Supabase não está configurado');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Iniciando salvamento do vinho:', analysis.wineName);

      // Verificar se já existe um vinho similar
      const existingWine = await this.findSimilarWine(analysis);
      if (existingWine) {
        console.log('Vinho similar já existe:', existingWine.wine_name);
        return existingWine;
      }

      // Upload da imagem se existir
      let imageUrl = 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg';
      if (analysis.imageUri) {
        const uploadedUrl = await this.uploadWineImage(user.id, analysis.imageUri);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Preparar arrays formatados corretamente
      const grapeVarieties = this.formatArrayForPostgres(analysis.grapeVarieties);
      const foodPairings = this.formatArrayForPostgres(analysis.foodPairings);

      console.log('Arrays formatados:', { grapeVarieties, foodPairings });

      // Preparar dados para inserção
      const wineData = {
        user_id: user.id,
        wine_name: String(analysis.wineName || 'Vinho Analisado').trim(),
        winery: analysis.winery ? String(analysis.winery).trim() : null,
        wine_type: analysis.wineType ? String(analysis.wineType).trim() : null,
        vintage: analysis.vintage ? String(analysis.vintage).trim() : null,
        region: analysis.region ? String(analysis.region).trim() : null,
        country: analysis.country ? String(analysis.country).trim() : null,
        alcohol_content: analysis.alcoholContent ? String(analysis.alcoholContent).trim() : null,
        tasting_notes: analysis.tastingNotes ? String(analysis.tastingNotes).trim() : null,
        price_range: analysis.priceRange ? String(analysis.priceRange).trim() : null,
        description: analysis.description ? String(analysis.description).trim() : null,
        rating: analysis.rating && !isNaN(Number(analysis.rating)) ? Number(analysis.rating) : null,
        image_url: imageUrl,
        ai_analysis: analysis,
        grape_varieties: grapeVarieties,
        food_pairings: foodPairings,
        weather: analysis.weather,
        location_city: analysis.location_city,
        location_country: analysis.location_country,
        moment_type: analysis.moment_type
      };

      console.log('Dados preparados para inserção:', wineData);

      // Inserir no banco de dados
      const { data: savedWine, error } = await supabase
        .from('saved_wines')
        .insert(wineData)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao salvar vinho:', error);

        // Se for erro de duplicata, buscar o vinho existente
        if (error.code === '23505') {
          console.log('Vinho duplicado detectado, buscando existente...');
          return await this.findSavedWineByName(analysis.wineName || 'Vinho Analisado');
        }

        // Se for erro de array, tentar sem arrays
        if (error.code === '22P02' || error.message?.includes('malformed') || error.message?.includes('array')) {
          console.log('Erro de array detectado, tentando sem arrays...');

          const wineDataWithoutArrays = {
            ...wineData,
            grape_varieties: null,
            food_pairings: null
          };

          const { data: savedWineSimple, error: simpleError } = await supabase
            .from('saved_wines')
            .insert(wineDataWithoutArrays)
            .select()
            .single();

          if (simpleError) {
            console.error('Erro ao salvar sem arrays:', simpleError);
            throw simpleError;
          }

          console.log('Vinho salvo sem arrays:', savedWineSimple.wine_name);
          return savedWineSimple;
        }

        throw error;
      }

      console.log('Vinho salvo com sucesso:', savedWine.wine_name);
      return savedWine;

    } catch (error) {
      console.error('Erro geral ao salvar vinho:', error);
      throw error;
    }
  }

  /**
   * Busca vinhos salvos do usuário
   */
  async getUserSavedWines(): Promise<SavedWine[]> {
    if (!isConfigured) {
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('saved_wines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Remover duplicatas baseadas no nome normalizado
      const uniqueWines = [];
      const seenNames = new Set();

      for (const wine of (data || [])) {
        const normalizedName = this.normalizeWineName(wine.wine_name || '');

        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          uniqueWines.push(wine);
        } else {
          console.log('Vinho duplicado ignorado:', wine.wine_name);
        }
      }

      return uniqueWines;
    } catch (error) {
      console.error('Erro ao buscar vinhos salvos:', error);
      return [];
    }
  }

  /**
   * Busca um vinho salvo pelo ID
   */
  async getSavedWineById(id: string): Promise<SavedWine | null> {
    if (!isConfigured) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      // Remover prefixo 'saved-' se existir
      const cleanId = id.startsWith('saved-') ? id.replace('saved-', '') : id;

      const { data, error } = await supabase
        .from('saved_wines')
        .select('*')
        .eq('id', cleanId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      };

      return data;
    } catch (error) {
      console.error('Erro ao buscar vinho por ID:', error);
      return null;
    }
  }

  /**
   * Busca favoritos do usuário
   */
  async getUserFavorites(): Promise<SavedWine[]> {
    if (!isConfigured) {
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          wine:saved_wines(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const favorites = data?.map((item: any) => ({ ...item.wine, is_favorite: true })) || [];

      // Remover duplicatas baseadas no nome normalizado
      const uniqueFavorites = [];
      const seenNames = new Set();

      for (const wine of favorites) {
        if (!wine || !wine.wine_name) continue;

        const normalizedName = this.normalizeWineName(wine.wine_name);

        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          uniqueFavorites.push(wine);
        } else {
          console.log('Favorito duplicado ignorado:', wine.wine_name);
        }
      }

      return uniqueFavorites;
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  }

  /**
   * Adiciona ou remove um vinho dos favoritos
   */
  async toggleFavorite(wineId: string): Promise<boolean> {
    if (!isConfigured) {
      throw new Error('Supabase não está configurado');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verifica se já é favorito
      const { data: existingFavorite, error: checkError } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
        .limit(1);

      if (checkError) throw checkError;

      if (existingFavorite && existingFavorite.length > 0) {
        // Remove dos favoritos
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('wine_id', wineId);

        if (error) throw error;
        console.log('Vinho removido dos favoritos');
        return false;
      } else {
        // Verifica se o vinho existe antes de adicionar aos favoritos
        const { data: wineExists, error: wineError } = await supabase
          .from('saved_wines')
          .select('id')
          .eq('id', wineId)
          .eq('user_id', user.id)
          .single();

        if (wineError || !wineExists) {
          throw new Error('Vinho não encontrado');
        }

        // Adiciona aos favoritos
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            wine_id: wineId
          });

        if (error) {
          // Se for erro de duplicata, considerar como já favoritado
          if (error.code === '23505') {
            console.log('Vinho já está nos favoritos');
            return true;
          }
          throw error;
        }

        console.log('Vinho adicionado aos favoritos');
        return true;
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      throw error;
    }
  }

  /**
   * Verifica se um vinho é favorito
   */
  async isWineFavorite(wineId: string): Promise<boolean> {
    if (!isConfigured) {
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  /**
   * Deleta um vinho salvo
   */
  async deleteWine(wineId: string): Promise<void> {
    if (!isConfigured) {
      throw new Error('Supabase não está configurado');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('saved_wines')
        .delete()
        .eq('id', wineId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Vinho deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar vinho:', error);
      throw error;
    }
  }

  /**
   * Remove vinhos duplicados do banco de dados (função de limpeza)
   */
  async removeDuplicateWines(): Promise<number> {
    if (!isConfigured) {
      return 0;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return 0;
      }

      const { data: allWines, error } = await supabase
        .from('saved_wines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Manter o mais antigo

      if (error) throw error;

      if (!allWines || allWines.length === 0) {
        return 0;
      }

      const seenNames = new Set();
      const duplicatesToDelete = [];

      for (const wine of allWines) {
        const normalizedName = this.normalizeWineName(wine.wine_name || '');

        if (seenNames.has(normalizedName)) {
          duplicatesToDelete.push(wine.id);
        } else {
          seenNames.add(normalizedName);
        }
      }

      if (duplicatesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('saved_wines')
          .delete()
          .in('id', duplicatesToDelete);

        if (deleteError) throw deleteError;

        console.log(`${duplicatesToDelete.length} vinhos duplicados removidos`);
      }

      return duplicatesToDelete.length;
    } catch (error) {
      console.error('Erro ao remover duplicatas:', error);
      return 0;
    }
  }

  convertSavedWinesToWineType = (savedWines: SavedWine[]): WineType[] => {
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
      grapes: Array.isArray(wine.grape_varieties) ? wine.grape_varieties.join(', ') : (wine.grape_varieties || wine.wine_name),
      weather: wine.weather,
      location: wine.location_city ? `${wine.location_city}${wine.location_country ? `, ${wine.location_country}` : ''}` : wine.location_country,
      moment: wine.moment_type,
      characteristics: [],
      pairings: wine.food_pairings || [],
      aromas: wine.tasting_notes ? [wine.tasting_notes] : [],
      style: wine.ai_analysis?.style,
      servingTemp: wine.ai_analysis?.servingTemp,
      preservation: wine.ai_analysis?.preservation,
      occasions: wine.ai_analysis?.occasions
    }));
  };
  /**
   * Deleta TODOS os dados do usuário (conta sendo excluída)
   */
  async deleteAllUserData(): Promise<void> {
    if (!isConfigured) {
      throw new Error('Supabase não está configurado');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Iniciando exclusão de dados do usuário:', user.id);

      // 1. Deletar favoritos
      const { error: favoritesError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Erro ao deletar favoritos:', favoritesError);
        throw favoritesError;
      }

      // 2. Deletar vinhos salvos
      const { error: winesError } = await supabase
        .from('saved_wines')
        .delete()
        .eq('user_id', user.id);

      if (winesError) {
        console.error('Erro ao deletar vinhos:', winesError);
        throw winesError;
      }

      console.log('Dados do usuário excluídos com sucesso');
    } catch (error) {
      console.error('Erro ao excluir dados do usuário:', error);
      throw error;
    }
  }
}

export const wineStorageService = WineStorageService.getInstance();