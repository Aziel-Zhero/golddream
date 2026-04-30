
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ name: string; size: string; color: string } | null>(null);
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

      const variation = product.variacoes?.find(v => v.cor === color);
      const stockLimit = variation ? (variation.estoquePorTamanho?.[size] ?? variation.estoque) : (product.estoque || 0);

      const currentQtyInCart = existingItemIndex > -1 ? prev[existingItemIndex].quantity : 0;
      const totalRequested = currentQtyInCart + quantity;

      if (totalRequested > stockLimit) {
        success = false;
        errorMessage = `Restam apenas ${stockLimit} unidades de ${product.nome} (${size}, ${color}) no estoque.`;
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
      setLastAdded({ name: product.nome, size, color });
      setShowSuccessModal(true);
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
        const stockLimit = variation ? (variation.estoquePorTamanho?.[size] ?? variation.estoque) : (item.product.estoque || 0);
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
      
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="rounded-[2.5rem] border-2 shadow-2xl max-w-[90vw] sm:max-w-md p-8 overflow-hidden">
          <DialogHeader className="space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <DialogTitle className="text-3xl font-headline font-bold text-center">Adicionado com Sucesso!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2" asChild>
              <div>
                {lastAdded && (
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{lastAdded.name}</p>
                    <p className="text-sm text-muted-foreground uppercase font-black">
                      {lastAdded.size} | {lastAdded.color}
                    </p>
                  </div>
                )}
                <p className="mt-4 text-muted-foreground">O item já está garantido na sua sacola.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex flex-col gap-3 sm:flex-col sm:space-x-0">
            <Button 
              asChild 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform"
              onClick={() => setShowSuccessModal(false)}
            >
              <Link href="/checkout">
                FINALIZAR PEDIDO <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl text-lg font-bold border-2 hover:bg-muted"
              onClick={() => setShowSuccessModal(false)}
            >
              CONTINUAR COMPRANDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
