export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  createdAt: string;
  isFeatured?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
};

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type User = {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
};

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
};