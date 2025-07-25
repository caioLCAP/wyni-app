import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Star, Clock, Tag } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface WineDetailsCardProps {
  wine: {
    id: string;
    name: string;
    region: string;
    grapes: string;
    year: string;
    rating: number;
    price: string;
    imageUrl: string;
    description: string;
    pairings: string[];
    characteristics: string[];
  };
}

export function WineDetailsCard({ wine }: WineDetailsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: wine.imageUrl }} style={styles.image} />
      </View>
      
      <View style={styles.header}>
        <Text style={styles.name}>{wine.name}</Text>
        <Text style={styles.region}>{wine.region}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{wine.year}</Text>
          </View>
          
          <View style={styles.detail}>
            <Tag size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{wine.grapes}</Text>
          </View>
          
          <View style={styles.detail}>
            <Star size={16} color={colors.secondary} fill={colors.secondary} />
            <Text style={styles.detailText}>{wine.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.price}>{wine.price}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.description}>{wine.description}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.tagsContainer}>
          {wine.characteristics.map((characteristic, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{characteristic}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Harmonizações</Text>
        <View style={styles.tagsContainer}>
          {wine.pairings.map((pairing, index) => (
            <View key={index} style={[styles.tag, styles.pairingTag]}>
              <Text style={[styles.tagText, styles.pairingTagText]}>{pairing}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 280,
    resizeMode: 'contain',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  region: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primaryLight + '20', // 20% opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
  },
  pairingTag: {
    backgroundColor: colors.secondary + '20', // 20% opacity
  },
  pairingTagText: {
    color: colors.secondaryDark,
  },
});