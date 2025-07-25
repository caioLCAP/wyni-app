import { Platform, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';

export interface ShareWineData {
  name: string;
  winery?: string;
  region?: string;
  vintage?: string;
  description?: string;
  rating?: number;
  grapes?: string;
}

export class ShareService {
  private static instance: ShareService;

  public static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  /**
   * Compartilha um vinho usando o Share nativo
   */
  async shareWine(wine: ShareWineData): Promise<void> {
    try {
      const message = this.formatWineMessage(wine);
      
      if (Platform.OS === 'web') {
        // Try Web Share API first, with fallback to clipboard
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${wine.name} - WYNI`,
              text: message,
            });
            console.log('Vinho compartilhado com sucesso');
            return;
          } catch (shareError) {
            console.log('Web Share API failed, falling back to clipboard');
          }
        }
        
        // Fallback to clipboard for web
        await Clipboard.setStringAsync(message);
        alert('Detalhes do vinho copiados para a área de transferência!');
        console.log('Vinho copiado para clipboard com sucesso');
        return;
      }

      // For mobile platforms
      const result = await Share.share({
        message,
        title: `${wine.name} - WYNI`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Vinho compartilhado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      throw new Error('Não foi possível compartilhar o vinho');
    }
  }

  /**
   * Compartilha especificamente no WhatsApp
   */
  async shareToWhatsApp(wine: ShareWineData): Promise<void> {
    try {
      const message = this.formatWineMessage(wine);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

      if (Platform.OS === 'web') {
        window.open(whatsappUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(whatsappUrl);
      }
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error);
      throw new Error('Não foi possível abrir o WhatsApp');
    }
  }

  /**
   * Compartilha no Facebook
   */
  async shareToFacebook(wine: ShareWineData): Promise<void> {
    try {
      const message = this.formatWineMessage(wine);
      const encodedMessage = encodeURIComponent(message);
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedMessage}`;

      if (Platform.OS === 'web') {
        window.open(facebookUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(facebookUrl);
      }
    } catch (error) {
      console.error('Erro ao compartilhar no Facebook:', error);
      throw new Error('Não foi possível abrir o Facebook');
    }
  }

  /**
   * Compartilha no Instagram (abre o app)
   */
  async shareToInstagram(wine: ShareWineData): Promise<void> {
    try {
      const message = this.formatWineMessage(wine);
      
      if (Platform.OS === 'web') {
        // No web, copia para clipboard e abre Instagram
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          window.open('https://www.instagram.com/', '_blank');
          alert('Texto copiado! Cole no Instagram.');
        } else {
          throw new Error('Clipboard não disponível');
        }
      } else {
        // No mobile, tenta abrir o Instagram
        const instagramUrl = 'instagram://';
        await WebBrowser.openBrowserAsync(instagramUrl);
      }
    } catch (error) {
      console.error('Erro ao compartilhar no Instagram:', error);
      throw new Error('Não foi possível abrir o Instagram');
    }
  }

  /**
   * Compartilha no Twitter
   */
  async shareToTwitter(wine: ShareWineData): Promise<void> {
    try {
      const message = this.formatWineMessage(wine);
      const encodedMessage = encodeURIComponent(message);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;

      if (Platform.OS === 'web') {
        window.open(twitterUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(twitterUrl);
      }
    } catch (error) {
      console.error('Erro ao compartilhar no Twitter:', error);
      throw new Error('Não foi possível abrir o Twitter');
    }
  }

  /**
   * Formata a mensagem do vinho para compartilhamento
   */
  private formatWineMessage(wine: ShareWineData): string {
    let message = `🍷 ${wine.name}`;
    
    if (wine.winery) {
      message += `\n🏛️ ${wine.winery}`;
    }
    
    if (wine.region) {
      message += `\n📍 ${wine.region}`;
    }
    
    if (wine.vintage) {
      message += `\n📅 Safra ${wine.vintage}`;
    }
    
    if (wine.grapes) {
      message += `\n🍇 ${wine.grapes}`;
    }
    
    if (wine.rating) {
      const stars = '⭐'.repeat(Math.floor(wine.rating));
      message += `\n${stars} ${wine.rating}/5`;
    }
    
    if (wine.description) {
      message += `\n\n${wine.description}`;
    }
    
    message += '\n\n📱 Descoberto com WYNI - O vinho do seu jeito';
    
    return message;
  }

  /**
   * Mostra opções de compartilhamento
   */
  getShareOptions(): Array<{
    name: string;
    icon: string;
    action: (wine: ShareWineData) => Promise<void>;
  }> {
    return [
      {
        name: 'WhatsApp',
        icon: 'message-circle',
        action: this.shareToWhatsApp.bind(this),
      },
      {
        name: 'Facebook',
        icon: 'facebook',
        action: this.shareToFacebook.bind(this),
      },
      {
        name: 'Instagram',
        icon: 'instagram',
        action: this.shareToInstagram.bind(this),
      },
      {
        name: 'Twitter',
        icon: 'twitter',
        action: this.shareToTwitter.bind(this),
      },
      {
        name: 'Mais opções',
        icon: 'share',
        action: this.shareWine.bind(this),
      },
    ];
  }
}

export const shareService = ShareService.getInstance();