
"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, CheckCircle2, Loader2, LogIn, Zap, ShoppingBag, Send, MessageSquare, ArrowRight, PackageCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { TelegramConfig, FreteRule, Cupom, Promocao, Pedido } from '@/types';

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
  const [lastPhoneUsed, setLastPhoneUsed] = useState('');

  const fretesQuery = useMemoFirebase(() => collection(firestore, 'fretes'), [firestore]);
  const { data: freteRules } = useCollection<FreteRule>(fretesQuery);

  const tgRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'telegram'), [firestore]);
  const { data: tgConfig } = useDoc<TelegramConfig>(tgRef);

  const promosQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'promocoes'), where('ativo', '==', true));
  }, [firestore]);
  const { data: allPromos } = useCollection<Promocao>(promosQuery);

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

  useEffect(() => {
    if (freteRules && user?.endereco) {
      const specificRule = freteRules.find(r => 
        r.ativo &&
        r.cidade?.toLowerCase() === user.endereco?.cidade?.toLowerCase() &&
        r.bairro?.toLowerCase() === user.endereco?.bairro?.toLowerCase()
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
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let prefix = 'PED';
    if (activePromo) {
      prefix = activePromo.isBlackFriday ? 'BKF' : 'CAMP';
    }
    return `${prefix}-${year}${month}-${random}`;
  };

  const formatTelegramMessage = (order: any) => {
    let itemsText = "";
    order.itens.forEach((i: any, index: number) => {
      itemsText += `${index + 1}️⃣ *${i.nome}*\nTamanho: ${i.tamanho}\nCor: ${i.cor}\nQtd: ${i.quantidade}\nValor: R$ ${i.valor.toFixed(2)}\n\n`;
    });

    const template = (tgConfig?.messageTemplate || `🛍️ *NOVO PEDIDO - GOLD DREAM*

🧾 *Código:* #{{codigo}}

📦 *Itens:*
{{itens}}

👤 *Cliente:* {{clienteNome}}
📍 *Endereço:* {{clienteEndereco}}

💰 *TOTAL: R$ {{total}}*`)
      .replace('{{codigo}}', order.codigo)
      .replace('{{itens}}', itemsText.trim())
      .replace('{{clienteNome}}', order.clienteNome)
      .replace('{{clienteEndereco}}', order.clienteEndereco)
      .replace('{{telefone}}', order.clienteTelefone)
      .replace('{{cupom}}', order.cupomText || 'Não')
      .replace('{{total}}', order.total.toFixed(2));

    return template;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    setLastPhoneUsed(user.telefone || '');
    
    const orderId = generateOrderId();
    const couponUsed = manualDiscountPercent > 0 ? couponCode : (activePromo ? activePromo.nome : "");

    const pedidoData = {
      codigo: orderId,
      usuarioId: user.uid,
      clienteNome: user.nome || 'Cliente',
      clienteTelefone: user.telefone || '',
      clienteEndereco: user.endereco ? `${user.endereco.rua}, ${user.endereco.numero} - ${user.endereco.bairro}, ${user.endereco.cidade}` : 'Não informado',
      itens: items.map(i => {
        // Se a cor for um código HEX, tentamos manter o formato amigável se possível
        const colorName = i.selectedColor;
        return {
          nome: i.product.nome,
          tamanho: i.selectedSize,
          cor: colorName,
          valor: i.product.preco,
          quantidade: i.quantity
        };
      }),
      subtotal: totalPrice,
      frete: shippingCost,
      desconto: discountValue,
      total: finalTotal,
      status: 'pendente' as const,
      dataCriacao: new Date().toISOString(),
      cupomText: couponUsed || 'Não'
    };

    try {
      addDocumentNonBlocking(collection(firestore, 'pedidos'), pedidoData);
      
      if (tgConfig?.isActive && tgConfig.botToken && tgConfig.chatId) {
        const message = formatTelegramMessage(pedidoData);
        
        const cleanPhone = pedidoData.clienteTelefone.replace(/\D/g, '');
        const phoneForLink = cleanPhone.length >= 10 ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : cleanPhone;

        const waMessage = `Olá *${pedidoData.clienteNome}* 👋

Aqui é da *Gold Dream - Multimarcas*.

Seu pedido já está sendo preparado 🛍️

Poderia confirmar se este endereço está correto?

📍 ${pedidoData.clienteEndereco}

E nos informar a forma de pagamento? 💳`;

        const waUrl = `https://wa.me/${phoneForLink}?text=${encodeURIComponent(waMessage)}`;
        const confirmUrl = `${window.location.origin}/admin/orders/${orderId}/confirm`;

        const replyMarkup = JSON.stringify({
          inline_keyboard: [
            [{ text: "✅ Pegar Pedido", url: confirmUrl }],
            [{ text: "🚀 Chamar no WhatsApp", url: waUrl }]
          ]
        });

        const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(replyMarkup)}`;
        
        fetch(url).catch(err => console.error("Erro Telegram API:", err));
      }
      
      setTimeout(() => {
        setIsOrdered(true);
        clearCart();
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao processar", description: "Verifique sua conexão." });
      setIsProcessing(false);
    }
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto shadow-inner">
          <PackageCheck className="w-16 h-16" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-headline font-bold">Pedido Recebido!</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            Aguarde, vamos entrar em contato no seu whatsapp no telefone <span className="text-primary font-bold">{lastPhoneUsed}</span>.
          </p>
        </div>
        <div className="flex flex-col gap-4 max-w-xs mx-auto pt-8">
          <Button asChild className="h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
            <Link href="/account/orders">Acompanhar Meus Pedidos <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
          <Button asChild variant="ghost" className="h-12 font-bold">
            <Link href="/">Voltar para a Loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <Card className="border-2 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 pb-8 pt-12">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Acesse sua Conta</CardTitle>
            <CardDescription className="text-lg">Você precisa estar logado para finalizar o pedido.</CardDescription>
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
                  <p className="text-sm opacity-80">-{activePromo.valorDesconto}% OFF aplicado.</p>
                </div>
              </div>
              <Badge className={activePromo.isBlackFriday ? 'bg-yellow-500 text-black border-none font-black' : ''}>ATIVO</Badge>
            </div>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Resumo de Entrega</h2>
            <div className="p-8 bg-card rounded-3xl border-2 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <Button asChild variant="ghost" size="sm" className="text-primary font-bold"><Link href="/auth/complete-profile">Editar Endereço</Link></Button>
               </div>
              <div className="flex flex-col gap-1 mb-6">
                <p className="font-black text-2xl text-primary">{user.nome || 'Nome incompleto'}</p>
                <p className="text-muted-foreground font-mono text-sm">{user.telefone || 'Telefone incompleto'}</p>
              </div>
              <Separator />
              <div className="mt-6 space-y-1 text-base">
                {user.endereco?.cidade ? (
                  <>
                    <p className="font-bold">{user.endereco.rua}, {user.endereco.numero}</p>
                    <p className="text-muted-foreground">{user.endereco.bairro} — {user.endereco.cidade}</p>
                    <p className="text-xs font-mono uppercase tracking-widest bg-muted w-fit px-2 py-1 rounded mt-2">CEP: {user.endereco.cep}</p>
                  </>
                ) : (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">
                    Atenção: Seu endereço está incompleto! Clique em editar para atualizar.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="border-2 shadow-xl rounded-3xl overflow-hidden border-primary/5">
            <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-xl">Itens e Valores</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm truncate">{item.product.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{item.selectedSize} | {item.selectedColor} (x{item.quantity})</p>
                    </div>
                    <p className="font-black text-sm">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 border-t space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tem um cupom?</Label>
                <div className="flex gap-2">
                  <Input placeholder="CÓDIGO" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="h-12 rounded-xl font-black" />
                  <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplying} className="h-12 px-6 rounded-xl font-bold">OK</Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-sm">
                <div className="flex justify-between"><p className="text-muted-foreground">Subtotal</p><p className="font-bold">R$ {totalPrice.toFixed(2)}</p></div>
                {finalDiscountPercent > 0 && <div className="flex justify-between text-green-600"><p>Desconto ({finalDiscountPercent}%)</p><p className="font-bold">- R$ {discountValue.toFixed(2)}</p></div>}
                <div className="flex justify-between"><p className="text-muted-foreground">Taxa de Frete</p><p className="font-bold">R$ {shippingCost.toFixed(2)}</p></div>
              </div>
              
              <Separator className="h-[2px] bg-primary/5" />
              
              <div className="py-2">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total a Pagar</p>
                 <p className="text-3xl font-black text-primary leading-none">R$ {finalTotal.toFixed(2)}</p>
              </div>

              <Button 
                onClick={handlePlaceOrder} 
                disabled={isProcessing || items.length === 0 || !user.endereco?.cidade} 
                className="w-full h-16 text-xl font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-3 w-7 h-7" />} CONFIRMAR PEDIDO
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
