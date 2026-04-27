
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem('golddream_cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('golddream_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number, size: string, color: string) => {
    let success = true;
    let errorMessage = "";
    
    setItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.productId === product.id && item.selectedSize === size && item.selectedColor === color
      );

      // Acha a variação específica de cor para checar o estoque
      const variation = product.variacoes?.find(v => v.cor === color);
      const stockLimit = variation ? variation.estoque : (product.estoque || 0);

      const currentQtyInCart = existingItemIndex > -1 ? prev[existingItemIndex].quantity : 0;
      const totalRequested = currentQtyInCart + quantity;

      if (totalRequested > stockLimit) {
        success = false;
        errorMessage = `Restam apenas ${stockLimit} unidades da cor ${color} no estoque.`;
        return prev;
      }

      if (existingItemIndex > -1) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity = totalRequested;
        return newItems;
      }

      return [...prev, { productId: product.id, product, quantity, selectedSize: size, selectedColor: color }];
    });

    if (success) {
      toast({
        title: "Sacola atualizada!",
        description: `${product.nome} (${size}, ${color}) adicionado com sucesso.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Estoque insuficiente",
        description: errorMessage,
      });
    }
  };

  const removeItem = (productId: string, size: string, color: string) => {
    setItems(prev => prev.filter(item => 
      !(item.productId === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    
    setItems(prev => prev.map(item => {
      if (item.productId === productId && item.selectedSize === size && item.selectedColor === color) {
        const variation = item.product.variacoes?.find(v => v.cor === color);
        const stockLimit = variation ? variation.estoque : (item.product.estoque || 0);
        const newQuantity = Math.min(quantity, stockLimit);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
