export interface WineType {
  id: string;
  name: string;
  region: string;
  year: string;
  type: string;
  rating: number;
  price: string;
  imageUrl: string;
  description?: string;
  grapes?: string;
  pairings?: string[];
  characteristics?: string[];
  aromas?: string[];
  weather?: string;
  location?: string;
  moment?: string;
  style?: string;
  servingTemp?: string;
  preservation?: string;
  occasions?: string[];
}

export interface WineFilter {
  [key: string]: string[] | undefined;
  type?: string[];
  region?: string[];
  grape?: string[];
  occasion?: string[];
  characteristic?: string[];
  priceRange?: string[];
}