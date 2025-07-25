import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity 
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && (
          <View style={styles.checkIconContainer}>
            <Check size={14} color={colors.textLight} strokeWidth={3} />
          </View>
        )}
      </View>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: colors.primary,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.text,
    fontWeight: '500',
  },
});