import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface CollapsibleFilterSectionProps {
    title: string;
    children: React.ReactNode;
    initialExpanded?: boolean;
}

export function CollapsibleFilterSection({
    title,
    children,
    initialExpanded = false
}: CollapsibleFilterSectionProps) {
    const [expanded, setExpanded] = useState(initialExpanded);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
                <Text style={styles.title}>{title}</Text>
                {expanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                )}
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    content: {
        paddingBottom: 16,
    },
});
