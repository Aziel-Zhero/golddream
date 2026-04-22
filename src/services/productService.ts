
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy, Firestore } from 'firebase/firestore';
import { Product } from '@/types';

// Removida a inicialização de nível superior para evitar erros de servidor/cliente.
// As funções agora aceitam a instância do firestore como argumento ou a obtêm internamente se garantido o lado do cliente.

export const productService = {
  async getFeaturedProducts(db: Firestore): Promise<Product[]> {
    const q = query(collection(db, 'produtos'), where('isFeatured', '==', true), orderBy('dataCriacao', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
  },

  async getAllProducts(db: Firestore): Promise<Product[]> {
    const q = query(collection(db, 'produtos'), orderBy('dataCriacao', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
  },

  async getProductById(db: Firestore, id: string): Promise<Product | null> {
    const docRef = doc(db, 'produtos', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as Product;
  },

  async getProductsByCategory(db: Firestore, slug: string): Promise<Product[]> {
    const q = query(collection(db, 'produtos'), where('categoriaId', '==', slug));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
  }
};
