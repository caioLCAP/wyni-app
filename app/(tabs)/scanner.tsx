import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Camera, Sparkles, Camera as CameraIcon, RotateCcw, Wine, TriangleAlert as AlertTriangle, ScanLine, BookOpen, Image as ImageIcon } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { WineDetailsCard } from '@/components/WineDetailsCard';
import { WineAnalysisModal } from '@/components/WineAnalysisModal';
import { LinearGradient } from 'expo-linear-gradient';
import { searchWineByName } from '@/services/wineService';
import { openaiService } from '@/services/openaiService';
import { WineType } from '@/types/wine';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { wineStorageService } from '@/services/wineStorageService';
import { useAuth } from '@/providers/AuthProvider';

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
  confidence?: number;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<WineType | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<WineAnalysisResult | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const cameraRef = useRef<any>(null);
  const { user } = useAuth();

  const handleOpenCamera = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }

    if (!permission.granted) {
      await requestPermission();
      return;
    }

    setShowCamera(true);
  };

  const handlePickImage = async () => {
    try {
      setError(null);
      
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar sua galeria de fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
        setShowCamera(false);
      }
    } catch (err) {
      console.error('Erro ao selecionar imagem:', err);
      setError('Erro ao selecionar imagem da galeria. Tente novamente.');
    }
  };
  
  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      setError(null);
      
      // Take the picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false
      });
      
      setCapturedPhoto(photo.uri);
      setShowCamera(false); // Fechar a câmera após capturar
    } catch (err) {
      setError('Erro ao capturar a foto. Tente novamente.');
    }
  };

  // Função para converter imagem em base64
  const imageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      if (typeof window !== 'undefined') {
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
      throw new Error('Falha ao processar a imagem');
    }
  };

  // Função para converter SavedWine para WineType
  const convertSavedWineToWineType = (savedWine: any): WineType => {
    return {
      id: `saved-${savedWine.id}`,
      name: savedWine.wine_name,
      type: savedWine.wine_type || 'Vinho',
      region: savedWine.region || 'Região não informada',
      year: savedWine.vintage || '2020',
      rating: savedWine.rating || 4.0,
      price: savedWine.price_range || 'Preço não informado',
      imageUrl: savedWine.image_url || 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
      description: savedWine.description || 'Vinho encontrado na sua biblioteca',
      grapes: savedWine.grape_varieties?.join(', ') || savedWine.wine_name,
      characteristics: [],
      pairings: savedWine.food_pairings || [],
      aromas: []
    };
  };

  const handleAnalyzePhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert('Erro', 'Nenhuma foto foi capturada');
      return;
    }
    
    if (analyzing) {
      return;
    }
    
    try {
      setAnalyzing(true);
      setError(null);
      setQuotaExceeded(false);
      
      // Converter imagem para base64
      const base64Image = await imageToBase64(capturedPhoto);
      
      // Análise direta com OpenAI Vision
      const aiAnalysis = await openaiService.analyzeWineImage(base64Image);
      
      if (!aiAnalysis) {
        throw new Error('A análise não retornou resultados');
      }
      
      // Verificar se o vinho já existe na biblioteca do usuário (se estiver logado)
      if (user && aiAnalysis.wineName) {
        try {
          const existingWine = await wineStorageService.findSavedWineByName(aiAnalysis.wineName);
          
          if (existingWine) {
            // Vinho encontrado na biblioteca - mostrar tela de vinho encontrado
            const wineType = convertSavedWineToWineType(existingWine);
            setScanResult(wineType);
            return;
          }
        } catch (error) {
          console.log('Erro ao buscar vinho na biblioteca:', error);
          // Continuar com o fluxo normal se houver erro na busca
        }
      }

      // Tentar buscar na base de dados de vinhos
      if (aiAnalysis.wineName) {
        const foundWine = await searchWineByName(aiAnalysis.wineName);
        if (foundWine) {
          setScanResult(foundWine);
          return;
        }
      }
      
      // Se não encontrou em lugar nenhum, mostrar modal de análise da IA
      setAiAnalysis(aiAnalysis);
      setShowAIModal(true);
      
    } catch (aiError: any) {
      let errorMessage = 'Não foi possível analisar o rótulo. ';
      let isQuotaError = false;
      
      if (aiError.message?.includes('Limite de uso da API OpenAI excedido') || 
          aiError.message?.includes('exceeded your current quota')) {
        errorMessage = 'Limite de uso da API OpenAI excedido.';
        isQuotaError = true;
        setQuotaExceeded(true);
      } else if (aiError.message?.includes('OpenAI não está configurado')) {
        errorMessage = 'Serviço de análise não está configurado. Entre em contato com o suporte.';
      } else if (aiError.message?.includes('Chave da API OpenAI inválida')) {
        errorMessage = 'Credenciais da API inválidas. Entre em contato com o suporte.';
      } else if (aiError.message?.includes('Erro interno do servidor OpenAI')) {
        errorMessage = 'Serviço de análise temporariamente indisponível. Tente novamente em alguns minutos.';
      } else if (aiError.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com a internet. Verifique sua conexão e tente novamente.';
      } else {
        errorMessage += `Erro: ${aiError.message}`;
      }
      
      setError(errorMessage);
      
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const resetCapture = () => {
    setCapturedPhoto(null);
    setScanResult(null);
    setError(null);
    setAiAnalysis(null);
    setAnalyzing(false);
    setShowCamera(false);
    setQuotaExceeded(false);
  };

  const handleScanAgain = () => {
    resetCapture();
  };

  const handleGoToLibrary = () => {
    resetCapture();
    router.push('/(tabs)/library');
  };

  const handleSaveWineFromAI = async (analysis: WineAnalysisResult) => {
    // Tentar buscar o vinho na base de dados primeiro
    if (analysis.wineName) {
      const foundWine = await searchWineByName(analysis.wineName);
      if (foundWine) {
        setScanResult(foundWine);
        setShowAIModal(false);
        return;
      }
    }
    
    // Se não encontrou, mostrar mensagem
    Alert.alert(
      'Vinho não encontrado',
      `O vinho "${analysis.wineName || 'identificado'}" não foi encontrado em nossa base de dados. Você pode adicioná-lo manualmente na seção "Adicionar Vinho".`,
      [{ text: 'OK' }]
    );
  };

  // Tela de resultado do vinho encontrado
  if (scanResult) {
    return (
      <View style={styles.resultContainer}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={styles.resultHeader}
        >
          <View style={styles.resultHeaderContent}>
            <Text style={styles.resultTitle}>Vinho Encontrado!</Text>
            <Text style={styles.resultSubtitle}>
              Informações da nossa base de dados
            </Text>
          </View>
        </LinearGradient>
        
        <View style={styles.resultContent}>
          <WineDetailsCard wine={scanResult} />
        </View>

        <View style={styles.resultFooter}>
          <TouchableOpacity 
            style={styles.scanAgainButton} 
            onPress={handleScanAgain}
          >
            <ScanLine size={20} color={colors.textLight} />
            <Text style={styles.scanAgainText}>Escanear Outro</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.libraryButton} 
            onPress={handleGoToLibrary}
          >
            <BookOpen size={20} color={colors.primary} />
            <Text style={styles.libraryText}>Ver Biblioteca</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Tela de preview da foto capturada
  if (capturedPhoto) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />
          
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.textLight} />
              <Text style={styles.analyzingText}>Analisando rótulo...</Text>
              <Text style={styles.analyzingSubtext}>
                Extraindo informações do rótulo
              </Text>
            </View>
          )}
        </View>
        
        {error && (
          <View style={[styles.errorContainer, quotaExceeded && styles.quotaErrorContainer]}>
            {quotaExceeded && <AlertTriangle size={20} color={colors.textLight} />}
            <Text style={styles.errorText}>{error}</Text>
            {quotaExceeded && (
              <View style={styles.quotaErrorDetails}>
                <Text style={styles.quotaErrorSubtext}>
                  Para continuar usando a análise:
                </Text>
                <Text style={styles.quotaErrorStep}>
                  • Acesse platform.openai.com
                </Text>
                <Text style={styles.quotaErrorStep}>
                  • Verifique seu plano e informações de cobrança
                </Text>
                <Text style={styles.quotaErrorStep}>
                  • Adicione créditos ou atualize seu plano
                </Text>
                <Text style={styles.quotaErrorAlternative}>
                  Você pode continuar usando o app para buscar vinhos manualmente na seção "Adicionar Vinho".
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.photoActions}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={resetCapture}
            disabled={analyzing}
          >
            <RotateCcw size={20} color={colors.text} />
            <Text style={styles.secondaryButtonText}>Tirar Nova Foto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.analyzeButton, 
              analyzing && styles.analyzingButton,
              quotaExceeded && styles.disabledButton
            ]} 
            onPress={handleAnalyzePhoto}
            disabled={analyzing || quotaExceeded}
            activeOpacity={0.7}
          >
            <Sparkles size={24} color={quotaExceeded ? colors.textSecondary : colors.textLight} />
            <Text style={[
              styles.analyzeButtonText,
              quotaExceeded && styles.disabledButtonText
            ]}>
              {analyzing ? 'Analisando...' : quotaExceeded ? 'Análise Indisponível' : 'Analisar'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionTitle}>Próximos Passos</Text>
          <Text style={styles.instructionText}>
            • Revise se a foto capturou bem o rótulo
          </Text>
          {!quotaExceeded && (
            <Text style={styles.instructionText}>
              • Toque em "Analisar" para extrair informações
            </Text>
          )}
          <Text style={styles.instructionText}>
            • Ou tire uma nova foto se necessário
          </Text>
          {quotaExceeded && (
            <Text style={styles.instructionText}>
              • Use a busca manual na seção "Adicionar Vinho"
            </Text>
          )}
          
          {!quotaExceeded && (
            <View style={styles.aiFeatures}>
              <Text style={styles.featuresTitle}>📋 O que podemos identificar:</Text>
              <Text style={styles.featureItem}>• Nome do vinho e vinícola</Text>
              <Text style={styles.featureItem}>• Safra e região de origem</Text>
              <Text style={styles.featureItem}>• Castas e tipo de vinho</Text>
              <Text style={styles.featureItem}>• Notas de degustação</Text>
              <Text style={styles.featureItem}>• Harmonizações gastronômicas</Text>
              <Text style={styles.featureItem}>• Estimativa de preço</Text>
            </View>
          )}
        </View>

        <WineAnalysisModal
          visible={showAIModal}
          onClose={() => setShowAIModal(false)}
          analysis={aiAnalysis}
          onSaveWine={handleSaveWineFromAI}
        />
      </ScrollView>
    );
  }

  // Tela da câmera
  if (showCamera) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            type={cameraType}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
              
              <Text style={styles.cameraInstructionText}>
                Posicione o rótulo do vinho dentro do quadro
              </Text>
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.cameraButton} onPress={toggleCameraType}>
                <Camera size={24} color={colors.textLight} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={() => setShowCamera(false)}
              >
                <RotateCcw size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </View>
    );
  }

  // Tela inicial com botão para tirar foto
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.homeScrollContent}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Wine size={80} color={colors.textLight} />
          <Text style={styles.heroTitle}>Scanner de Vinhos</Text>
          <Text style={styles.heroSubtitle}>
            Fotografe o rótulo e descubra tudo sobre o vinho
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.mainContent}>
        <TouchableOpacity 
          style={styles.photoButton} 
          onPress={handleOpenCamera}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.photoButtonGradient}
          >
            <CameraIcon size={32} color={colors.textLight} />
            <Text style={styles.photoButtonText}>Tirar Foto do Rótulo</Text>
            <Text style={styles.photoButtonSubtext}>Toque para abrir a câmera</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryButton} 
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          <View style={styles.galleryButtonContent}>
            <ImageIcon size={28} color={colors.primary} />
            <Text style={styles.galleryButtonText}>Escolher da Galeria</Text>
            <Text style={styles.galleryButtonSubtext}>Selecione uma foto existente</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Como Funciona</Text>
          
          <View style={styles.featureStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Capture ou Selecione o Rótulo</Text>
              <Text style={styles.stepDescription}>
                Tire uma foto com a câmera ou selecione uma imagem da sua galeria
              </Text>
            </View>
          </View>

          <View style={styles.featureStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Descubra o Vinho</Text>
              <Text style={styles.stepDescription}>
                Nosso sistema analisa a imagem e extrai informações do rótulo automaticamente
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.aiFeatures}>
          <Text style={styles.featuresTitle}>📋 O que podemos identificar:</Text>
          <Text style={styles.featureItem}>• Nome do vinho e vinícola</Text>
          <Text style={styles.featureItem}>• Safra e região de origem</Text>
          <Text style={styles.featureItem}>• Castas e tipo de vinho</Text>
          <Text style={styles.featureItem}>• Notas de degustação</Text>
          <Text style={styles.featureItem}>• Harmonizações gastronômicas</Text>
          <Text style={styles.featureItem}>• Estimativa de preço</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  homeScrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  photoButton: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  photoButtonGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 12,
    marginBottom: 4,
  },
  photoButtonSubtext: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.8,
  },
  galleryButton: {
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    overflow: 'hidden',
  },
  galleryButtonContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  galleryButtonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: Math.min(SCREEN_WIDTH * 0.7, 280),
    height: Math.min(SCREEN_WIDTH * 0.9, 380),
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.textLight,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.textLight,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.textLight,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.textLight,
  },
  cameraInstructionText: {
    color: colors.textLight,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.textLight,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.textLight,
  },
  photoPreviewContainer: {
    height: SCREEN_HEIGHT * 0.5,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  analyzingSubtext: {
    color: colors.textLight,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  photoActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.background,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  analyzingButton: {
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  quotaErrorContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 16,
    alignItems: 'flex-start',
  },
  errorText: {
    color: colors.textLight,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  quotaErrorDetails: {
    marginTop: 12,
    width: '100%',
  },
  quotaErrorSubtext: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quotaErrorStep: {
    color: colors.textLight,
    fontSize: 13,
    marginBottom: 4,
    paddingLeft: 8,
  },
  quotaErrorAlternative: {
    color: colors.textLight,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  instructionsSection: {
    padding: 20,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 8,
  },
  aiFeatures: {
    backgroundColor: '#8B5CF6' + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#8B5CF6' + '30',
  },
  featureItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    paddingLeft: 8,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  resultHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  resultHeaderContent: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  resultContent: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
  },
  resultFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanAgainText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 16,
  },
  libraryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  libraryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});