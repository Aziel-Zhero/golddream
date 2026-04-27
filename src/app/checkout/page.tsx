"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Truck, CheckCircle2, Loader2, LogIn, Zap, ShoppingBag, Send, MessageSquare, ArrowRight, PackageCheck, Info, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { TelegramConfig, FreteRule, Cupom, Promocao, Pedido, SiteConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isOrdered, setIsOrdered] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Cupom | null>(null);
  const [activePromo, setActivePromo] = useState<Promocao | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPhoneUsed, setLastPhoneUsed] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(true);

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

      setActivePromo(bestPromo || null);
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
        const couponData = { ...snap.docs[0].data(), id: snap.docs[0].id } as Cupom;
        setAppliedCoupon(couponData);
        toast({ title: "Cupom Aplicado!" });
      } else {
        setAppliedCoupon(null);
        toast({ variant: "destructive", title: "Cupom Inválido" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao validar" });
    } finally {
      setIsApplying(false);
    }
  };

  const calculateFinalDiscount = () => {
    let totalDiscount = 0;
    if (activePromo) {
      if (activePromo.tipo === 'fixo') totalDiscount += activePromo.valorDesconto;
      else totalDiscount += totalPrice * (activePromo.valorDesconto / 100);
    }
    if (appliedCoupon) {
      if (appliedCoupon.tipo === 'fixo') totalDiscount += appliedCoupon.desconto;
      else totalDiscount += totalPrice * (appliedCoupon.desconto / 100);
    }
    return Math.min(totalPrice, totalDiscount);
  };

  const discountValue = calculateFinalDiscount();
  const finalTotal = Math.max(0, (totalPrice - discountValue) + shippingCost);

  const generateOrderId = () => {
    const now = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PED-${now.getFullYear()}${(now.getMonth() + 1)}-${random}`;
  };

  const formatTelegramMessage = (order: any) => {
    let itemsText = "";
    order.itens.forEach((i: any, index: number) => {
      itemsText += `${index + 1}️⃣ *${i.nome}*\nQtd: ${i.quantidade} | ${i.tamanho} | ${i.cor}\n\n`;
    });

    return `🛍️ *NOVO PEDIDO - GOLD DREAM*

🧾 *Código:* #${order.codigo}

👤 *Cliente:* ${order.clienteNome}
📍 *Endereço:* ${order.clienteEndereco}

💰 *TOTAL: R$ ${order.total.toFixed(2)}*

❓ *PERGUNTE AO CLIENTE:*
"Qual forma de pagamento? Pix, dinheiro ou crédito? (No crédito tem taxa da máquina, quer consultar o valor?)"`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    setLastPhoneUsed(user.telefone || '');
    
    const orderId = generateOrderId();
    const pedidoData = {
      codigo: orderId,
      usuarioId: user.uid,
      clienteNome: user.nome || 'Cliente',
      clienteTelefone: user.telefone || '',
      clienteEndereco: user.endereco ? `${user.endereco.rua}, ${user.endereco.numero} - ${user.endereco.bairro}, ${user.endereco.cidade}` : 'Não informado',
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

    try {
      addDocumentNonBlocking(collection(firestore, 'pedidos'), pedidoData);
      
      if (tgConfig?.isActive && tgConfig.botToken && tgConfig.chatId) {
        const message = formatTelegramMessage(pedidoData);
        const confirmUrl = `${window.location.origin}/admin/orders/${orderId}/confirm`;
        const replyMarkup = JSON.stringify({
          inline_keyboard: [[{ text: "✅ Pegar Pedido", url: confirmUrl }]]
        });

        const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(replyMarkup)}`;
        fetch(url).catch(err => console.error("Telegram API Error:", err));
      }
      
      setTimeout(() => {
        setIsOrdered(true);
        clearCart();
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
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
            Aguarde, vamos entrar em contato via WhatsApp no número <span className="text-primary font-bold">{lastPhoneUsed}</span> para confirmar o pagamento e entrega.
          </p>
        </div>
        <div className="flex flex-col gap-4 max-w-xs mx-auto pt-8">
          <Button asChild className="h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
            <Link href="/account/orders">Meus Pedidos <ArrowRight className="ml-2 w-4 h-4" /></Link>
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
      {/* Modal Informativo Premium */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="rounded-3xl border-2 shadow-2xl max-w-lg">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
              <AlertCircle className="w-10 h-10" />
            </div>
            <DialogTitle className="text-3xl font-headline font-bold text-center">Como funciona seu pedido?</DialogTitle>
            <DialogDescription className="text-center text-base space-y-4 pt-2">
              <p>
                Ao finalizar, seus itens serão reservados no sistema. Nossa equipe entrará em contato via **WhatsApp** em breve para confirmar os dados de entrega e enviar os detalhes de pagamento.
              </p>
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-start gap-3 text-left">
                <CreditCard className="w-5 h-5 text-yellow-700 mt-1 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>Aviso sobre Pagamento:</strong> Se optar por cartão de crédito, o valor total poderá sofrer alteração devido às taxas da maquininha. Você poderá consultar o valor exato com nossa equipe.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button 
              onClick={() => setShowInfoModal(false)} 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            >
              Entendi, vamos lá!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary/10 p-3 rounded-2xl"><Zap className="w-8 h-8 text-primary" /></div>
        <h1 className="text-4xl font-headline font-bold">Finalizar Pedido</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          {/* Card de Como Funciona */}
          <section className="bg-muted/30 border-2 border-primary/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Como funciona seu pedido?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="font-black text-primary text-2xl">01</p>
                <p className="text-sm font-bold">Faça o Pedido</p>
                <p className="text-xs text-muted-foreground">Clique em finalizar e reserve seus itens no sistema.</p>
              </div>
              <div className="space-y-2">
                <p className="font-black text-primary text-2xl">02</p>
                <p className="text-sm font-bold">Contato WhatsApp</p>
                <p className="text-xs text-muted-foreground">Nossa equipe chama você para confirmar os dados.</p>
              </div>
              <div className="space-y-2">
                <p className="font-black text-primary text-2xl">03</p>
                <p className="text-sm font-bold">Pagamento</p>
                <p className="text-xs text-muted-foreground">Enviamos a chave Pix ou Link de Pagamento.</p>
              </div>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-yellow-200 flex gap-4 items-start">
               <div className="bg-yellow-100 p-2 rounded-full mt-1">
                 <CreditCard className="w-4 h-4 text-yellow-700" />
               </div>
               <div>
                 <p className="text-xs font-bold text-yellow-800 uppercase tracking-tighter">Observação Importante:</p>
                 <p className="text-xs text-yellow-700 font-medium italic">"Qual forma de pagamento? Pix, dinheiro ou crédito? (No crédito tem taxa da máquina, quer consultar o valor?)"</p>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Dados de Entrega</h2>
            <div className="p-8 bg-card rounded-3xl border-2 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <Button asChild variant="ghost" size="sm" className="text-primary font-bold"><Link href="/auth/complete-profile">Alterar</Link></Button>
               </div>
              <div className="flex flex-col gap-1 mb-6">
                <p className="font-black text-2xl text-primary">{user.nome}</p>
                <p className="text-muted-foreground font-mono text-sm">{user.telefone}</p>
              </div>
              <Separator />
              <div className="mt-6 space-y-1">
                {user.endereco?.cidade ? (
                  <>
                    <p className="font-bold">{user.endereco.rua}, {user.endereco.numero}</p>
                    <p className="text-muted-foreground">{user.endereco.bairro} — {user.endereco.cidade}</p>
                  </>
                ) : (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">
                    Endereço incompleto! Atualize seus dados.
                  </div>
                )}
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
                  <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm truncate">{item.product.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{item.selectedSize} | {item.selectedColor} (x{item.quantity})</p>
                    </div>
                    <p className="font-black text-sm">R$ {(item.product.preco * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 border-t space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cupom</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="CÓDIGO" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                    className="h-12 rounded-xl font-black uppercase" 
                  />
                  <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplying} className="h-12 rounded-xl font-bold">APLICAR</Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-sm">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-bold">R$ {totalPrice.toFixed(2)}</p>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <p>Descontos</p>
                    <p>- R$ {discountValue.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Frete</p>
                  <p className="font-bold">R$ {shippingCost.toFixed(2)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="py-2">
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Total Estimado</p>
                 <p className="text-4xl font-black text-primary leading-none">R$ {finalTotal.toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={isProcessing || items.length === 0 || !user.endereco?.cidade} 
                  className="w-full h-16 text-xl font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-3 w-7 h-7" />} ENVIAR PEDIDO
                </Button>
                
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-center space-y-1">
                   <p className="text-[11px] font-black text-yellow-800 uppercase leading-tight">
                     Nossa equipe perguntará: Qual forma de pagamento? Pix, dinheiro ou crédito?
                   </p>
                   <p className="text-[9px] text-yellow-700 font-medium leading-tight">
                     (Lembrando que no crédito há taxa da máquina. Você poderá consultar o valor da taxa no WhatsApp).
                   </p>
                </div>
              </div>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase font-bold px-4">
                Ao finalizar, você reserva os itens e aguarda nosso contato para o pagamento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
