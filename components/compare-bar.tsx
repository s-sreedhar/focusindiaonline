'use client';

// Updated Compare Bar with dynamic layout and reset option
import { useCompareStore } from '@/lib/compare-store';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export function CompareBar() {
    const { comparedBooks, removeFromCompare, clearCompare } = useCompareStore();
    const [isOpen, setIsOpen] = useState(false);

    if (comparedBooks.length === 0) return null;

    // Use dynamic grid columns based on number of selected books
    const gridCols = `150px repeat(${comparedBooks.length}, 1fr)`;

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 border-t py-4 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
                        {comparedBooks.map((book) => (
                            <div key={book.id} className="relative group flex-shrink-0">
                                <div className="w-16 h-20 relative rounded-md overflow-hidden border shadow-sm">
                                    <Image
                                        src={book.image}
                                        alt={book.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <button
                                    onClick={() => removeFromCompare(book.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {/* removed empty slot placeholder */}
                        <div className="text-sm font-medium text-muted-foreground ml-2 hidden sm:block">
                            {comparedBooks.length} book{comparedBooks.length !== 1 ? 's' : ''} selected
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={clearCompare}>
                            Clear All
                        </Button>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsOpen(true)} className="rounded-full shadow-lg shadow-primary/25">
                                    Compare Now <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                                <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                                    <SheetTitle className="text-2xl font-bold">Compare Books</SheetTitle>
                                    <Button variant="destructive" size="sm" onClick={() => { clearCompare(); setIsOpen(false); }}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear Comparison
                                    </Button>
                                </SheetHeader>
                                <div className="mt-6">
                                    <div
                                        className="grid gap-4 min-w-[800px]"
                                        style={{ gridTemplateColumns: gridCols }}
                                    >
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

                                        {/* Price */}
                                        <div className="font-semibold text-muted-foreground border-t pt-4">Price</div>
                                        {comparedBooks.map(book => (
                                            <div key={book.id} className="border-t pt-4 text-center font-bold text-primary">₹{book.price}</div>
                                        ))}

                                        {/* Category */}
                                        <div className="font-semibold text-muted-foreground border-t pt-4">Category</div>
                                        {comparedBooks.map(book => (
                                            <div key={book.id} className="border-t pt-4 text-center text-sm">{book.category}</div>
                                        ))}

                                        {/* Subject */}
                                        <div className="font-semibold text-muted-foreground border-t pt-4">Subject</div>
                                        {comparedBooks.map(book => (
                                            <div key={book.id} className="border-t pt-4 text-center text-sm">{book.subjects?.join(', ') || book.subject || '-'}</div>
                                        ))}

                                        {/* Author */}
                                        <div className="font-semibold text-muted-foreground border-t pt-4">Author</div>
                                        {comparedBooks.map(book => (
                                            <div key={book.id} className="border-t pt-4 text-center text-sm">{book.author}</div>
                                        ))}

                                        {/* Action */}
                                        <div className="font-semibold text-muted-foreground border-t pt-4">Action</div>
                                        {comparedBooks.map(book => (
                                            <div key={book.id} className="border-t pt-4 text-center">
                                                <Button size="sm" asChild>
                                                    <Link href={`/product/${book.slug}`}>View Details</Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </>
    );
}
