import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface PairingProps {
  id: string;
  food: string;
  wine: string;
  imageUrl: string;
  description: string;
}

interface PairingCardProps {
  pairing: PairingProps;
}

export function PairingCard({ pairing }: PairingCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: pairing.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.food}>{pairing.food}</Text>
            <Text style={styles.wine}>{pairing.wine}</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.description} numberOfLines={2}>{pairing.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  food: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  wine: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});