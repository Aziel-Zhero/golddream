export type Product = {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoriaId: string;
  imagens: string[];
  tamanhosDisponiveis?: string[];
  coresDisponiveis?: string[];
  estoque: number;
  dataCriacao: string;
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
