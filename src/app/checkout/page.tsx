"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isOrdered, setIsOrdered] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate order placement
    setTimeout(() => {
      setIsOrdered(true);
      clearCart();
    }, 1500);
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-headline font-bold">Thank you for your order!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your order has been placed successfully. We'll send you an email confirmation with tracking details shortly.
        </p>
        <Button asChild size="lg" className="rounded-full px-12">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-headline font-bold mb-12">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Shipping Form */}
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
            <section className="space-y-6">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" /> Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required defaultValue={user?.name.split(' ')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required defaultValue={user?.name.split(' ')[1]} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required defaultValue={user?.email} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input id="zip" required />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" /> Payment Method
              </h2>
              <div className="border rounded-xl p-6 bg-muted/30 border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center shadow-sm">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">Credit / Debit Card</p>
                    <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="cardNum">Card Number</Label>
                    <Input id="cardNum" placeholder="0000 0000 0000 0000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" required />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-muted/50">
            <CardHeader>
              <CardTitle className="font-headline font-bold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedSize}`} className="flex justify-between text-sm">
                    <p className="text-muted-foreground">{item.product.name} x {item.quantity}</p>
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">${totalPrice.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <p>Shipping</p>
                  <p>FREE</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Taxes</p>
                  <p className="font-medium">${(totalPrice * 0.1).toFixed(2)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>${(totalPrice * 1.1).toFixed(2)}</p>
              </div>
              <Button form="checkout-form" size="lg" className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/20">
                Confirm Order
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <ShieldCheck className="w-4 h-4" /> Secure SSL Encryption
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}