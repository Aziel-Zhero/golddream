
"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, CheckCircle2, Loader2, MessageCircle, LogIn, Send, Zap, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { TelegramConfig, FreteRule, Cupom, Promocao, SiteConfig } from '@/types';

const DEFAULT_TEMPLATE = `🛍️ *NOVO PEDIDO - GOLD DREAM*

🧾 *Código:* #{{codigo}}

📦 *Itens:*
{{itens}}

👤 *Cliente:* {{clienteNome}}
📍 *Endereço:* {{clienteEndereco}}
📞 *Contato:* https://wa.me/{{telefone}}

💳 *Cupom:* {{cupom}}

💰 *TOTAL: R$ {{total}}*`;

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isOrdered, setIsOrdered] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [manualDiscountPercent, setManualDiscountPercent] = useState(0);
  const [autoDiscountPercent, setAutoDiscountPercent] = useState(0);
  const [activePromo, setActivePromo] = useState<Promocao | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const fretesQuery = useMemoFirebase(() => collection(firestore, 'fretes'), [firestore]);
  const { data: freteRules } = useCollection<FreteRule>(fretesQuery);

  const tgRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'telegram'), [firestore]);
  const { data: tgConfig } = useDoc<TelegramConfig>(tgRef);

  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: siteSettings } = useDoc<SiteConfig>(configRef);

  const promosQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'promocoes'), where('ativo', '==', true));
  }, [firestore]);
  const { data: allPromos } = useCollection<Promocao>(promosQuery);

  // Identifica campanha auto-aplicável
  useEffect(() => {
    if (allPromos) {
      const now = new Date();
      const bestPromo = allPromos
        .filter(p => {
          const start = new Date(p.dataInicio);
          const end = new Date(p.dataFim);
          return now >= start && now <= end;
        })
        .sort((a, b) => b.valorDesconto - a.valorDesconto)[0];

      if (bestPromo) {
        setAutoDiscountPercent(bestPromo.valorDesconto);
        setActivePromo(bestPromo);
      } else {
        setAutoDiscountPercent(0);
        setActivePromo(null);
      }
    }
  }, [allPromos]);

  // Calcula o frete
  useEffect(() => {
    if (freteRules) {
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

      const globalRule = freteRules.find(r => r.ativo && r.isGlobal);
      if (globalRule) {
        setShippingCost(globalRule.valor);
        return;
      }

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
        if (couponData.expira && couponData.dataExpiracao) {
          const expirationDate = new Date(couponData.dataExpiracao);
          const today = new Date();
          today.setHours(0,0,0,0);
          if (expirationDate < today) {
            toast({ variant: "destructive", title: "Cupom Expirado" });
            setIsApplying(false);
            return;
          }
        }
        setManualDiscountPercent(couponData.desconto);
        toast({ title: "Cupom Aplicado!" });
      } else {
        toast({ variant: "destructive", title: "Cupom Inválido" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao validar" });
    } finally {
      setIsApplying(false);
    }
  };

  const finalDiscountPercent = Math.max(manualDiscountPercent, autoDiscountPercent);
  const discountValue = totalPrice * (finalDiscountPercent / 100);
  const finalTotal = (totalPrice - discountValue) + shippingCost;

  const generateOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    let prefix = 'PED';
    if (activePromo) {
      prefix = activePromo.isBlackFriday ? 'BKF' : 'CAMP';
    }
    
    return `${prefix}-${year}-${month}-${random}`;
  };

  const formatMessage = (template: string, order: any) => {
    let itemsText = "";
    order.itens.forEach((i: any, index: number) => {
      itemsText += `${index + 1}️⃣ *${i.nome}*\nTamanho: ${i.tamanho}\nCor: ${i.cor}\nValor: R$ ${i.valor.toFixed(2)} (x${i.quantidade})\n\n`;
    });

    // Clean phone for link, ensure it has international format if needed
    const cleanPhone = order.clienteTelefone.replace(/\D/g, '');
    const phoneForLink = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

    return template
      .replace('{{codigo}}', order.codigo)
      .replace('{{itens}}', itemsText.trim())
      .replace('{{clienteNome}}', order.clienteNome)
      .replace('{{clienteEndereco}}', order.clienteEndereco)
      .replace('{{telefone}}', phoneForLink)
      .replace('{{cupom}}', order.cupomText || 'Não')
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
      console.error("Erro ao enviar para Telegram:", e);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    
    const orderId = generateOrderId();
    const couponText = manualDiscountPercent > 0 ? couponCode : (activePromo ? activePromo.nome : "Não");

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
      dataCriacao: new Date().toISOString(),
      cupomText: couponText
    };

    try {
      addDocumentNonBlocking(collection(firestore, 'pedidos'), pedidoData);
      await notifyTelegram(pedidoData);
      
      setTimeout(() => {
        setIsOrdered(true);
        clearCart();
        setIsProcessing(false);
      }, 800);
      
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao processar", description: "Tente novamente." });
      setIsProcessing(false);
    }
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto shadow-inner">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-headline font-bold">Pedido Confirmado!</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">Sua reserva foi processada com sucesso. Você pode acompanhar o status na sua conta.</p>
        <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6">
          <Button asChild size="lg" className="rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/20">
            <Link href="/account/orders"><ShoppingBag className="w-5 h-5 mr-2" /> Meus Pedidos</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 border-2">
            <Link href="/">Continuar Comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <Card className="border-2 shadow-2xl rounded-3xl overflow-hidden border-primary/10">
          <CardHeader className="bg-primary/5 pb-8 pt-12">
            <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Falta pouco!</CardTitle>
            <CardDescription className="text-lg">Você precisa estar logado para enviarmos seu pedido.</CardDescription>
          </CardHeader>
          <CardContent className="p-12 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="bg-primary/10 p-3 rounded-2xl"><Zap className="w-8 h-8 text-primary" /></div>
        <h1 className="text-4xl font-headline font-bold">Finalizar Pedido</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {activePromo && (
            <div className={`p-6 rounded-3xl border-2 flex items-center justify-between gap-4 ${activePromo.isBlackFriday ? 'bg-black border-yellow-500 text-white shadow-xl shadow-yellow-500/10' : 'bg-primary/5 border-primary/20'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activePromo.isBlackFriday ? 'bg-yellow-500 text-black' : 'bg-primary text-white'}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-lg uppercase tracking-tight">Campanha: {activePromo.nome}</p>
                  <p className="text-sm opacity-80">Desconto de {activePromo.valorDesconto}% aplicado automaticamente.</p>
                </div>
              </div>
              <Badge className={activePromo.isBlackFriday ? 'bg-yellow-500 text-black border-none font-black' : ''}>ATIVO</Badge>
            </div>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" /> Destinatário</h2>
            <div className="p-8 bg-card rounded-3xl border-2 shadow-sm relative overflow-hidden">
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
        </div>

        <div className="space-y-8">
          <Card className="border-2 shadow-xl rounded-3xl overflow-hidden border-primary/5">
            <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-xl">Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between items-center gap-4 group">
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
                {finalDiscountPercent > 0 && <div className="flex justify-between text-green-600"><p>Desconto total ({finalDiscountPercent}%)</p><p className="font-bold">- R$ {discountValue.toFixed(2)}</p></div>}
                <div className="flex justify-between"><p className="text-muted-foreground">Taxa de Entrega</p><p className="font-bold">R$ {shippingCost.toFixed(2)}</p></div>
              </div>
              
              <Separator className="h-[2px] bg-primary/5" />
              
              <div className="flex justify-between items-end py-2">
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total à Pagar</p>
                   <p className="text-3xl font-black text-primary leading-none">R$ {finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder} 
                disabled={isProcessing || items.length === 0} 
                className="w-full h-16 text-xl font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-3 w-7 h-7" />} CONFIRMAR PEDIDO
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
                Ao confirmar, seu pedido será enviado para análise.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

