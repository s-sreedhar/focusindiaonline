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
  subject?: string;
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
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  category?: string;
  isCombo?: boolean;
  comboBookIds?: string[];
}

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  role: 'superadmin' | 'customer';
  createdAt: any; // Timestamp
  phoneNumber: string;
  password?: string; // Hashed password
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Customer extends User {
  orders?: string[]; // Array of Order IDs
  wishlist?: string[]; // Array of Book IDs
  cart?: string[]; // Array of Book IDs (if persisting cart)
}

export interface OrderItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderId?: string; // Custom Order ID
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  shippingCharges?: number;
  discount?: number;
  appliedCoupon?: string | null;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  shippingAddress: Address & {
    fullName: string;
    phoneNumber: string;
    email?: string;
  };
  createdAt: any; // Timestamp
  updatedAt?: any; // Timestamp
  paymentId?: string;
  paymentMethod: 'cod' | 'online' | 'PHONEPE';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  adminNotes?: string;
  notesHistory?: {
    content: string;
    createdAt: string;
    adminName?: string;
  }[];
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
