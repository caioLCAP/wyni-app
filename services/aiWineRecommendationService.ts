import { openaiService } from './openaiService';
import { supabase, isConfigured } from './supabaseClient';
import { locationService, LocationContext, UserLocation } from './locationService';

interface DailyWineRecommendation {
  id: string;
  name: string;
  type: string;
  region: string;
  year: string;
  rating: number;
  price: string;
  imageUrl: string;
  description: string;
  grapes: string;
  characteristics: string[];
  pairings: string[];
  aromas: string[];
  aiReason: string; // Why this wine was recommended today
}

interface WeatherCondition {
  condition: 'sunny' | 'rainy' | 'windy' | 'cloudy' | 'hot' | 'cold';
  temperature?: number;
  description: string;
}

export class AIWineRecommendationService {
  private static instance: AIWineRecommendationService;
  private lastRecommendationDate: string | null = null;
  private cachedRecommendations: DailyWineRecommendation[] = [];

  public static getInstance(): AIWineRecommendationService {
    if (!AIWineRecommendationService.instance) {
      AIWineRecommendationService.instance = new AIWineRecommendationService();
    }
    return AIWineRecommendationService.instance;
  }

  /**
   * Get today's date as a string for caching purposes
   */
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Simulate weather condition (in a real app, you'd get this from a weather API)
   */
  private getCurrentWeatherCondition(): WeatherCondition {
    const conditions: WeatherCondition[] = [
      { condition: 'sunny', description: 'Dia ensolarado e agradável' },
      { condition: 'rainy', description: 'Dia chuvoso e aconchegante' },
      { condition: 'windy', description: 'Dia ventoso e fresco' },
      { condition: 'cloudy', description: 'Dia nublado e contemplativo' },
      { condition: 'hot', description: 'Dia quente de verão' },
      { condition: 'cold', description: 'Dia frio de inverno' }
    ];

    // Use date as seed for consistent daily weather
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % conditions.length;

    return conditions[index];
  }

  /**
   * Get day of week context for recommendations
   */
  private getDayContext(): string {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const today = new Date().getDay();
    const dayName = days[today];

    const contexts = {
      0: 'domingo relaxante em família', // Sunday
      1: 'início de semana produtivo', // Monday
      2: 'terça-feira de trabalho', // Tuesday
      3: 'meio da semana', // Wednesday
      4: 'quinta-feira quase fim de semana', // Thursday
      5: 'sexta-feira de celebração', // Friday
      6: 'sábado de diversão' // Saturday
    };

    return contexts[today] || dayName;
  }

  /**
   * Create AI prompt for wine recommendations with location context
   */
  private createRecommendationPrompt(
    weather: WeatherCondition,
    dayContext: string,
    locationContext?: LocationContext | null,
    userLocation?: UserLocation | null
  ): string {
    let locationInfo = '';

    if (locationContext && userLocation) {
      locationInfo = `
CONTEXTO DE LOCALIZAÇÃO:
- Localização: ${userLocation.city || 'Cidade'}, ${userLocation.region || 'Região'}, ${userLocation.country || 'País'}
- Clima regional: ${locationContext.climate}
- Estação atual: ${locationContext.season}
- Região cultural: ${locationContext.culturalRegion}
${locationContext.wineRegion ? `- Região vinícola próxima: ${locationContext.wineRegion}` : ''}

PREFERÊNCIAS REGIONAIS:
${this.getRegionalPreferences(locationContext)}
`;
    }

    return `
Como sommelier especialista, recomende 3 vinhos diferentes para hoje considerando:

CONTEXTO DO DIA:
- Clima: ${weather.description}
- Ocasião: ${dayContext}
- Data: ${new Date().toLocaleDateString('pt-BR')}

${locationInfo}

CRITÉRIOS:
1. Vinhos que harmonizem com o clima e ocasião
2. Considere as preferências culturais e climáticas da região do usuário
3. Variedade de tipos (tinto, branco, rosé, espumante)
4. Diferentes faixas de preço (R$ 50-150, R$ 150-300, R$ 300+)
5. Regiões e produtores variados
${locationContext?.wineRegion ? '6. Dê preferência a vinhos da região vinícola próxima quando apropriado' : ''}

Para cada vinho, forneça em formato JSON:

{
  "recommendations": [
    {
      "wineName": "Nome completo do vinho",
      "winery": "Nome da vinícola",
      "type": "Tipo (Tinto/Branco/Rosé/Espumante)",
      "region": "Região específica, País (ex: Barolo, Piemonte, Itália)",
      "vintage": "Ano da safra",
      "grapeVarieties": ["Lista das uvas principais"],
      "characteristics": ["Características do vinho"],
      "aromas": ["Principais aromas"],
      "foodPairings": ["Harmonizações gastronômicas"],
      "priceRange": "Faixa de preço em reais",
      "description": "Descrição detalhada do vinho e da região",
      "whyToday": "Por que este vinho é perfeito para hoje e para sua localização",
      "rating": 4.5
    }
  ]
}

IMPORTANTE:
- Use vinhos reais e conhecidos com nomes completos
- Seja específico sobre regiões vinícolas (ex: "Barolo, Piemonte" ao invés de apenas "Itália")
- Inclua informações sobre o terroir e características da região
- Explique por que cada vinho é adequado para hoje E para a localização do usuário
- Varie os estilos e origens
- Use português brasileiro
- Considere a disponibilidade regional dos vinhos
- SEMPRE forneça o nome completo do vinho no campo "wineName"
`;
  }

  /**
   * Get regional wine preferences based on location context
   */
  private getRegionalPreferences(locationContext: LocationContext): string {
    const preferences = {
      brazil: `
- Prefira vinhos brasileiros (Vale dos Vinhedos, Serra Gaúcha) quando apropriado
- Considere vinhos sul-americanos (Argentina, Chile, Uruguai)
- Harmonizações com culinária brasileira
- Faixas de preço adequadas ao mercado brasileiro`,

      europe: `
- Enfoque em vinhos europeus tradicionais
- Considere vinhos locais da região
- Harmonizações com culinária mediterrânea/europeia
- Vinhos com história e tradição`,

      northAmerica: `
- Inclua vinhos americanos (Napa, Sonoma)
- Considere vinhos do Novo Mundo
- Harmonizações com culinária americana/internacional
- Vinhos inovadores e modernos`,

      southAmerica: `
- Prefira vinhos sul-americanos
- Destaque para Argentina e Chile
- Harmonizações com culinária latina
- Vinhos com boa relação custo-benefício`,

      asia: `
- Vinhos que harmonizam com culinária asiática
- Considere vinhos leves e frescos
- Espumantes e brancos aromáticos
- Vinhos com perfil mais delicado`,

      oceania: `
- Destaque para vinhos australianos e neozelandeses
- Vinhos do Novo Mundo
- Harmonizações com culinária oceânica
- Vinhos frescos e frutados`,

      africa: `
- Considere vinhos sul-africanos
- Vinhos que harmonizam com clima quente
- Harmonizações com culinária africana
- Vinhos robustos e encorpados`
    };

    return preferences[locationContext.culturalRegion] || preferences.brazil;
  }

  /**
   * Get wine recommendations from database with location filtering
   */
  private async getWinesFromDatabase(locationContext?: LocationContext | null): Promise<any[]> {
    if (!isConfigured) {
      return [];
    }

    try {
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
          ),
          regions:grape_regions(
            region:regions(name, country:countries(name))
          )
        `);

      // Filter by regional preferences if location is available
      if (locationContext) {
        const preferredCountries = this.getPreferredCountries(locationContext);
        if (preferredCountries.length > 0) {
          // Get country IDs for preferred countries
          const { data: countryData } = await supabase
            .from('countries')
            .select('id')
            .in('name', preferredCountries);

          if (countryData && countryData.length > 0) {
            const countryIds = countryData.map(c => c.id);
            query = query.in('origin_country_id', countryIds);
          }
        }
      }

      const { data, error } = await query.limit(30);

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get preferred countries based on location context
   */
  private getPreferredCountries(locationContext: LocationContext): string[] {
    const countryPreferences = {
      brazil: ['Brasil', 'Argentina', 'Chile', 'Uruguai', 'França', 'Itália'],
      europe: ['França', 'Itália', 'Espanha', 'Portugal', 'Alemanha', 'Áustria'],
      northAmerica: ['Estados Unidos', 'França', 'Itália', 'Argentina', 'Chile'],
      southAmerica: ['Argentina', 'Chile', 'Brasil', 'Uruguai', 'França', 'Itália'],
      asia: ['França', 'Alemanha', 'Áustria', 'Japão', 'China'],
      oceania: ['Austrália', 'Nova Zelândia', 'França', 'Itália'],
      africa: ['África do Sul', 'França', 'Itália', 'Espanha']
    };

    return countryPreferences[locationContext.culturalRegion] || countryPreferences.brazil;
  }

  /**
   * Generate AI-powered wine recommendations with location context
   */
  public async getDailyRecommendations(): Promise<DailyWineRecommendation[]> {
    const today = this.getTodayString();

    // Return cached recommendations if they're from today
    if (this.lastRecommendationDate === today && this.cachedRecommendations.length > 0) {
      return this.cachedRecommendations;
    }

    try {
      // Get user location and context
      const userLocation = await locationService.getCurrentLocation();
      const locationContext = locationService.getLocationContext();

      const weather = this.getCurrentWeatherCondition();
      const dayContext = this.getDayContext();

      // Try to get AI recommendations first
      try {
        const prompt = this.createRecommendationPrompt(weather, dayContext, locationContext, userLocation);
        const aiResponse = await openaiService.analyzeWineLabel(prompt);

        if (aiResponse) {
          // Parse AI response and convert to our format
          const recommendations = await this.parseAIRecommendations(
            aiResponse,
            weather,
            dayContext,
            locationContext,
            userLocation
          );

          if (recommendations.length > 0) {
            this.cachedRecommendations = recommendations;
            this.lastRecommendationDate = today;
            return recommendations;
          }
        }
      } catch (aiError) {
        // AI recommendations failed, falling back to database
      }

      // Fallback to database recommendations with location context
      const fallbackRecommendations = await this.getFallbackRecommendations(
        weather,
        dayContext,
        locationContext,
        userLocation
      );
      this.cachedRecommendations = fallbackRecommendations;
      this.lastRecommendationDate = today;

      return fallbackRecommendations;

    } catch (error) {
      return this.getStaticFallbackRecommendations();
    }
  }

  /**
   * Parse AI response into our recommendation format with location context
   */
  private async parseAIRecommendations(
    aiResponse: any,
    weather: WeatherCondition,
    dayContext: string,
    locationContext?: LocationContext | null,
    userLocation?: UserLocation | null
  ): Promise<DailyWineRecommendation[]> {
    const recommendations: DailyWineRecommendation[] = [];
    const today = this.getTodayString();

    try {
      // Handle both array and single object responses
      let wineData = [];

      if (aiResponse.recommendations && Array.isArray(aiResponse.recommendations)) {
        wineData = aiResponse.recommendations;
      } else if (Array.isArray(aiResponse)) {
        wineData = aiResponse;
      } else {
        wineData = [aiResponse];
      }

      wineData.forEach((wine, index) => {
        let aiReason = wine.whyToday || `Perfeito para este ${dayContext} com ${weather.description.toLowerCase()}`;

        // Add location context to the reason
        if (locationContext && userLocation) {
          const locationReason = this.generateLocationReason(wine, locationContext, userLocation);
          aiReason = `${aiReason} ${locationReason}`;
        }

        // Determine the best name to display
        let displayName = '';
        let grapeInfo = '';

        if (wine.wineName && wine.wineName.trim()) {
          // Use the full wine name if available
          displayName = wine.wineName;
          grapeInfo = wine.grapeVarieties && wine.grapeVarieties.length > 0
            ? wine.grapeVarieties.join(', ')
            : wine.wineName;
        } else if (wine.grapeVarieties && wine.grapeVarieties.length > 0) {
          // Use grape varieties as the name if no wine name
          displayName = wine.grapeVarieties.join(', ');
          grapeInfo = displayName;
        } else if (wine.name && wine.name.trim()) {
          // Use generic name if available
          displayName = wine.name;
          grapeInfo = wine.name;
        } else {
          // Fallback to a descriptive name
          displayName = `${wine.wineType || wine.type || 'Vinho'} Especial`;
          grapeInfo = displayName;
        }

        // Create detailed region information
        const regionInfo = wine.region || 'Região Especial';

        const recommendation: DailyWineRecommendation = {
          id: `ai-${today}-${index}`,
          name: displayName,
          type: wine.wineType || wine.type || 'Vinho Tinto',
          region: regionInfo,
          year: wine.vintage || '2020',
          rating: wine.rating || 4.5,
          price: wine.priceRange || 'R$ 150,00',
          imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
          description: wine.description || 'Vinho selecionado especialmente para hoje.',
          grapes: grapeInfo,
          characteristics: wine.characteristics || ['Equilibrado', 'Aromático'],
          pairings: wine.foodPairings || ['Carnes', 'Queijos'],
          aromas: wine.aromas || ['Frutas', 'Especiarias'],
          aiReason
        };

        recommendations.push(recommendation);
      });

    } catch (parseError) {
      // Error parsing AI recommendations
    }

    return recommendations;
  }

  /**
   * Generate location-specific reason for wine recommendation
   */
  private generateLocationReason(
    wine: any,
    locationContext: LocationContext,
    userLocation: UserLocation
  ): string {
    const city = userLocation.city || 'sua cidade';
    const country = userLocation.country || 'sua região';

    let reason = '';

    // Add climate-specific reason
    const climateReasons = {
      tropical: 'Ideal para o clima tropical, oferecendo frescor e leveza.',
      subtropical: 'Perfeito para o clima subtropical, equilibrando frescor e corpo.',
      temperate: 'Adequado para o clima temperado, com equilíbrio e elegância.',
      continental: 'Excelente para o clima continental, com estrutura e profundidade.',
      mediterranean: 'Ideal para o clima mediterrâneo, com frescor e mineralidade.'
    };

    reason += climateReasons[locationContext.climate] || '';

    // Add seasonal context
    const seasonalReasons = {
      summer: ' Perfeito para o verão, refrescante e leve.',
      winter: ' Ideal para o inverno, aconchegante e encorpado.',
      spring: ' Excelente para a primavera, floral e delicado.',
      autumn: ' Perfeito para o outono, complexo e amadurecido.'
    };

    reason += seasonalReasons[locationContext.season] || '';

    // Add wine region proximity
    if (locationContext.wineRegion) {
      reason += ` Sendo você próximo à região de ${locationContext.wineRegion}, este vinho conecta você com a tradição vinícola local.`;
    }

    // Add cultural context
    const culturalReasons = {
      brazil: ` Uma excelente escolha para o paladar brasileiro em ${city}.`,
      europe: ` Perfeito para o refinado gosto europeu em ${country}.`,
      northAmerica: ` Ideal para o estilo de vida norte-americano.`,
      southAmerica: ` Excelente para o clima e cultura sul-americana.`,
      asia: ` Harmoniza perfeitamente com a culinária e clima asiático.`,
      oceania: ` Ideal para o estilo de vida oceânico.`,
      africa: ` Perfeito para o clima e tradições africanas.`
    };

    reason += culturalReasons[locationContext.culturalRegion] || '';

    return reason;
  }

  /**
   * Get fallback recommendations from database with location context
   */
  private async getFallbackRecommendations(
    weather: WeatherCondition,
    dayContext: string,
    locationContext?: LocationContext | null,
    userLocation?: UserLocation | null
  ): Promise<DailyWineRecommendation[]> {
    const dbWines = await this.getWinesFromDatabase(locationContext);

    if (dbWines.length === 0) {
      return this.getStaticFallbackRecommendations();
    }

    // Filter wines based on weather, season, and climate
    let filteredWines = this.filterWinesByContext(dbWines, weather, locationContext);

    // If no matches, use all wines
    if (filteredWines.length === 0) {
      filteredWines = dbWines;
    }

    // Select 3 random wines
    const selectedWines = this.shuffleArray(filteredWines).slice(0, 3);

    return selectedWines.map((wine, index) => {
      const currentYear = new Date().getFullYear();
      const randomYear = Math.floor(Math.random() * 10) + (currentYear - 15);
      const randomPrice = this.generateRegionalPrice(locationContext);

      let aiReason = this.generateReasonForWine(wine, weather, dayContext);

      // Add location context
      if (locationContext && userLocation) {
        const locationReason = this.generateLocationReason(wine, locationContext, userLocation);
        aiReason += ` ${locationReason}`;
      }

      // Get region information from the wine data
      const regionInfo = wine.regions && wine.regions.length > 0
        ? `${wine.regions[0].name}, ${wine.regions[0].country?.name || wine.country?.name}`
        : wine.country?.name || 'Região Especial';

      return {
        id: `db-${this.getTodayString()}-${index}`,
        name: wine.name,
        type: wine.wine_type || wine.type,
        region: regionInfo,
        year: randomYear.toString(),
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        price: `R$ ${randomPrice},00`,
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: wine.description || 'Vinho selecionado especialmente para hoje.',
        grapes: wine.name,
        characteristics: wine.characteristics?.map(c => c.characteristic.name) || ['Equilibrado'],
        pairings: wine.food_pairings?.map(p => p.food_pairing.name) || ['Harmonização especial'],
        aromas: wine.aromas?.map(a => a.aroma.name) || ['Aromático'],
        aiReason
      };
    });
  }

  /**
   * Filter wines based on weather and location context
   */
  private filterWinesByContext(
    wines: any[],
    weather: WeatherCondition,
    locationContext?: LocationContext | null
  ): any[] {
    let filtered = wines;

    // Filter by weather preference
    switch (weather.condition) {
      case 'sunny':
      case 'hot':
        filtered = wines.filter(w =>
          w.wine_type === 'Vinho Branco' || w.wine_type === 'Vinho Rosé' || w.wine_type === 'Espumante'
        );
        break;
      case 'rainy':
      case 'cold':
        filtered = wines.filter(w => w.wine_type === 'Vinho Tinto');
        break;
      case 'windy':
        filtered = wines.filter(w => w.wine_type === 'Espumante');
        break;
    }

    // Further filter by climate if location context is available
    if (locationContext) {
      switch (locationContext.climate) {
        case 'tropical':
        case 'subtropical':
          // Prefer lighter wines in hot climates
          filtered = filtered.filter(w =>
            w.wine_type !== 'Vinho Tinto' ||
            w.characteristics?.some(c => c.characteristic.name.includes('Leve'))
          );
          break;
        case 'continental':
          // Prefer fuller-bodied wines in continental climates
          filtered = filtered.filter(w =>
            w.wine_type === 'Vinho Tinto' ||
            w.characteristics?.some(c => c.characteristic.name.includes('Encorpado'))
          );
          break;
      }
    }

    return filtered.length > 0 ? filtered : wines;
  }

  /**
   * Generate regional pricing based on location context
   */
  private generateRegionalPrice(locationContext?: LocationContext | null): number {
    const basePrices = {
      brazil: { min: 50, max: 400 },
      europe: { min: 80, max: 600 },
      northAmerica: { min: 70, max: 500 },
      southAmerica: { min: 40, max: 300 },
      asia: { min: 60, max: 450 },
      oceania: { min: 90, max: 550 },
      africa: { min: 45, max: 350 }
    };

    const priceRange = locationContext
      ? basePrices[locationContext.culturalRegion] || basePrices.brazil
      : basePrices.brazil;

    return Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min;
  }

  /**
   * Generate reasoning for why a wine is recommended today with location context
   */
  private generateReasonForWine(wine: any, weather: WeatherCondition, dayContext: string): string {
    const reasons = {
      'sunny': `Ideal para este dia ensolarado, ${wine.name} oferece frescor e leveza perfeitos para o clima agradável.`,
      'rainy': `Perfeito para este dia chuvoso, ${wine.name} traz o aconchego e a profundidade ideais para momentos contemplativos.`,
      'windy': `Excelente para este dia ventoso, ${wine.name} oferece vivacidade e energia que combinam com o clima dinâmico.`,
      'cloudy': `Adequado para este dia nublado, ${wine.name} proporciona equilíbrio e harmonia para momentos reflexivos.`,
      'hot': `Refrescante para este dia quente, ${wine.name} oferece a leveza necessária para amenizar o calor.`,
      'cold': `Acolhedor para este dia frio, ${wine.name} traz o calor e a intensidade perfeitos para se aquecer.`
    };

    return reasons[weather.condition] || `${wine.name} é uma excelente escolha para este ${dayContext}.`;
  }

  /**
   * Static fallback recommendations when everything else fails
   */
  private getStaticFallbackRecommendations(): DailyWineRecommendation[] {
    const weather = this.getCurrentWeatherCondition();
    const dayContext = this.getDayContext();
    const today = this.getTodayString();

    return [
      {
        id: `static-${today}-1`,
        name: 'Château Margaux',
        type: 'Vinho Tinto',
        region: 'Margaux, Bordeaux, França',
        year: '2018',
        rating: 4.8,
        price: 'R$ 2.450,00',
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: 'Um dos grandes vinhos de Bordeaux, elegante e complexo. O terroir de Margaux confere elegância única.',
        grapes: 'Cabernet Sauvignon, Merlot, Petit Verdot',
        characteristics: ['Encorpado', 'Elegante', 'Complexo'],
        pairings: ['Carnes Vermelhas', 'Queijos Envelhecidos'],
        aromas: ['Frutas Negras', 'Especiarias', 'Carvalho'],
        aiReason: `Selecionado para este ${dayContext} - um clássico que nunca decepciona.`
      },
      {
        id: `static-${today}-2`,
        name: 'Chablis Premier Cru',
        type: 'Vinho Branco',
        region: 'Chablis, Borgonha, França',
        year: '2021',
        rating: 4.6,
        price: 'R$ 380,00',
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: 'Chardonnay mineral e elegante da Borgonha. O solo calcário de Chablis confere mineralidade única.',
        grapes: 'Chardonnay',
        characteristics: ['Mineral', 'Fresco', 'Elegante'],
        pairings: ['Frutos do Mar', 'Queijos Frescos'],
        aromas: ['Cítricos', 'Mineral', 'Flores Brancas'],
        aiReason: `Ideal para este ${dayContext} com ${weather.description.toLowerCase()}.`
      },
      {
        id: `static-${today}-3`,
        name: 'Dom Pérignon',
        type: 'Espumante',
        region: 'Épernay, Champagne, França',
        year: '2012',
        rating: 4.9,
        price: 'R$ 1.950,00',
        imageUrl: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
        description: 'O champagne mais icônico do mundo. O terroir de Champagne e o método tradicional criam bolhas perfeitas.',
        grapes: 'Chardonnay, Pinot Noir',
        characteristics: ['Elegante', 'Complexo', 'Refinado'],
        pairings: ['Aperitivos', 'Frutos do Mar', 'Sobremesas'],
        aromas: ['Frutas Brancas', 'Brioche', 'Amêndoas'],
        aiReason: `Perfeito para celebrar este ${dayContext} especial.`
      }
    ];
  }

  /**
   * Utility function to shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const aiWineRecommendationService = AIWineRecommendationService.getInstance();