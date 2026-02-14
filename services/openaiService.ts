import OpenAI from 'openai';

// Get API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface WineAnalysisResult {
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
}

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI | null = null;

  private constructor() {
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // Necessário para uso no browser
      });
    }
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  private isConfigured(): boolean {
    return this.openai !== null && !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here';
  }

  /**
   * Analisa o texto extraído de um rótulo de vinho usando OpenAI
   */
  public async analyzeWineLabel(extractedText: string): Promise<WineAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI não está configurado. Para usar a análise com IA, você precisa:\n\n1. Obter uma chave da API OpenAI em https://platform.openai.com/api-keys\n2. Adicionar informações de cobrança em https://platform.openai.com/settings/organization/billing\n3. Configurar a variável EXPO_PUBLIC_OPENAI_API_KEY no arquivo .env\n4. Reiniciar o servidor de desenvolvimento');
    }

    try {
      const prompt = this.createWineAnalysisPrompt(extractedText);

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini", // Modelo mais econômico e eficiente
        messages: [
          {
            role: "system",
            content: "Você é um sommelier especialista em vinhos com vasto conhecimento sobre vinícolas, regiões, castas e características de vinhos do mundo todo. Sua tarefa é analisar textos extraídos de rótulos de vinho e fornecer informações precisas e detalhadas."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Baixa temperatura para respostas mais consistentes
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Resposta vazia da OpenAI');
      }

      const analysis = JSON.parse(response) as WineAnalysisResult;
      return this.validateAndEnrichAnalysis(analysis);
    } catch (error: any) {
      // Handle specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('Limite de uso da API OpenAI excedido. Verifique seu plano e informações de cobrança em platform.openai.com');
      } else if (error?.status === 401) {
        throw new Error('Chave da API OpenAI inválida. Verifique suas credenciais.');
      } else if (error?.status === 403) {
        throw new Error('Acesso negado à API OpenAI. Verifique suas permissões.');
      } else if (error?.status >= 500) {
        throw new Error('Erro interno do servidor OpenAI. Tente novamente em alguns minutos.');
      }

      throw new Error(
        error instanceof Error
          ? `Falha na análise do vinho: ${error.message}`
          : 'Erro desconhecido ao analisar o vinho'
      );
    }
  }

  /**
   * Cria o prompt para análise do rótulo de vinho
   */
  private createWineAnalysisPrompt(extractedText: string): string {
    return `
Analise o seguinte texto extraído de um rótulo de vinho e forneça informações detalhadas em formato JSON:

TEXTO DO RÓTULO:
"${extractedText}"

Por favor, extraia e forneça as seguintes informações em formato JSON válido:

{
  "wineName": "Nome do vinho",
  "winery": "Nome da vinícola/produtor",
  "vintage": "Ano da safra (formato YYYY)",
  "region": "Região vinícola específica",
  "country": "País de origem",
  "grapeVarieties": ["Lista de castas/uvas identificadas"],
  "alcoholContent": "Teor alcoólico (ex: 13.5%)",
  "wineType": "Tipo do vinho (Tinto, Branco, Rosé, Espumante, etc.)",
  "tastingNotes": "Notas de degustação e características organolépticas",
  "foodPairings": ["Sugestões de harmonização gastronômica"],
  "priceRange": "Faixa de preço estimada (ex: R$ 50-100)",
  "description": "Descrição geral do vinho e suas características"
}

INSTRUÇÕES IMPORTANTES:
1. Responda SEMPRE em Português do Brasil (pt-BR).
2. Se uma informação não for encontrada ou identificada:
   - Para campos de texto (string), preencha com "Informação não encontrada" (NUNCA use "Unknown", "N/A" ou null).
   - Para listas (arrays), retorne uma lista contendo apenas ["Informação não encontrada"].
3. Para vinhos conhecidos, use seu conhecimento para preencher dados faltantes (mas se ainda assim não souber, use a regra 2).
4. Seja específico sobre regiões vinícolas (ex: "Bordeaux" ao invés de apenas "França").
5. Inclua castas típicas da região se não estiverem explícitas no rótulo.
6. Forneça harmonizações gastronômicas apropriadas para o tipo de vinho.
7. Estime uma faixa de preço realista baseada na qualidade e origem.
8. NUNCA invente dados aleatórios se não tiver certeza (use "Informação não encontrada").

Responda APENAS com o JSON válido, sem texto adicional.
    `;
  }

  /**
   * Valida e enriquece a análise retornada pela OpenAI
   */
  private validateAndEnrichAnalysis(analysis: WineAnalysisResult): WineAnalysisResult {
    // Validações básicas e correções
    const validated: WineAnalysisResult = {
      ...analysis
    };

    // Enriquecer com informações padrão se necessário
    if (validated.wineType && !validated.foodPairings?.length) {
      validated.foodPairings = this.getDefaultFoodPairings(validated.wineType);
    }

    // Validar ano da safra
    if (validated.vintage) {
      const year = parseInt(validated.vintage);
      const currentYear = new Date().getFullYear();
      if (year < 1800 || year > currentYear) {
        validated.vintage = undefined;
      }
    }

    // Validar teor alcoólico
    if (validated.alcoholContent && !validated.alcoholContent.includes('%')) {
      const alcohol = parseFloat(validated.alcoholContent);
      if (alcohol > 0 && alcohol < 50) {
        validated.alcoholContent = `${alcohol}%`;
      }
    }

    return validated;
  }

  /**
   * Retorna harmonizações padrão baseadas no tipo de vinho
   */
  private getDefaultFoodPairings(wineType: string): string[] {
    const pairings: Record<string, string[]> = {
      'Tinto': ['Carnes vermelhas', 'Queijos envelhecidos', 'Massas com molho vermelho'],
      'Branco': ['Peixes', 'Frutos do mar', 'Queijos frescos', 'Saladas'],
      'Rosé': ['Aves', 'Peixes grelhados', 'Saladas', 'Aperitivos'],
      'Espumante': ['Aperitivos', 'Frutos do mar', 'Sobremesas leves'],
      'Vinho Tinto': ['Carnes vermelhas', 'Queijos envelhecidos', 'Massas com molho vermelho'],
      'Vinho Branco': ['Peixes', 'Frutos do mar', 'Queijos frescos', 'Saladas'],
      'Vinho Rosé': ['Aves', 'Peixes grelhados', 'Saladas', 'Aperitivos']
    };

    return pairings[wineType] || ['Aperitivos', 'Queijos'];
  }

  /**
   * Analisa uma imagem diretamente usando Vision da OpenAI
   */
  public async analyzeWineImage(imageBase64: string): Promise<WineAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI não está configurado. Para usar a análise com IA, você precisa:\n\n1. Obter uma chave da API OpenAI em https://platform.openai.com/api-keys\n2. Adicionar informações de cobrança em https://platform.openai.com/settings/organization/billing\n3. Configurar a variável EXPO_PUBLIC_OPENAI_API_KEY no arquivo .env\n4. Reiniciar o servidor de desenvolvimento');
    }

    try {
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um sommelier especialista. Analise esta imagem de rótulo de vinho e extraia todas as informações possíveis. Responda SEMPRE em Português do Brasil."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta imagem de rótulo de vinho e forneça informações detalhadas em formato JSON seguindo a estrutura: wineName, winery, vintage, region, country, grapeVarieties, alcoholContent, wineType, tastingNotes, foodPairings, priceRange, description.
                
                REGRAS:
                1. Tudo deve estar em Português do Brasil.
                2. Se uma informação não for encontrada:
                   - Campos de texto: use "Informação não encontrada".
                   - Listas: use ["Informação não encontrada"].
                   - NUNCA use "Unknown" ou null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Resposta vazia da OpenAI');
      }

      const analysis = JSON.parse(response) as WineAnalysisResult;
      return this.validateAndEnrichAnalysis(analysis);
    } catch (error: any) {
      // Handle specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('Limite de uso da API OpenAI excedido. Verifique seu plano e informações de cobrança em platform.openai.com');
      } else if (error?.status === 401) {
        throw new Error('Chave da API OpenAI inválida. Verifique suas credenciais.');
      } else if (error?.status === 403) {
        throw new Error('Acesso negado à API OpenAI. Verifique suas permissões.');
      } else if (error?.status >= 500) {
        throw new Error('Erro interno do servidor OpenAI. Tente novamente em alguns minutos.');
      }

      throw new Error(
        error instanceof Error
          ? `Falha na análise da imagem: ${error.message}`
          : 'Erro desconhecido ao analisar a imagem'
      );
    }
  }
}

export const openaiService = OpenAIService.getInstance();