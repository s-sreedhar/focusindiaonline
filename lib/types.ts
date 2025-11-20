export interface Book {
  id: string;
  title: string;
  slug: string;
  author: string;
  publisher: string;
  description: string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  inStock: boolean;
  stockQuantity: number;
  image: string;
  images?: string[];
  primaryCategory: string;
  subCategories: string[];
  subjects: string[];
  language: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  pageCount?: number;
  edition?: string;
  isbn?: string;
}

export interface FilterOptions {
  categories: string[];
  subCategories: string[];
  subjects: string[];
  priceRange: [number, number];
  language: string[];
  inStock?: boolean;
  rating?: number;
}
