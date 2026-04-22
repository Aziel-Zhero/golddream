import { Product, Category } from '@/types';
import { PlaceHolderImages } from './placeholder-images';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Women',
    slug: 'women',
    image: PlaceHolderImages.find(img => img.id === 'category-women')?.imageUrl || '',
    description: 'Timeless elegance for the modern woman.'
  },
  {
    id: 'cat-2',
    name: 'Men',
    slug: 'men',
    image: PlaceHolderImages.find(img => img.id === 'category-men')?.imageUrl || '',
    description: 'Casual and professional styles for everyday wear.'
  },
  {
    id: 'cat-3',
    name: 'Accessories',
    slug: 'accessories',
    image: PlaceHolderImages.find(img => img.id === 'category-accessories')?.imageUrl || '',
    description: 'The perfect finishing touches.'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Classic Linen Shirt',
    price: 89.99,
    description: 'A breathable linen shirt perfect for summer evenings and casual business meetings.',
    category: 'men',
    images: [PlaceHolderImages.find(img => img.id === 'product-1')?.imageUrl || ''],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Navy', 'Sky Blue'],
    stock: 15,
    createdAt: new Date().toISOString(),
    isFeatured: true
  },
  {
    id: 'p2',
    name: 'Modern Denim Jacket',
    price: 129.50,
    description: 'Reinforced stitching and premium denim make this jacket a lifetime piece.',
    category: 'men',
    images: [PlaceHolderImages.find(img => img.id === 'product-2')?.imageUrl || ''],
    sizes: ['M', 'L', 'XL'],
    colors: ['Classic Indigo', 'Black'],
    stock: 8,
    createdAt: new Date().toISOString(),
    isFeatured: true
  },
  {
    id: 'p3',
    name: 'Floral Summer Dress',
    price: 110.00,
    description: 'Lightweight fabric with a custom hand-drawn floral print.',
    category: 'women',
    images: [PlaceHolderImages.find(img => img.id === 'product-3')?.imageUrl || ''],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Red Floral', 'Blue Floral'],
    stock: 12,
    createdAt: new Date().toISOString(),
    isFeatured: true
  },
  {
    id: 'p4',
    name: 'Tailored Cotton Trousers',
    price: 95.00,
    description: 'High-waisted trousers with a slight taper for a sophisticated look.',
    category: 'women',
    images: [PlaceHolderImages.find(img => img.id === 'product-4')?.imageUrl || ''],
    sizes: ['S', 'M', 'L'],
    colors: ['Beige', 'Black', 'Olive'],
    stock: 20,
    createdAt: new Date().toISOString(),
    isFeatured: false
  }
];