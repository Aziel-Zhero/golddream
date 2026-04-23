
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, ShieldCheck, CheckCircle2, Ticket, Loader2, MessageCircle, LogIn, UserPlus, ArrowRight, Send, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { TelegramConfig, FreteRule, Cupom } from '@/types';

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
  const { data: freteRules } = useCollection<FreteRule>(fretesQuery);

  const tgRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'telegram'), [firestore]);
  const { data: tgConfig } = useDoc<TelegramConfig>(tgRef);

  // Calcula o frete baseado no endereço do usuário e regras ativas
  useEffect(() => {
    if (freteRules) {
      // 1. Procura regra específica ativa (Cidade + Bairro)
      const specificRule = freteRules.find(r => 
        r.ativo &&
        user?.endereco &&
        r.cidade.toLowerCase() === user.endereco.cidade.toLowerCase() &&
        r.bairro.toLowerCase() === user.endereco.bairro.toLowerCase()
      );

      if (specificRule) {
        setShippingCost(specificRule.valor);
        return;
      }

      // 2. Procura regra de Frete Global ativo (Toda a Loja)
      const globalRule = freteRules.find(r => r.ativo && r.isGlobal);
      if (globalRule) {
        setShippingCost(globalRule.valor);
        return;
      }

      // 3. Valor padrão se nenhuma regra ativa for encontrada
      setShippingCost(25); 
    }
  }, [user, freteRules]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    
    try {
      const q = query(collection(firestore, 'cupons'), where('codigo', '==', couponCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const couponData = snap.docs[0].data() as Cupom;
        
        // Verifica se o cupom expirou
        if (couponData.expira && couponData.dataExpiracao) {
          const expirationDate = new Date(couponData.dataExpiracao);
          const today = new Date();
          today.setHours(0,0,0,0);
          
          if (expirationDate < today) {
            toast({ variant: "destructive", title: "Cupom Expirado", description: "Este código não é mais válido." });
            setIsApplying(false);
            return;
          }
        }

        setDiscountPercent(couponData.desconto);
        toast({ title: "Cupom Aplicado!", description: `${couponData.desconto}% de desconto.` });
      } else {
        toast({ variant: "destructive", title: "Cupom Inválido", description: "Verifique o código e tente novamente." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao validar cupom" });
    } finally {
      setIsApplying(false);
    }
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
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto shadow-inner">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-headline font-bold">Pedido Reservado!</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Sua escolha na Gold Dream foi registrada. Confira seu WhatsApp para finalizar os detalhes do pagamento.
        </p>
        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20"><Link href="/">Voltar à Loja</Link></Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <Card className="border-2 shadow-2xl rounded-3xl overflow-hidden border-primary/10">
          <CardHeader className="bg-primary/5 pb-8 pt-12">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Falta pouco!</CardTitle>
            <CardDescription className="text-lg">Você precisa estar logado para enviarmos seu pedido.</CardDescription>
          </CardHeader>
          <CardContent className="p-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
            <Button asChild size="lg" className="h-16 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"><Link href="/auth/login">Entrar</Link></Button>
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
        <h1 className="text-4xl font-headline font-bold">Resumo e WhatsApp</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" /> Destinatário</h2>
            <div className="p-8 bg-white rounded-3xl border-2 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <Button asChild variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5"><Link href="/auth/complete-profile">Alterar Endereço</Link></Button>
               </div>
              <div className="flex flex-col gap-1 mb-6">
                <p className="font-black text-2xl text-primary">{user.nome}</p>
                <p className="text-muted-foreground font-mono text-sm">{user.telefone}</p>
              </div>
              <Separator />
              <div className="mt-6 space-y-1 text-base">
                <p className="font-bold">{user.endereco?.rua}, {user.endereco?.numero}</p>
                <p className="text-muted-foreground">{user.endereco?.bairro} — {user.endereco?.cidade}</p>
                <p className="text-xs font-mono uppercase tracking-widest bg-muted w-fit px-2 py-1 rounded mt-2">CEP: {user.endereco?.cep}</p>
              </div>
            </div>
          </section>
          <section className="bg-green-50 p-8 rounded-3xl border-2 border-green-100 flex flex-col sm:flex-row items-center gap-6 text-green-800">
            <div className="bg-green-100 p-4 rounded-2xl"><ShieldCheck className="w-10 h-10" /></div>
            <div>
              <p className="font-bold text-lg leading-tight mb-1">Compra Protegida</p>
              <p className="text-sm opacity-90">Sua reserva será processada via WhatsApp. O pagamento é combinado diretamente com nossa equipe para sua segurança total.</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="border-2 shadow-xl rounded-3xl overflow-hidden border-primary/5">
            <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-xl">Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-8 bg-white">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}`} className="flex justify-between items-center gap-4 group">
                    <div className="flex-1">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{item.product.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">TAM: {item.selectedSize} | COR: {item.selectedColor} | QTD: {item.quantity}</p>
                    </div>
                    <p className="font-black text-sm">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 border-t space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cupom de Desconto</Label>
                <div className="flex gap-2">
                  <Input placeholder="CÓDIGO" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="h-12 rounded-xl border-2 font-black" />
                  <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplying} className="h-12 px-6 rounded-xl font-bold">VALIDAR</Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-sm font-medium">
                <div className="flex justify-between"><p className="text-muted-foreground">Subtotal</p><p className="font-bold">R$ {totalPrice.toFixed(2)}</p></div>
                {discountPercent > 0 && <div className="flex justify-between text-green-600"><p>Desconto ({discountPercent}%)</p><p className="font-bold">- R$ {discountValue.toFixed(2)}</p></div>}
                <div className="flex justify-between"><p className="text-muted-foreground">Taxa de Entrega</p><p className="font-bold">R$ {shippingCost.toFixed(2)}</p></div>
              </div>
              
              <Separator className="h-[2px] bg-primary/5" />
              
              <div className="flex justify-between items-end py-2">
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total à Pagar</p>
                   <p className="text-3xl font-black text-primary leading-none">R$ {finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} disabled={isProcessing || items.length === 0} className="w-full h-16 text-xl font-black rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-200 transition-all hover:scale-[1.02]">
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <MessageCircle className="mr-3 w-7 h-7" />} ENVIAR NO WHATSAPP
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                Finalizado por Gold Dream Multimarcas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
