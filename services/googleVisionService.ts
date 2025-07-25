import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Configuração do Google Cloud Vision
const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

interface OCRResult {
  fullText: string;
  textBlocks: Array<{
    text: string;
    confidence?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
}

export class GoogleVisionService {
  private static instance: GoogleVisionService;

  public static getInstance(): GoogleVisionService {
    if (!GoogleVisionService.instance) {
      GoogleVisionService.instance = new GoogleVisionService();
    }
    return GoogleVisionService.instance;
  }

  /**
   * Converte uma imagem em base64 para análise
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // Para web, usar fetch para converter
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Para mobile, usar FileSystem
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Erro ao converter imagem para base64:', error);
      throw new Error('Falha ao processar a imagem');
    }
  }

  /**
   * Extrai texto de uma imagem usando Google Cloud Vision API
   */
  public async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
      // Verificar se a API key está configurada
      if (!GOOGLE_CLOUD_VISION_API_KEY) {
        throw new Error('Google Cloud Vision API key não configurada. Adicione EXPO_PUBLIC_GOOGLE_VISION_API_KEY ao arquivo .env');
      }

      // Converter imagem para base64
      const base64Image = await this.imageToBase64(imageUri);

      // Preparar requisição para a API
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 50,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 50,
              },
            ],
            imageContext: {
              languageHints: ['pt', 'en', 'es', 'fr', 'it'], // Múltiplos idiomas para rótulos de vinho
            },
          },
        ],
      };

      // Fazer requisição para a API
      const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Response Error:', errorData);
        
        if (response.status === 403) {
          throw new Error('API key inválida ou sem permissões. Verifique sua chave do Google Cloud Vision API.');
        }
        
        throw new Error(`API Error: ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data: VisionResponse = await response.json();
      const result = data.responses[0];

      if (result.error) {
        throw new Error(`Vision API Error: ${result.error.message}`);
      }

      // Processar resultados
      const processedResult = this.processVisionResults(result);
      
      // Verificar se algum texto foi extraído
      if (!processedResult.fullText || processedResult.fullText.trim().length === 0) {
        throw new Error('Nenhum texto foi detectado na imagem. Tente uma imagem com texto mais claro ou com melhor qualidade.');
      }

      return processedResult;
    } catch (error) {
      console.error('Erro na extração de texto:', error);
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Erro desconhecido ao processar a imagem'
      );
    }
  }

  /**
   * Processa os resultados da Vision API
   */
  private processVisionResults(result: VisionResponse['responses'][0]): OCRResult {
    const textBlocks: OCRResult['textBlocks'] = [];
    let fullText = '';

    // Usar fullTextAnnotation se disponível (melhor para texto estruturado)
    if (result.fullTextAnnotation?.text) {
      fullText = result.fullTextAnnotation.text;
    }

    // Processar textAnnotations para blocos individuais
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      // O primeiro elemento contém todo o texto
      if (!fullText && result.textAnnotations[0]) {
        fullText = result.textAnnotations[0].description;
      }

      // Processar blocos individuais (pular o primeiro que é o texto completo)
      for (let i = 1; i < result.textAnnotations.length; i++) {
        const annotation = result.textAnnotations[i];
        
        let boundingBox;
        if (annotation.boundingPoly?.vertices) {
          const vertices = annotation.boundingPoly.vertices;
          const minX = Math.min(...vertices.map(v => v.x));
          const minY = Math.min(...vertices.map(v => v.y));
          const maxX = Math.max(...vertices.map(v => v.x));
          const maxY = Math.max(...vertices.map(v => v.y));
          
          boundingBox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };
        }

        textBlocks.push({
          text: annotation.description,
          boundingBox,
        });
      }
    }

    return {
      fullText: fullText.trim(),
      textBlocks,
    };
  }

  /**
   * Analisa texto extraído para identificar informações de vinho
   */
  public analyzeWineText(ocrResult: OCRResult): {
    wineName?: string;
    winery?: string;
    vintage?: string;
    region?: string;
    alcoholContent?: string;
    grapeVarieties?: string[];
    allText: string;
  } {
    const text = ocrResult.fullText.toLowerCase();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const analysis = {
      allText: ocrResult.fullText,
      wineName: undefined as string | undefined,
      winery: undefined as string | undefined,
      vintage: undefined as string | undefined,
      region: undefined as string | undefined,
      alcoholContent: undefined as string | undefined,
      grapeVarieties: [] as string[],
    };

    // Padrões para identificar informações
    const patterns = {
      vintage: /\b(19|20)\d{2}\b/g,
      alcohol: /(\d{1,2}[.,]\d{1,2})\s*%/g,
      volume: /\b\d{2,4}\s*ml\b/g,
    };

    // Buscar ano/vintage
    const vintageMatches = text.match(patterns.vintage);
    if (vintageMatches) {
      // Pegar o ano mais recente que faz sentido para vinho
      const years = vintageMatches.map(y => parseInt(y)).filter(y => y >= 1900 && y <= new Date().getFullYear());
      if (years.length > 0) {
        analysis.vintage = Math.max(...years).toString();
      }
    }

    // Buscar teor alcoólico
    const alcoholMatches = text.match(patterns.alcohol);
    if (alcoholMatches) {
      analysis.alcoholContent = alcoholMatches[0];
    }

    // Identificar possível nome do vinho (geralmente nas primeiras linhas)
    if (lines.length > 0) {
      // Filtrar linhas que não são apenas números ou códigos
      const potentialNames = lines.filter(line => 
        line.length > 3 && 
        !/^\d+$/.test(line) && 
        !line.includes('%') &&
        !line.includes('ml') &&
        !line.includes('vol') &&
        !/^\d{4}$/.test(line) // Não é apenas um ano
      );
      
      if (potentialNames.length > 0) {
        analysis.wineName = potentialNames[0];
      }
    }

    // Buscar variedades de uva comuns
    const commonGrapes = [
      'cabernet sauvignon', 'merlot', 'chardonnay', 'pinot noir', 'sauvignon blanc',
      'syrah', 'shiraz', 'riesling', 'pinot grigio', 'pinot gris', 'sangiovese', 
      'tempranillo', 'malbec', 'grenache', 'chenin blanc', 'gewürztraminer', 
      'viognier', 'nebbiolo', 'barbera', 'dolcetto', 'carménère', 'petit verdot',
      'mourvèdre', 'carignan', 'cinsault', 'roussanne', 'marsanne', 'vermentino',
      'fiano', 'falanghina', 'greco', 'aglianico', 'primitivo', 'nero d\'avola',
      'montepulciano', 'corvina', 'rondinella', 'molinara', 'garganega',
      'trebbiano', 'malvasia', 'moscato', 'brachetto', 'cortese', 'arneis',
      'roero', 'barolo', 'barbaresco', 'chianti', 'brunello'
    ];

    for (const grape of commonGrapes) {
      if (text.includes(grape)) {
        analysis.grapeVarieties.push(grape);
      }
    }

    // Buscar regiões vinícolas famosas
    const wineRegions = [
      'bordeaux', 'burgundy', 'champagne', 'loire', 'rhône', 'alsace', 'provence',
      'languedoc', 'roussillon', 'beaujolais', 'chablis', 'sancerre', 'pouilly',
      'tuscany', 'toscana', 'piedmont', 'piemonte', 'veneto', 'sicily', 'sicilia',
      'puglia', 'campania', 'abruzzo', 'marche', 'umbria', 'lazio', 'emilia',
      'rioja', 'ribera del duero', 'priorat', 'rías baixas', 'jerez', 'sherry',
      'douro', 'alentejo', 'vinho verde', 'dão', 'bairrada', 'madeira', 'porto',
      'napa valley', 'sonoma', 'paso robles', 'santa barbara', 'oregon', 'washington',
      'mendoza', 'maipo', 'casablanca', 'colchagua', 'aconcagua', 'uco valley',
      'barossa', 'hunter valley', 'margaret river', 'yarra valley', 'adelaide',
      'stellenbosch', 'paarl', 'constantia', 'swartland', 'walker bay'
    ];

    for (const region of wineRegions) {
      if (text.includes(region)) {
        analysis.region = region;
        break; // Pegar apenas a primeira região encontrada
      }
    }

    return analysis;
  }
}

export const googleVisionService = GoogleVisionService.getInstance();