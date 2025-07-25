import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';

interface SectionHeaderProps {
  title: string;
  seeAllLink?: string;
}

export function SectionHeader({ title, seeAllLink }: SectionHeaderProps) {
  const handleSeeAll = () => {
    if (seeAllLink) {
      router.push(seeAllLink);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {seeAllLink && (
        <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
          <Text style={styles.seeAllText}>Ver Todos</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4, // Adiciona padding interno
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1, // Permite que o título ocupe o espaço disponível
    marginRight: 16, // Adiciona margem à direita do título
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Adiciona padding vertical para área de toque maior
    paddingHorizontal: 8, // Adiciona padding horizontal
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4, // Aumenta a margem entre texto e ícone
  },
});