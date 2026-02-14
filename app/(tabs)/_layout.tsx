import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { BookOpen, Utensils as UtensilsIcon, ScanLine, User, Plus, Sun, Moon, Wine, Home } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useTheme();
  const { isGuest } = useAuth();
  const pathname = usePathname();

  // Show FAB only on home tab and for non-guests
  const shouldShowFAB = (pathname === '/' || pathname === '/(tabs)') && !isGuest;

  const handleGuestAccess = () => {
    Alert.alert(
      'Acesso Restrito',
      'Para acessar esta funcionalidade, você precisa fazer login ou criar uma conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Fazer Login',
          onPress: () => router.push('/login')
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: 48,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    headerTextContainer: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textLight,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textLight,
      opacity: 0.8,
      textAlign: 'center',
    },
    themeToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryDark,
      borderRadius: 24,
      padding: 6,
      position: 'absolute',
      right: 0,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    themeIcon: {
      opacity: 0.6,
      padding: 2,
    },
    activeThemeIcon: {
      opacity: 1,
      backgroundColor: colors.primaryLight + '40',
      borderRadius: 12,
    },
    themeSwitch: {
      transform: [{ scale: 0.8 }],
      marginHorizontal: 2,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 76,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>WYNI</Text>
            <Text style={styles.headerSubtitle}>O vinho do seu jeito</Text>
          </View>
          <View style={styles.themeToggleContainer}>
            <Sun
              size={18}
              color={colors.textLight}
              style={[styles.themeIcon, theme === 'light' && styles.activeThemeIcon]}
            />
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{
                false: colors.primaryLight + '40',
                true: colors.primaryLight + '40'
              }}
              thumbColor={colors.textLight}
              ios_backgroundColor={colors.primaryLight + '40'}
              style={styles.themeSwitch}
            />
            <Moon
              size={18}
              color={colors.textLight}
              style={[styles.themeIcon, theme === 'dark' && styles.activeThemeIcon]}
            />
          </View>
        </View>
      </View>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: theme === 'dark' ? colors.textLight : colors.neutral,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            color: theme === 'dark' ? colors.textLight : undefined,
          },
          tabBarIconStyle: {
            marginBottom: -4,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Biblioteca',
            tabBarIcon: ({ color, size }) => <Wine size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                handleGuestAccess();
              }
            },
          }}
        />
        <Tabs.Screen
          name="add-wine"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pairings"
          options={{
            title: 'Harmonizações',
            tabBarIcon: ({ color, size }) => <UtensilsIcon size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                handleGuestAccess();
              }
            },
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color, size }) => <ScanLine size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                handleGuestAccess();
              }
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                handleGuestAccess();
              }
            },
          }}
        />
      </Tabs>

      {shouldShowFAB && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 76 + insets.bottom }]}
          onPress={() => router.push('/add-wine')}
        >
          <Plus size={24} color={colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}