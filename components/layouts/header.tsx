'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, User, Search, LogOut, Menu, X, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuthStore } from '@/lib/auth-store';
import { useCompareStore } from '@/lib/compare-store';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIMARY_CATEGORIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';

export function Header() {
  const { getItemCount: getCartCount } = useCartStore();
  const { getItemCount: getWishlistCount } = useWishlistStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { comparedBooks, removeFromCompare } = useCompareStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();
  const compareCount = comparedBooks.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(searchCategory)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-white py-4'
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 relative h-16 md:h-20 flex items-center">
              <Image
                src="/logo.svg"
                alt="Focus India"
                height={120}
                width={200}
                className="object-contain h-full w-auto"
                priority
              />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Search Bar (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative group items-center">
              <div className="flex w-full items-center rounded-full bg-muted/50 border border-transparent focus-within:bg-white focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-[140px] border-none bg-transparent h-10 rounded-l-full pl-4 focus:ring-0 text-muted-foreground font-medium">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {PRIMARY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Input
                  type="text"
                  placeholder="Search books..."
                  className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-10 rounded-r-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary mr-1">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent transition-colors relative" asChild>
                <Link href="/wishlist">
                  <Heart className="w-5 h-5" />
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Compare Button */}
              <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent transition-colors relative">
                    <ArrowRightLeft className="w-5 h-5" />
                    {mounted && compareCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                        {compareCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">Compare Books</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {compareCount > 0 ? (
                      <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-4 min-w-[800px]">
                        {/* Header Row - Images */}
                        <div className="font-bold text-muted-foreground pt-10">Product</div>
                        {comparedBooks.map((book) => (
                          <div key={book.id} className="flex flex-col items-center text-center">
                            <div className="relative w-32 h-44 mb-4 rounded-lg overflow-hidden shadow-md">
                              <Image src={book.image} alt={book.title} fill className="object-cover" />
                            </div>
                            <h3 className="font-bold text-sm line-clamp-2 min-h-[40px]">{book.title}</h3>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => removeFromCompare(book.id)}>Remove</Button>
                          </div>
                        ))}
                        {/* Fill empty columns if less than 4 */}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-gray-50/50">
                            <div className="text-muted-foreground text-sm">Empty Slot</div>
                          </div>
                        ))}

                        {/* Price */}
                        <div className="font-semibold text-muted-foreground border-t pt-4">Price</div>
                        {comparedBooks.map(book => (
                          <div key={book.id} className="border-t pt-4 text-center font-bold text-primary">₹{book.price}</div>
                        ))}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => <div key={i} className="border-t pt-4" />)}

                        {/* Category */}
                        <div className="font-semibold text-muted-foreground border-t pt-4">Category</div>
                        {comparedBooks.map(book => (
                          <div key={book.id} className="border-t pt-4 text-center text-sm">{book.category}</div>
                        ))}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => <div key={i} className="border-t pt-4" />)}

                        {/* Subject */}
                        <div className="font-semibold text-muted-foreground border-t pt-4">Subject</div>
                        {comparedBooks.map(book => (
                          <div key={book.id} className="border-t pt-4 text-center text-sm">{book.subjects?.join(', ') || '-'}</div>
                        ))}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => <div key={i} className="border-t pt-4" />)}

                        {/* Author */}
                        <div className="font-semibold text-muted-foreground border-t pt-4">Author</div>
                        {comparedBooks.map(book => (
                          <div key={book.id} className="border-t pt-4 text-center text-sm">{book.author}</div>
                        ))}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => <div key={i} className="border-t pt-4" />)}

                        {/* Pages */}
                        <div className="font-semibold text-muted-foreground border-t pt-4">Action</div>
                        {comparedBooks.map(book => (
                          <div key={book.id} className="border-t pt-4 text-center">
                            <Button size="sm" asChild>
                              <Link href={`/product/${book.slug}`}>View Details</Link>
                            </Button>
                          </div>
                        ))}
                        {Array.from({ length: 4 - comparedBooks.length }).map((_, i) => <div key={i} className="border-t pt-4" />)}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground mb-4">No books selected for comparison.</p>
                        <Button onClick={() => setIsCompareOpen(false)}>Continue Shopping</Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors relative" asChild>
                <Link href="/cart">
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="px-2 py-1.5 mb-2 bg-muted/50 rounded-md">
                      <div className="text-sm font-semibold">{user.displayName || 'User'}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md">
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md">
                      <Link href="/account/orders">My Orders</Link>
                    </DropdownMenuItem>
                    {user.role === 'superadmin' && (
                      <DropdownMenuItem asChild className="cursor-pointer rounded-md">
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-md text-red-500 focus:text-red-500 focus:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" size="sm" className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl lg:hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-bold text-lg text-primary">Menu</div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="mb-6">
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-9 bg-muted/50 rounded-full"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </form>

                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-4 border-t bg-muted/20">
                {!isAuthenticated && (
                  <Button asChild className="w-full rounded-full mb-2">
                    <Link href="/login">Login / Sign Up</Link>
                  </Button>
                )}
                <div className="text-xs text-center text-muted-foreground">
                  &copy; 2025 Focus India Online
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
