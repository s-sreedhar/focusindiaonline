'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">

              </div>
              <div className="font-bold text-lg leading-none text-primary">
                Imam's Focus India
                <span className="block text-[10px] font-medium text-muted-foreground tracking-wider">ONLINE</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your one-stop destination for competitive exam preparation books. We provide the best study materials to help you succeed.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Send className="w-5 h-5" />
              </a>
              {/* <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-6 text-foreground">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-primary transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link href="/cancellation-policy" className="text-muted-foreground hover:text-primary transition-colors">Cancellation Policy</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold mb-6 text-foreground">Popular Categories</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop/APPSC" className="text-muted-foreground hover:text-primary transition-colors">APPSC Books</Link></li>
              <li><Link href="/shop/UPSC" className="text-muted-foreground hover:text-primary transition-colors">UPSC Materials</Link></li>
              <li><Link href="/shop/BANKING" className="text-muted-foreground hover:text-primary transition-colors">Banking Exams</Link></li>
              <li><Link href="/shop/SSC" className="text-muted-foreground hover:text-primary transition-colors">SSC Guides</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-6 text-foreground">Get in Touch</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>+91 93908 61116</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>imamsheik999@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Focus India Online. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
