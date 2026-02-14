import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Star, Clock, Tag, MapPin, Grape, Wine, Utensils } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface WineDetailsCardProps {
  wine: {
    id: string;
    name: string;
    region: string;
    grapes?: string;
    year: string;
    type?: string;
    rating: number;
    price: string;
    imageUrl: string;
    description?: string;
    pairings?: string[];
    characteristics?: string[];
    aromas?: string[];
    weather?: string;
    moment?: string;
    location?: string;
  };
}

export function WineDetailsCard({ wine }: WineDetailsCardProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: wine.imageUrl }} style={styles.image} />
        </View>

        <View style={styles.header}>
          <Text style={styles.name}>{wine.name}</Text>

          <View style={styles.basicInfo}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.infoText}>{wine.region}</Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={18} color={colors.primary} />
              <Text style={styles.infoText}>Safra {wine.year}</Text>
            </View>

            <View style={styles.infoRow}>
              <Wine size={18} color={colors.primary} />
              <Text style={styles.infoText}>{wine.type}</Text>
            </View>
          </View>

          <View style={styles.ratingPriceRow}>
            <View style={styles.ratingContainer}>
              <Star size={20} color={colors.secondary} fill={colors.secondary} />
              <Text style={styles.ratingText}>{wine.rating}</Text>
            </View>
            <Text style={styles.price}>{wine.price}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Contexto do Momento */}
          {(wine.weather || wine.moment) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contexto</Text>
              <View style={styles.contextContainer}>
                {wine.moment && (
                  <View style={styles.contextItem}>
                    <Text style={styles.contextLabel}>Momento</Text>
                    <Text style={styles.contextValue}>{wine.moment}</Text>
                  </View>
                )}
                {wine.weather && (
                  <View style={styles.contextItem}>
                    <Text style={styles.contextLabel}>Clima</Text>
                    <Text style={styles.contextValue}>{wine.weather}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{wine.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Grape size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Castas/Uvas</Text>
            </View>
            <View style={styles.grapesContainer}>
              <Text style={styles.grapesText}>{wine.grapes}</Text>
            </View>
          </View>

          {wine.characteristics && wine.characteristics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Características</Text>
              <View style={styles.tagsContainer}>
                {wine.characteristics.map((characteristic, index) => (
                  <View key={index} style={styles.characteristicTag}>
                    <Text style={styles.characteristicTagText}>{characteristic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {wine.aromas && wine.aromas.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aromas</Text>
              <View style={styles.tagsContainer}>
                {wine.aromas.map((aroma, index) => (
                  <View key={index} style={styles.aromaTag}>
                    <Text style={styles.aromaTagText}>{aroma}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {wine.pairings && wine.pairings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Utensils size={20} color={colors.secondary} />
                <Text style={styles.sectionTitle}>Harmonizações</Text>
              </View>
              <View style={styles.tagsContainer}>
                {wine.pairings.map((pairing, index) => (
                  <View key={index} style={styles.pairingTag}>
                    <Text style={styles.pairingTagText}>{pairing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Padding bottom para garantir que o conteúdo não seja cortado */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 450,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 32,
  },
  basicInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  ratingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginLeft: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  grapesContainer: {
    backgroundColor: colors.primaryLight + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight + '30',
  },
  grapesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characteristicTag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  characteristicTagText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  aromaTag: {
    backgroundColor: '#8B5CF6' + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aromaTagText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  pairingTag: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pairingTagText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  contextContainer: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  contextItem: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contextValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});