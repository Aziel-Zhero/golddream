import { PRODUCTS, CATEGORIES } from '@/lib/placeholder-data';
import { Product, Category } from '@/types';

export const productService = {
  async getFeaturedProducts(): Promise<Product[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return PRODUCTS.filter(p => p.isFeatured);
  },

  async getAllProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return PRODUCTS;
  },

  async getProductById(id: string): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return PRODUCTS.find(p => p.id === id) || null;
  },

  async getProductsByCategory(slug: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return PRODUCTS.filter(p => p.category.toLowerCase() === slug.toLowerCase());
  },

  async getCategories(): Promise<Category[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return CATEGORIES;
  },

  async searchProducts(query: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const lowerQuery = query.toLowerCase();
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery)
    );
  }
};