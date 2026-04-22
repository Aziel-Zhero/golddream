
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

export type User = {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: {
    rua: string;
    bairro: string;
    cidade: string;
    cep: string;
    numero: string;
  };
  papel: 'cliente' | 'administrador';
  dataCriacao: string;
  avatarUrl?: string;
};

export type Pedido = {
  id: string;
  codigo: string;
  usuarioId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEndereco: string;
  itens: CartItem[];
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  status: 'pendente' | 'enviado' | 'cancelado';
  dataCriacao: string;
};

export type SiteConfig = {
  heroBadgeText?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: string;
  telegramLink?: string;
  b1_title?: string; b1_sub?: string; b1_icon?: string;
  b2_title?: string; b2_sub?: string; b2_icon?: string;
  b3_title?: string; b3_sub?: string; b3_icon?: string;
  b4_title?: string; b4_sub?: string; b4_icon?: string;
};

export type FreteRule = {
  id: string;
  cidade: string;
  bairro: string;
  valor: number;
};

export type Cupom = {
  id: string;
  codigo: string;
  desconto: number;
  expira: boolean;
  dataExpiracao?: string;
};

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};
