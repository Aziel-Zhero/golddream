
export type ProductVariation = {
  cor: string;
  estoque: number;
  imagens: string[];
};

export type Product = {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoriaId: string;
  tamanhosDisponiveis: string[];
  variacoes: ProductVariation[];
  dataCriacao: string;
  isFeatured?: boolean;
  isNovidade?: boolean;
  isLancamento?: boolean;
  isUltimasPecas?: boolean;
  estoque: number; // Total acumulado para exibição rápida
};

export type User = {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  emailVerificado?: boolean;
  endereco?: {
    rua: string;
    bairro: string;
    cidade: string;
    cep: string;
    numero: string;
  };
  papel: 'cliente' | 'administrador' | 'admin';
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
  itens: {
    nome: string;
    tamanho: string;
    cor: string;
    valor: number;
    quantidade: number;
  }[];
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  status: 'pendente' | 'confirmado' | 'em_separacao' | 'entregue' | 'cancelado';
  dataCriacao: string;
  cupomText?: string;
};

export type TelegramConfig = {
  botToken?: string;
  chatId?: string;
  testChatId?: string;
  messageTemplate?: string;
  isActive?: boolean;
};

export type SiteConfig = {
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappIconUrl?: string;
  whatsappNumber?: string;
  telegramLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  twitterLink?: string;
  exchangeDays?: number;
  step1_title?: string; step1_desc?: string;
  step2_title?: string; step2_desc?: string;
  step3_title?: string; step3_desc?: string;
  step4_title?: string; step4_desc?: string;
  b1_title?: string; b1_sub?: string; b1_icon?: string; b1_active?: boolean;
  b2_title?: string; b2_sub?: string; b2_icon?: string; b2_active?: boolean;
  b3_title?: string; b3_sub?: string; b3_icon?: string; b3_active?: boolean;
  b4_title?: string; b4_sub?: string; b4_icon?: string; b4_active?: boolean;
};

export type FreteRule = {
  id: string;
  cidade: string;
  bairro: string;
  valor: number;
  ativo: boolean;
  isGlobal?: boolean;
};

export type Cupom = {
  id: string;
  codigo: string;
  desconto: number;
  tipo: 'porcentagem' | 'fixo';
  expira: boolean;
  dataExpiracao?: string;
};

export type Promocao = {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  valorDesconto: number;
  tipo: 'porcentagem' | 'fixo';
  ativo: boolean;
  isBlackFriday: boolean;
  dataCriacao: string;
};

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type SuporteContent = {
  id: string;
  titulo: string;
  conteudo: string;
  slug: string;
};
