"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Search, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';

export function Navbar() {
  const { totalItems, items, totalPrice, removeItem, updateQuantity } = useCart();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-morphism border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-headline text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              VogueCraft
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/category/women" className="text-sm font-medium hover:text-primary transition-colors">Women</Link>
            <Link href="/category/men" className="text-sm font-medium hover:text-primary transition-colors">Men</Link>
            <Link href="/category/accessories" className="text-sm font-medium hover:text-primary transition-colors">Accessories</Link>
          </div>

          {/* Icons & Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:text-primary"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            <Link href="/ai-recommender">
              <Button variant="ghost" size="icon" className="text-foreground hover:text-accent group">
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              </Button>
            </Link>

            <Link href={user ? "/account" : "/auth/login"}>
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            {/* Cart Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary">
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]" variant="default">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-headline flex items-center gap-2">
                    Shopping Bag ({totalItems})
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-grow overflow-y-auto py-6">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                      <p>Your bag is empty</p>
                      <SheetClose asChild>
                        <Button variant="link" asChild>
                          <Link href="/">Browse Collections</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                          <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between text-base font-medium">
                              <h3>{item.product.name}</h3>
                              <p className="ml-4">${(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{item.selectedSize} / {item.selectedColor}</p>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <div className="flex items-center border rounded-md">
                                <button 
                                  className="px-2 py-1 hover:bg-muted"
                                  onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                >-</button>
                                <span className="px-3">{item.quantity}</span>
                                <button 
                                  className="px-2 py-1 hover:bg-muted"
                                  onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                >+</button>
                              </div>
                              <button
                                type="button"
                                className="font-medium text-primary hover:text-primary/80"
                                onClick={() => removeItem(item.productId, item.selectedSize, item.selectedColor)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border-t pt-6">
                    <div className="flex justify-between text-base font-medium mb-4">
                      <p>Subtotal</p>
                      <p>${totalPrice.toFixed(2)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground mb-6">Shipping and taxes calculated at checkout.</p>
                    <SheetClose asChild>
                      <Button className="w-full" size="lg" asChild>
                        <Link href="/checkout">Checkout</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Dynamic Search Bar */}
        {isSearchOpen && (
          <div className="py-4 animate-in slide-in-from-top duration-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 w-full rounded-full" 
                placeholder="Search for styles, categories, products..." 
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}