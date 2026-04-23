
"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, ShieldCheck, CheckCircle2, Ticket, Loader2, MessageCircle, LogIn, UserPlus, ArrowRight, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { TelegramConfig } from '@/types';

const DEFAULT_TEMPLATE = `🛍️ *NOVO PEDIDO - GOLD DREAM*

🧾 *Código:* #{{codigo}}

📦 *Itens:*
{{itens}}

👤 *Cliente:* {{clienteNome}}
📍 *Endereço:* {{clienteEndereco}}

💰 *TOTAL: R$ {{total}}*`;

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

  const tgRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'telegram'), [firestore]);
  const { data: tgConfig } = useDoc<TelegramConfig>(tgRef);

  useEffect(() => {
    if (user?.endereco && freteRules) {
      const rule = freteRules.find(r => 
        r.cidade.toLowerCase() === user.endereco?.cidade.toLowerCase() &&
        r.bairro.toLowerCase() === user.endereco?.bairro.toLowerCase()
      );
      if (rule) setShippingCost(rule.valor);
      else setShippingCost(25); 
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

  const formatMessage = (template: string, order: any) => {
    let itemsText = "";
    order.itens.forEach((i: any) => {
      itemsText += `• ${i.nome} (${i.tamanho}/${i.cor}) x${i.quantidade}\n`;
    });

    return template
      .replace('{{codigo}}', order.codigo)
      .replace('{{itens}}', itemsText.trim())
      .replace('{{clienteNome}}', order.clienteNome)
      .replace('{{clienteEndereco}}', order.clienteEndereco)
      .replace('{{total}}', order.total.toFixed(2));
  };

  const notifyTelegram = async (order: any) => {
    if (!tgConfig?.isActive || !tgConfig.botToken || !tgConfig.chatId) return;

    const template = tgConfig.messageTemplate || DEFAULT_TEMPLATE;
    const message = formatMessage(template, order);

    try {
      const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
      await fetch(url);
    } catch (e) {
      console.error("Telegram error", e);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      status: 'pendente' as const,
      dataCriacao: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(firestore, 'pedidos'), pedidoData);
    
    // Notifica Telegram
    notifyTelegram(pedidoData);

    // Formata WhatsApp usando o mesmo modelo
    const template = tgConfig?.messageTemplate || DEFAULT_TEMPLATE;
    const message = formatMessage(template, pedidoData);

    const whatsappNumber = "5512991862651";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setIsOrdered(true);
      clearCart();
      setIsProcessing(false);
    }, 1000);
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-headline font-bold">Pedido Enviado!</h1>
        <p className="text-muted-foreground text-lg">Sua reserva na Gold Dream foi confirmada. Confira seu WhatsApp!</p>
        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg"><Link href="/">Voltar à Loja</Link></Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <Card className="border-2 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 pb-8 pt-12">
            <LogIn className="w-16 h-16 mx-auto mb-6 text-primary" />
            <CardTitle className="text-3xl font-headline font-bold">Quase lá!</CardTitle>
            <CardDescription className="text-lg">Faça login ou cadastre-se para finalizar seu pedido.</CardDescription>
          </CardHeader>
          <CardContent className="p-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild size="lg" className="h-16 rounded-2xl text-lg font-bold"><Link href="/auth/login">Entrar</Link></Button>
            <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl text-lg font-bold border-2"><Link href="/auth/register">Criar Conta</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary/10 p-3 rounded-2xl"><MessageCircle className="w-8 h-8 text-primary" /></div>
        <h1 className="text-4xl font-headline font-bold">Finalizar no WhatsApp</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" /> Entrega</h2>
            <div className="p-8 bg-muted/50 rounded-3xl border-2 border-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div><p className="font-bold text-xl">{user.nome}</p><p className="text-muted-foreground">{user.telefone}</p></div>
                <Button asChild variant="ghost" size="sm" className="text-primary font-bold"><Link href="/auth/complete-profile">Alterar</Link></Button>
              </div>
              <Separator />
              <div className="mt-4 text-sm text-muted-foreground">
                <p>{user.endereco?.rua}, {user.endereco?.numero}</p>
                <p>{user.endereco?.bairro} - {user.endereco?.cidade}</p>
              </div>
            </div>
          </section>
          <section className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center gap-4 text-green-700">
            <ShieldCheck className="w-8 h-8" /><p className="font-medium text-sm">Seu pedido será finalizado via WhatsApp para segurança mútua e confirmação de pagamento.</p>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30"><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}`} className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm truncate">{item.product.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.selectedSize} | {item.selectedColor} | x{item.quantity}</p>
                    </div>
                    <p className="font-bold">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="CUPOM" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="h-12" />
                  <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplying} className="h-12">OK</Button>
                </div>
              </div>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between"><p className="text-muted-foreground">Subtotal</p><p>R$ {totalPrice.toFixed(2)}</p></div>
                {discountPercent > 0 && <div className="flex justify-between text-green-600"><p>Desconto ({discountPercent}%)</p><p>- R$ {discountValue.toFixed(2)}</p></div>}
                <div className="flex justify-between"><p className="text-muted-foreground">Frete</p><p>R$ {shippingCost.toFixed(2)}</p></div>
              </div>
              <Separator className="h-[2px]" />
              <div className="flex justify-between items-center py-2">
                <p className="text-lg font-bold">Total</p>
                <p className="text-3xl font-black text-primary">R$ {finalTotal.toFixed(2)}</p>
              </div>
              <Button onClick={handlePlaceOrder} disabled={isProcessing || items.length === 0} className="w-full h-16 text-xl font-bold rounded-2xl bg-green-600 hover:bg-green-700 text-white">
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <MessageCircle className="mr-2 w-6 h-6" />} Finalizar WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
