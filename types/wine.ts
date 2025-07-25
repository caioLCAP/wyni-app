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