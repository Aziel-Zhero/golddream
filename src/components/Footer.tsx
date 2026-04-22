import Link from 'next/link';
import { Github, Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="font-headline text-2xl font-bold text-primary">VogueCraft</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Redefining modern fashion with sustainable practices and high-quality craftsmanship. Your destination for contemporary style.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram size={20}/></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter size={20}/></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook size={20}/></Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-headline font-bold mb-6">Collections</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/category/women" className="hover:text-primary transition-colors">Women's Fashion</Link></li>
              <li><Link href="/category/men" className="hover:text-primary transition-colors">Men's Apparel</Link></li>
              <li><Link href="/category/accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-primary transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Size Guide</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">Join our community for exclusive early access and style updates.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-muted border-none rounded-md px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary outline-none"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>&copy; {new Date().getFullYear()} VogueCraft. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}