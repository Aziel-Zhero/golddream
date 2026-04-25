
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Search, Menu, X, LogIn, ChevronDown, LayoutDashboard, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SiteConfig } from '@/types';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BearIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="7" r="2.5" />
    <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
    <circle cx="9" cy="11.5" r="1" fill="currentColor" />
    <circle cx="15" cy="11.5" r="1" fill="currentColor" />
    <path d="M10 17c.5.5 1.5.5 2 0" />
    <path d="M11 14.5c.3.3.7.5 1 .5s.7-.2 1-.5" />
  </svg>
);

export function Navbar() {
  const { totalItems, items, totalPrice, removeItem, updateQuantity } = useCart();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const firestore = useFirestore();

  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const isAdmin = user?.papel === 'administrador' || user?.papel === 'admin';

  return (
    <nav className="sticky top-0 z-50 glass-morphism border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 group h-full flex-shrink-0">
            {config?.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt="Logo Gold Dream" 
                className="h-7 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="font-headline text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent transition-all group-hover:scale-105 whitespace-nowrap">
                Gold Dream
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/category/feminino" className="text-sm font-semibold hover:text-primary transition-colors">Feminino</Link>
            <Link href="/category/masculino" className="text-sm font-semibold hover:text-primary transition-colors">Masculino</Link>
            <Link href="/category/acessorios" className="text-sm font-semibold hover:text-primary transition-colors">Acessórios</Link>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:text-primary hidden sm:flex"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full px-1 md:px-3 h-10 hover:bg-muted transition-colors outline-none group/user">
                    <div className="w-8 h-8 rounded-full border bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors group-hover/user:bg-primary/20">
                      <BearIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold hidden lg:inline max-w-[80px] truncate">{user.nome.split(' ')[0]}</span>
                    <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl border-2 shadow-xl p-2">
                  <DropdownMenuLabel className="font-normal px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user.nome}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      <Badge variant="secondary" className="w-fit text-[10px] mt-2 capitalize font-bold bg-primary/10 text-primary border-none">
                        {isAdmin ? 'Perfil Admin' : 'Cliente Gold'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/account/orders">
                      <Package className="w-4 h-4 mr-2" /> Meus Pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/auth/complete-profile">
                      <User className="w-4 h-4 mr-2" /> Meus Dados
                    </Link>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-primary font-bold focus:bg-primary/5 focus:text-primary">
                      <Link href="/admin">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Painel Administrativo
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="rounded-lg cursor-pointer text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild className="text-foreground hover:text-primary transition-colors">
                <Link href="/auth/login"><User className="w-5 h-5" /></Link>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in" variant="default">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col rounded-l-3xl">
                <SheetHeader>
                  <SheetTitle className="font-headline flex items-center gap-2 text-2xl">
                    Sua Sacola ({totalItems})
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-grow overflow-y-auto py-6 px-1">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center px-4">
                      <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                      <p className="font-medium">Sua sacola está vazia</p>
                      <SheetClose asChild>
                        <Button variant="link" asChild className="text-primary font-bold">
                          <Link href="/">Começar a Comprar</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm">
                            <img
                              src={item.product.imagens?.[0] || 'https://placehold.co/100'}
                              alt={item.product.nome}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between text-base font-bold">
                              <h3 className="truncate max-w-[150px]">{item.product.nome}</h3>
                              <p className="ml-4 text-primary">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground uppercase font-bold">{item.selectedSize} | {item.selectedColor}</p>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <div className="flex items-center border rounded-lg bg-background">
                                <button 
                                  className="px-2 py-1 hover:text-primary transition-colors"
                                  onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                >-</button>
                                <span className="px-3 font-bold">{item.quantity}</span>
                                <button 
                                  className="px-2 py-1 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  disabled={item.quantity >= item.product.estoque}
                                  onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                >+</button>
                              </div>
                              <button
                                type="button"
                                className="text-xs font-bold text-destructive hover:underline"
                                onClick={() => removeItem(item.productId, item.selectedSize, item.selectedColor)}
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border-t pt-6 bg-background space-y-4">
                    <div className="flex justify-between text-xl font-bold">
                      <p>Subtotal</p>
                      <p>R$ {totalPrice.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Frete e descontos calculados na finalização.</p>
                    <SheetClose asChild>
                      <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" size="lg" asChild>
                        <Link href="/checkout">Finalizar Pedido</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="rounded-r-3xl">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-headline font-bold">Menu Gold Dream</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-12 px-2">
                  <SheetClose asChild><Link href="/account/orders" className="text-xl font-bold hover:text-primary transition-colors">Meus Pedidos</Link></SheetClose>
                  <SheetClose asChild><Link href="/category/feminino" className="text-xl font-bold hover:text-primary transition-colors">Moda Feminina</Link></SheetClose>
                  <SheetClose asChild><Link href="/category/masculino" className="text-xl font-bold hover:text-primary transition-colors">Moda Masculina</Link></SheetClose>
                  <SheetClose asChild><Link href="/category/acessorios" className="text-xl font-bold hover:text-primary transition-colors">Acessórios</Link></SheetClose>
                  <div className="pt-8 border-t mt-4 space-y-4">
                    {user ? (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Minha Conta</p>
                        <SheetClose asChild><Link href="/auth/complete-profile" className="block text-lg font-bold">Meus Dados</Link></SheetClose>
                        {isAdmin && (
                          <SheetClose asChild><Link href="/admin" className="block text-lg font-bold text-primary">Painel Admin</Link></SheetClose>
                        )}
                        <SheetClose asChild><button onClick={logout} className="text-destructive font-black text-lg text-left">Sair da Conta</button></SheetClose>
                      </div>
                    ) : (
                      <SheetClose asChild><Link href="/auth/login" className="flex items-center gap-2 font-bold"><LogIn size={20} /> Entrar</Link></SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isSearchOpen && (
          <div className="py-4 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-12 h-12 w-full rounded-2xl border-2 focus-visible:ring-primary/20" 
                placeholder="O que você está procurando hoje?" 
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
