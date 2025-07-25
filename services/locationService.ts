import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

export interface LocationContext {
  climate: 'tropical' | 'temperate' | 'continental' | 'mediterranean' | 'subtropical';
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  culturalRegion: 'brazil' | 'europe' | 'northAmerica' | 'southAmerica' | 'asia' | 'oceania' | 'africa';
  wineRegion?: string;
}

export class LocationService {
  private static instance: LocationService;
  private cachedLocation: UserLocation | null = null;
  private locationContext: LocationContext | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permission and get user location
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current user location
   */
  public async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      // Check if we have cached location (valid for 1 hour)
      if (this.cachedLocation) {
        return this.cachedLocation;
      }

      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Get address information
      const addressInfo = await this.reverseGeocode(latitude, longitude);

      const userLocation: UserLocation = {
        latitude,
        longitude,
        ...addressInfo
      };

      this.cachedLocation = userLocation;
      this.locationContext = this.analyzeLocationContext(userLocation);

      return userLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address information
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<Partial<UserLocation>> {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        return {
          city: address.city || address.district || undefined,
          region: address.region || address.subregion || undefined,
          country: address.country || undefined,
          countryCode: address.isoCountryCode || undefined,
        };
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }

    return {};
  }

  /**
   * Analyze location to determine climate, season, and cultural context
   */
  private analyzeLocationContext(location: UserLocation): LocationContext {
    const { latitude, countryCode, country } = location;

    // Determine climate based on latitude
    const climate = this.determineClimate(latitude);
    
    // Determine season based on latitude and current date
    const season = this.determineSeason(latitude);
    
    // Determine cultural region
    const culturalRegion = this.determineCulturalRegion(countryCode, country);
    
    // Check if location is in a known wine region
    const wineRegion = this.identifyWineRegion(location);

    return {
      climate,
      season,
      culturalRegion,
      wineRegion
    };
  }

  /**
   * Determine climate based on latitude
   */
  private determineClimate(latitude: number): LocationContext['climate'] {
    const absLat = Math.abs(latitude);
    
    if (absLat <= 23.5) return 'tropical';
    if (absLat <= 35) return 'subtropical';
    if (absLat <= 45) return 'temperate';
    if (absLat <= 60) return 'continental';
    return 'temperate'; // Default
  }

  /**
   * Determine current season based on latitude and date
   */
  private determineSeason(latitude: number): LocationContext['season'] {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Northern hemisphere
    if (latitude >= 0) {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'autumn';
      return 'winter';
    }
    // Southern hemisphere (seasons are opposite)
    else {
      if (month >= 2 && month <= 4) return 'autumn';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
  }

  /**
   * Determine cultural region based on country
   */
  private determineCulturalRegion(countryCode?: string, country?: string): LocationContext['culturalRegion'] {
    if (!countryCode && !country) return 'brazil'; // Default

    const code = countryCode?.toUpperCase();
    const countryName = country?.toLowerCase();

    // Brazil
    if (code === 'BR' || countryName?.includes('brasil') || countryName?.includes('brazil')) {
      return 'brazil';
    }

    // Europe
    const europeanCodes = ['FR', 'IT', 'ES', 'PT', 'DE', 'AT', 'CH', 'GB', 'IE', 'NL', 'BE', 'LU', 'GR', 'CY'];
    if (code && europeanCodes.includes(code)) {
      return 'europe';
    }

    // North America
    if (code === 'US' || code === 'CA' || code === 'MX') {
      return 'northAmerica';
    }

    // South America
    const southAmericanCodes = ['AR', 'CL', 'UY', 'PY', 'BO', 'PE', 'EC', 'CO', 'VE', 'GY', 'SR', 'GF'];
    if (code && southAmericanCodes.includes(code)) {
      return 'southAmerica';
    }

    // Asia
    const asianCodes = ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH'];
    if (code && asianCodes.includes(code)) {
      return 'asia';
    }

    // Oceania
    if (code === 'AU' || code === 'NZ') {
      return 'oceania';
    }

    // Africa
    const africanCodes = ['ZA', 'EG', 'MA', 'TN', 'KE', 'NG', 'GH'];
    if (code && africanCodes.includes(code)) {
      return 'africa';
    }

    return 'brazil'; // Default fallback
  }

  /**
   * Identify if location is in a known wine region
   */
  private identifyWineRegion(location: UserLocation): string | undefined {
    const { latitude, longitude, region, country } = location;

    // Famous wine regions with approximate coordinates
    const wineRegions = [
      // France
      { name: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792, radius: 100 },
      { name: 'Borgonha', country: 'France', lat: 47.0500, lng: 4.8667, radius: 80 },
      { name: 'Champagne', country: 'France', lat: 49.0000, lng: 4.0000, radius: 100 },
      { name: 'Loire', country: 'France', lat: 47.2000, lng: 1.5000, radius: 150 },
      { name: 'Rhône', country: 'France', lat: 44.5000, lng: 4.8000, radius: 120 },
      
      // Italy
      { name: 'Toscana', country: 'Italy', lat: 43.4500, lng: 11.2000, radius: 100 },
      { name: 'Piemonte', country: 'Italy', lat: 45.0000, lng: 8.0000, radius: 80 },
      { name: 'Vêneto', country: 'Italy', lat: 45.5000, lng: 12.0000, radius: 100 },
      
      // Spain
      { name: 'Rioja', country: 'Spain', lat: 42.4500, lng: -2.5000, radius: 80 },
      { name: 'Ribera del Duero', country: 'Spain', lat: 41.6000, lng: -4.0000, radius: 100 },
      
      // Portugal
      { name: 'Douro', country: 'Portugal', lat: 41.2000, lng: -7.5000, radius: 80 },
      { name: 'Alentejo', country: 'Portugal', lat: 38.5000, lng: -7.9000, radius: 100 },
      
      // Argentina
      { name: 'Mendoza', country: 'Argentina', lat: -32.8895, lng: -68.8458, radius: 150 },
      
      // Chile
      { name: 'Valle Central', country: 'Chile', lat: -34.0000, lng: -71.0000, radius: 200 },
      
      // Brazil
      { name: 'Vale dos Vinhedos', country: 'Brazil', lat: -29.1717, lng: -51.5200, radius: 50 },
      { name: 'Serra Gaúcha', country: 'Brazil', lat: -29.3751, lng: -50.8764, radius: 100 },
      
      // USA
      { name: 'Napa Valley', country: 'United States', lat: 38.5025, lng: -122.2654, radius: 50 },
      { name: 'Sonoma', country: 'United States', lat: 38.4404, lng: -122.7144, radius: 80 },
      
      // Australia
      { name: 'Barossa Valley', country: 'Australia', lat: -34.5000, lng: 139.0000, radius: 50 },
      
      // South Africa
      { name: 'Stellenbosch', country: 'South Africa', lat: -33.9321, lng: 18.8602, radius: 50 },
    ];

    // Check if current location is within any wine region
    for (const wineRegion of wineRegions) {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        wineRegion.lat, 
        wineRegion.lng
      );
      
      if (distance <= wineRegion.radius) {
        return wineRegion.name;
      }
    }

    // Check by region/country name matching
    if (region && country) {
      const regionLower = region.toLowerCase();
      const countryLower = country.toLowerCase();
      
      for (const wineRegion of wineRegions) {
        if (regionLower.includes(wineRegion.name.toLowerCase()) ||
            countryLower.includes(wineRegion.country.toLowerCase())) {
          return wineRegion.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get location context for wine recommendations
   */
  public getLocationContext(): LocationContext | null {
    return this.locationContext;
  }

  /**
   * Get cached location
   */
  public getCachedLocation(): UserLocation | null {
    return this.cachedLocation;
  }

  /**
   * Clear cached location (force refresh)
   */
  public clearCache(): void {
    this.cachedLocation = null;
    this.locationContext = null;
  }
}

export const locationService = LocationService.getInstance();