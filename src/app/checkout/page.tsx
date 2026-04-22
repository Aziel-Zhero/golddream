
"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, Ticket, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isOrdered, setIsOrdered] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const { data: freteRules } = useCollection(collection(firestore, 'fretes'));

  // Calcula frete baseado no endereço do usuário
  useEffect(() => {
    if (user?.endereco && freteRules) {
      const rule = freteRules.find(r => 
        r.cidade.toLowerCase() === user.endereco?.cidade.toLowerCase() &&
        r.bairro.toLowerCase() === user.endereco?.bairro.toLowerCase()
      );
      if (rule) setShippingCost(rule.valor);
      else setShippingCost(25); // Valor padrão se não houver regra
    }
  }, [user, freteRules]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    const q = query(collection(firestore, 'cupons'), where('codigo', '==', couponCode.toUpperCase()));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const couponData = snap.docs[0].data();
      setDiscount(couponData.desconto);
      toast({ title: "Cupom Aplicado!", description: `${couponData.desconto}% de desconto.` });
    } else {
      toast({ variant: "destructive", title: "Cupom Inválido" });
    }
    setIsApplying(false);
  };

  const finalTotal = (totalPrice * (1 - discount/100)) + shippingCost;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setIsOrdered(true);
      clearCart();
    }, 1500);
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-headline font-bold">Obrigado pela Compra!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Seu pedido foi realizado com sucesso. Enviaremos as atualizações para o seu email e SMS.</p>
        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg"><Link href="/">Voltar à Loja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-headline font-bold mb-12">Finalizar Compra</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-10">
            <section className="space-y-6">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" /> Endereço de Entrega
              </h2>
              {user ? (
                <div className="p-6 bg-muted/50 rounded-2xl border">
                  <p className="font-bold">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.endereco?.rua}, {user.endereco?.bairro}</p>
                  <p className="text-sm text-muted-foreground">{user.endereco?.cidade} - {user.endereco?.cep}</p>
                  <p className="text-sm text-primary mt-2 font-medium">{user.telefone}</p>
                </div>
              ) : (
                <Button asChild variant="outline" className="w-full h-16 rounded-xl border-dashed">
                  <Link href="/auth/register">Cadastre-se para calcular o frete</Link>
                </Button>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" /> Pagamento
              </h2>
              <div className="border rounded-2xl p-8 bg-muted/30">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input placeholder="0000 0000 0000 0000" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Validade</Label><Input placeholder="MM/AA" required /></div>
                    <div className="space-y-2"><Label>CVV</Label><Input placeholder="123" required /></div>
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-muted/20">
            <CardHeader><CardTitle className="font-headline font-bold">Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}`} className="flex justify-between text-sm">
                    <p className="text-muted-foreground">{item.product.nome} x {item.quantity}</p>
                    <p className="font-medium">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="CUPOM" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon} disabled={isApplying}>
                    {isApplying ? <Loader2 className="animate-spin w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">Subtotal</p><p>R$ {totalPrice.toFixed(2)}</p></div>
                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><p>Desconto ({discount}%)</p><p>- R$ {(totalPrice * discount/100).toFixed(2)}</p></div>}
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">Frete</p><p>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}</p></div>
              </div>
              <Separator />
              <div className="flex justify-between text-2xl font-bold"><p>Total</p><p>R$ {finalTotal.toFixed(2)}</p></div>
              <Button form="checkout-form" size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20">Confirmar Compra</Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" /> Criptografia 256-bit SSL
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
