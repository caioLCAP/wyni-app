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
        model: "gpt-4o", // Modelo mais capaz para melhor precisão e raciocínio
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
Analise o seguinte texto extraído de um rótulo de vinho e atue como um Sommelier Expert para identificar o vinho.

TEXTO DO RÓTULO:
"${extractedText}"

SEU OBJETIVO:
Identificar o vinho com precisão baseada APENAS nas informações presentes.

DIRETRIZES RÍGIDAS - NÃO INVENTE DADOS:
1. IDENTIFICAÇÃO: Extraia Nome, Vinícola, Safra e Região do texto.
2. ENRIQUECIMENTO FACTUAL (Permitido): Se você identificar o vinho com certeza (ex: "Brunello di Montalcino"), você PODE preencher informações que são fatos absolutos (ex: Uva "Sangiovese"), mesmo que não estejam no texto.
3. NÃO INVENTE:
   - Não chute o teor alcoólico se não estiver escrito.
   - Não invente uma safra se não estiver escrita.
   - Não invente nome de vinícola se não estiver claro.
   - PREÇO: Estime uma faixa de mercado REALISTA para o Brasil.

FORMATO JSON ESPERADO:
{
  "wineName": "Nome comercial identificado",
  "winery": "Produtor (se identificado)",
  "vintage": "Ano (apenas se explícito)",
  "region": "Região e País",
  "country": "País",
  "grapeVarieties": ["Uva 1", "Uva 2"],
  "alcoholContent": "Teor % (apenas se explícito, senão null)",
  "wineType": "Tipo (Tinto, Branco, Rosé, Espumante)",
  "tastingNotes": "Características sensoriais TÍPICAS deste vinho/uva.",
  "foodPairings": ["Harmonizações clássicas para este vinho"],
  "priceRange": "Faixa de preço estimada R$",
  "description": "Breve descrição sobre o vinho ou produtor."
}

REGRAS FINAIS:
- Responda SEMPRE em Português do Brasil.
- Se uma informação não for encontrada e não for um fato enciclopédico atrelado ao vinho identificado, use "Não identificado".
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
                text: `Analise a imagem deste rótulo. Extraia os dados visíveis e identifique o vinho.
                
                REGRAS DE OURO (ANTI-ALUCINAÇÃO):
                1. Extraia EXATAMENTE o que vê (Vinícola, Nome, Safra, Região).
                2. Se identificar o vinho com certeza (ex: reconhece o rótulo do "Casillero del Diablo Cabernet Sauvignon"), VOCÊ PODE preencher a uva e a região corretas baseado no seu conhecimento, POIS ISSO É FATO.
                3. SE NÃO TIVER CERTEZA, use "Não identificado".
                4. NÃO invente safra (vintage) se não estiver visível.
                5. NÃO invente teor alcoólico se não estiver visível.
                6. PREÇO: Estime o valor médio de mercado no Brasil (Isso é uma estimativa permitida).
                7. Harmonização e Notas: Forneça baseadas no TIPO de vinho identificado.

                Retorne JSON:
                {
                  "wineName": "Nome",
                  "winery": "Produtor",
                  "vintage": "Ano ou null",
                  "region": "Região",
                  "country": "País",
                  "grapeVarieties": ["List"],
                  "alcoholContent": "Teor ou null",
                  "wineType": "Tipo",
                  "tastingNotes": "Descrição típica",
                  "foodPairings": ["Lista"],
                  "priceRange": "Estimativa R$",
                  "description": "Breve descrição"
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