
"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, ShieldCheck, CheckCircle2, Ticket, Loader2, MessageCircle, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isOrdered, setIsOrdered] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fretesQuery = useMemoFirebase(() => collection(firestore, 'fretes'), [firestore]);
  const { data: freteRules } = useCollection(fretesQuery);

  useEffect(() => {
    if (user?.endereco && freteRules) {
      const rule = freteRules.find(r => 
        r.cidade.toLowerCase() === user.endereco?.cidade.toLowerCase() &&
        r.bairro.toLowerCase() === user.endereco?.bairro.toLowerCase()
      );
      if (rule) setShippingCost(rule.valor);
      else setShippingCost(25); // Valor padrão
    }
  }, [user, freteRules]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    const q = query(collection(firestore, 'cupons'), where('codigo', '==', couponCode.toUpperCase()));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const couponData = snap.docs[0].data();
      setDiscountPercent(couponData.desconto);
      toast({ title: "Cupom Aplicado!", description: `${couponData.desconto}% de desconto.` });
    } else {
      toast({ variant: "destructive", title: "Cupom Inválido" });
    }
    setIsApplying(false);
  };

  const discountValue = totalPrice * (discountPercent / 100);
  const finalTotal = (totalPrice - discountValue) + shippingCost;

  const generateOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `PED-${year}-${month}-${random}`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Acesso Negado", description: "Você precisa estar logado para finalizar o pedido." });
      return;
    }

    setIsProcessing(true);
    const orderId = generateOrderId();

    const pedidoData = {
      codigo: orderId,
      usuarioId: user.uid,
      clienteNome: user.nome,
      clienteTelefone: user.telefone || '',
      clienteEndereco: `${user.endereco?.rua}, ${user.endereco?.numero} - ${user.endereco?.bairro}, ${user.endereco?.cidade} - ${user.endereco?.cep}`,
      itens: items.map(i => ({
        nome: i.product.nome,
        tamanho: i.selectedSize,
        cor: i.selectedColor,
        valor: i.product.preco,
        quantidade: i.quantity
      })),
      subtotal: totalPrice,
      frete: shippingCost,
      desconto: discountValue,
      total: finalTotal,
      status: 'pendente',
      dataCriacao: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(firestore, 'pedidos'), pedidoData);

    const whatsappNumber = "5512991862651";
    let message = `🛍️ *NOVO PEDIDO*\n\n`;
    message += `🧾 *Código do Pedido:* #${orderId}\n\n`;
    message += `📦 *Produtos*\n\n`;
    
    pedidoData.itens.forEach((item, idx) => {
      message += `${idx + 1}️⃣ ${item.nome}\n`;
      message += `Tamanho: ${item.tamanho}\n`;
      message += `Cor: ${item.cor}\n`;
      message += `Valor: R$ ${item.valor.toFixed(2)}\n\n`;
    });

    message += `👤 *Cliente:* ${user.nome}\n\n`;
    message += `📍 *Endereço de Entrega:*\n`;
    message += `${user.endereco?.rua}, ${user.endereco?.numero}\n`;
    message += `${user.endereco?.bairro}\n`;
    message += `${user.endereco?.cidade} - ${user.endereco?.cep}\n\n`;

    message += `💳 *Resumo*\n`;
    message += `Subtotal: R$ ${totalPrice.toFixed(2)}\n`;
    if (couponCode) message += `Cupom: ${couponCode.toUpperCase()}\n`;
    if (discountValue > 0) message += `Desconto: -R$ ${discountValue.toFixed(2)}\n`;
    message += `Frete: R$ ${shippingCost.toFixed(2)}\n\n`;

    message += `💰 *TOTAL A PAGAR:* R$ ${finalTotal.toFixed(2)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setIsOrdered(true);
      clearCart();
      setIsProcessing(false);
    }, 1000);
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-headline font-bold">Pedido Enviado!</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Seu pedido foi registrado. A conversa no WhatsApp foi aberta para combinarmos o pagamento.
        </p>
        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg">
          <Link href="/">Voltar à Gold Dream</Link>
        </Button>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de login obrigatório
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <Card className="border-2 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 pb-8 pt-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <LogIn className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Quase lá!</CardTitle>
            <CardDescription className="text-lg">Para finalizar seu pedido na Gold Dream Multimarcas, você precisa acessar sua conta ou se cadastrar.</CardDescription>
          </CardHeader>
          <CardContent className="p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild size="lg" className="h-16 rounded-2xl text-lg font-bold">
                <Link href="/auth/login"><LogIn className="mr-2 w-5 h-5" /> Entrar na Conta</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl text-lg font-bold border-2">
                <Link href="/auth/register"><UserPlus className="mr-2 w-5 h-5" /> Criar Conta</Link>
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> Seus dados estão 100% protegidos pela Gold Dream.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-headline font-bold">Finalizar no WhatsApp</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" /> Confirmar Entrega
            </h2>
            <div className="p-8 bg-muted/50 rounded-3xl border-2 border-primary/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-xl">{user.nome}</p>
                  <p className="text-muted-foreground">{user.telefone}</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-primary font-bold">
                  <Link href="/auth/complete-profile">Alterar Endereço</Link>
                </Button>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">{user.endereco?.rua}, {user.endereco?.numero}</p>
                <p className="text-sm text-muted-foreground">{user.endereco?.bairro}</p>
                <p className="text-sm text-muted-foreground">{user.endereco?.cidade} - {user.endereco?.cep}</p>
              </div>
            </div>
          </section>

          <section className="bg-green-50 p-8 rounded-3xl border border-green-100 space-y-4">
            <div className="flex items-center gap-3 text-green-700 font-bold">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg">Checkout Seguro Gold Dream</h3>
            </div>
            <p className="text-sm text-green-600/80 leading-relaxed">
              O pagamento (Pix ou Link de Cartão) será combinado diretamente com o nosso vendedor no WhatsApp.
            </p>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="font-headline font-bold flex items-center gap-2">
                Resumo da Sacola
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}`} className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm line-clamp-1">{item.product.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.selectedSize} | {item.selectedColor} | x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-primary">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="CUPOM" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                    className="rounded-xl h-12"
                  />
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon} disabled={isApplying} className="h-12 rounded-xl">
                    {isApplying ? <Loader2 className="animate-spin w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">Subtotal</p><p>R$ {totalPrice.toFixed(2)}</p></div>
                {discountPercent > 0 && <div className="flex justify-between text-sm text-green-600"><p>Desconto ({discountPercent}%)</p><p>- R$ {discountValue.toFixed(2)}</p></div>}
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">Frete</p><p>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}</p></div>
              </div>
              
              <Separator className="h-[2px]" />
              
              <div className="flex justify-between items-center py-2">
                <p className="text-lg font-bold">Total</p>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary leading-none">R$ {finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isProcessing || items.length === 0}
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <MessageCircle className="mr-2 w-6 h-6" />}
                Finalizar no WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
