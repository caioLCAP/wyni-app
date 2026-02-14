import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeContext, useTheme } from '@/hooks/useTheme';
import { AuthProvider } from '@/providers/AuthProvider';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import { locationService } from '@/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const LOCATION_PERMISSION_KEY = 'location_permission_requested';

export default function RootLayout() {
  useFrameworkReady();
  const themeContext = useTheme();
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      // Check if we've already asked for permission
      const hasAsked = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);

      if (!hasAsked) {
        // Show modal on first app launch
        setTimeout(() => {
          setShowLocationModal(true);
        }, 2000); // Show after 2 seconds to let the app load
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const handleAllowLocation = async () => {
    try {
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
      setShowLocationModal(false);

      // Request location permission
      const hasPermission = await locationService.requestLocationPermission();
      if (hasPermission) {
        // Get location in background
        locationService.getCurrentLocation().catch(console.error);
      }
    } catch (error) {
      console.error('Error handling location permission:', error);
    }
  };

  const handleDenyLocation = async () => {
    try {
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error handling location denial:', error);
    }
  };

  const handleCloseModal = async () => {
    try {
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'dismissed');
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error handling modal close:', error);
    }
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeContext.Provider value={themeContext}>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            <StatusBar style="auto" />

            <LocationPermissionModal
              visible={showLocationModal}
              onAllow={handleAllowLocation}
              onDeny={handleDenyLocation}
              onClose={handleCloseModal}
            />
          </AuthProvider>
        </ThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}