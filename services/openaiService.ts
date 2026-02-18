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
  style?: string; // Estilo do vinho (ex: "Tinto encorpado e estruturado")
  tastingNotes?: string;
  foodPairings?: string[];
  priceRange?: string;
  servingTemp?: string; // Temperatura ideal (ex: "16ºC a 18ºC")
  preservation?: string; // Potencial de guarda
  occasions?: string[]; // Ocasiões sugeridas
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
  // ... (rest of class until createWineAnalysisPrompt)

  /**
   * Cria o prompt para análise do rótulo de vinho
   */
  private createWineAnalysisPrompt(extractedText: string): string {
    return `
Analise o seguinte texto extraído de um rótulo de vinho e atue como um Sommelier Expert Sênior para identificar e descrever o vinho com riqueza de detalhes.

TEXTO DO RÓTULO:
"${extractedText}"

SEU OBJETIVO:
1. IDENTIFICAR o vinho com a maior precisão possível (Produtor, Nome, Safra, Região).
2. FORNECER UMA FICHA TÉCNICA COMPLETA E RICA, usando seu conhecimento enciclopédico sobre o vinho identificado.
   - SE VOCÊ IDENTIFICAR O VINHO (ex: "Catena Malbec"), PREENCHA TODAS AS INFORMAÇÕES TÍPICAS DELE (Estilo, Harmonização, Notas, etc.), mesmo que não estejam escritas no rótulo. Use seu conhecimento de Sommelier.

DIRETRIZES DE PREENCHIMENTO:
- **Nome/Safra/Produtor/Teor Alcoólico**: Extraia do texto ou deduza com alta confiança se o vinho for muito famoso.
- **Região/País**: Se identificar o vinho, preencha a região correta (ex: "Mendoza, Argentina" para Catena Malbec).
- **Estilo**: Descreva o corpo e estilo (ex: "Tinto encorpado com madeira presente").
- **Notas de Degustação**: Descreva os aromas e paladar TÍPICOS para este vinho/uva específico.
- **Harmonização**: Sugira pratos específicos que combinam bem.
- **Temperatura**: Indique a temperatura ideal de serviço.
- **Potencial/Guarda**: Indique se é para beber já ou pode guardar.
- **Preço**: Estime o valor médio de mercado no Brasil (R$).

FORMATO JSON ESPERADO:
{
  "wineName": "Nome completo do vinho",
  "winery": "Produtor",
  "vintage": "Ano",
  "region": "Região e País",
  "country": "País",
  "grapeVarieties": ["Uva 1", "Uva 2"],
  "alcoholContent": "Teor %",
  "wineType": "Tipo (Tinto, Branco, Rosé, Espumante, Sobremesa)",
  "style": "Descrição curta do estilo (ex: Encorpado, Frutado, Leve)",
  "tastingNotes": "Texto descritivo sobre aromas (frutas, madeira, especiarias) e paladar (taninos, acidez).",
  "foodPairings": ["Prato 1", "Prato 2", "Prato 3"],
  "priceRange": "Faixa de preço estimada R$",
  "servingTemp": "Temperatura ideal (ex: 16-18ºC)",
  "preservation": "Dica de consumo/guarda (ex: Pronto para beber, pode guardar 5 anos)",
  "occasions": ["Jantar romântico", "Churrasco", "Presente"],
  "description": "Resumo envolvente sobre o vinho, produtor e curiosidades."
}

REGRAS FINAIS:
- Responda SEMPRE em Português do Brasil.
- Seja detalhista nas notas e harmonizações.
    `;
  }
  // ... (rest of class)

  /**
   * Valida e enriquece a análise retornada pela OpenAI
   */
  private validateAndEnrichAnalysis(analysis: WineAnalysisResult): WineAnalysisResult {
    // Validações básicas e correções
    const validated: WineAnalysisResult = {
      ...analysis
    };

    // Enriquecer com informações padrão APENAS se o tipo for conhecido
    if (validated.wineType && (!validated.foodPairings?.length || validated.foodPairings[0] === "Informação não encontrada" || validated.foodPairings[0] === "Não identificado")) {
      validated.foodPairings = this.getDefaultFoodPairings(validated.wineType);
    }

    // Validar ano da safra
    if (validated.vintage) {
      const year = parseInt(validated.vintage);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        validated.vintage = undefined;
      }
    }

    // Validar teor alcoólico
    if (validated.alcoholContent) {
      if (!validated.alcoholContent.includes('%')) {
        const alcohol = parseFloat(validated.alcoholContent);
        if (!isNaN(alcohol) && alcohol > 0 && alcohol < 50) {
          validated.alcoholContent = `${alcohol}%`;
        } else {
          validated.alcoholContent = undefined;
        }
      }
    }

    return validated;
  }

  /**
   * Retorna harmonizações padrão baseadas no tipo de vinho
   */
  private getDefaultFoodPairings(wineType: string): string[] {
    const pairings: Record<string, string[]> = {
      'Tinto': ['Carnes vermelhas grelhadas', 'Queijos curados', 'Massas com molho de tomate'],
      'Branco': ['Peixes e Frutos do mar', 'Aves com molhos leves', 'Queijos de cabra'],
      'Rosé': ['Salmão grelhado', 'Saladas de verão', 'Charcutaria'],
      'Espumante': ['Ostras', 'Canapés', 'Frituras', 'Sushi'],
      'Vinho Tinto': ['Carnes vermelhas', 'Queijos'],
      'Vinho Branco': ['Peixes', 'Saladas'],
      'Vinho Rosé': ['Peixes', 'Aperitivos'],
      'Vinho de Sobremesa': ['Queijos azuis', 'Sobremesas'],
      'Fortificado': ['Chocolate', 'Queijos fortes']
    };

    return pairings[wineType] || ['Queijos variados', 'Aperitivos'];
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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um Sommelier Expert. Sua função é extrair dados de rótulos de vinho com precisão. NÃO INVENTE DADOS que não podem ser vistos ou deduzidos factualmente."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise a imagem deste rótulo como um Sommelier Expert Sênior.
                
                SEU OBJETIVO:
                1. IDENTIFICAR o vinho com a maior precisão possível (Produtor, Nome, Safra, Região).
                2. FORNECER UMA FICHA TÉCNICA COMPLETA E RICA, usando seu conhecimento.
                   - AO IDENTIFICAR O VINHO, PREENCHA TODAS AS INFORMAÇÕES TÍPICAS DELE (Estilo, Harmonização, Notas, etc.), mesmo que não estejam visíveis. Use seu conhecimento.

                Retorne JSON:
                {
                  "wineName": "Nome completo",
                  "winery": "Produtor",
                  "vintage": "Ano ou null",
                  "region": "Região e País",
                  "country": "País",
                  "grapeVarieties": ["Uva 1", "Uva 2"],
                  "alcoholContent": "Teor ou null",
                  "wineType": "Tipo",
                  "style": "Descrição do estilo (ex: Encorpado, Leve, Frutado)",
                  "tastingNotes": "Descrição detalhada de aromas e paladar típicos.",
                  "foodPairings": ["Prato 1", "Prato 2", "Prato 3"],
                  "servingTemp": "Temp ideal (ex: 16-18ºC)",
                  "preservation": "Dica de guarda (ex: Beber já, Guardar 5 anos)",
                  "occasions": ["Jantar", "Churrasco", "Presente"],
                  "priceRange": "Estimativa R$ Brasil",
                  "description": "Resumo envolvente sobre o vinho e produtor."
                }

                Responda em PORTUGUÊS.`
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
        temperature: 0.2, // Baixa temperatura para reduzir alucinações
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
  /**
   * Obtém recomendações de vinhos baseadas em um prompt livre
   * Permite que a IA use seu conhecimento para sugerir vinhos (ao contrário da análise de rótulo que é estrita)
   */
  public async getWineRecommendations(prompt: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI não está configurado.');
    }

    try {
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um Sommelier Expert criativo e prestativo. Sua tarefa é recomendar vinhos baseados no contexto fornecido. Use seu vasto conhecimento para sugerir vinhos reais e interessantes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7, // Mais criatividade para recomendações
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Resposta vazia da OpenAI');
      }

      return JSON.parse(response);
    } catch (error: any) {
      console.error('Erro ao obter recomendações:', error);
      throw error;
    }
  }
}

export const openaiService = OpenAIService.getInstance();