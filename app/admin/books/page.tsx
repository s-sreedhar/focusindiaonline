'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Image from 'next/image';

interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    image: string;
    category: string;
}

export default function BooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'books'));
            const booksData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Book[];
            setBooks(booksData);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this book?')) return;

        try {
            await deleteDoc(doc(db, 'books', id));
            setBooks(books.filter(book => book.id !== id));
        } catch (error) {
            console.error("Error deleting book:", error);
            alert('Failed to delete book');
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Books</h1>
                    <p className="text-muted-foreground">Manage your book inventory</p>
                </div>
                <Button asChild>
                    <Link href="/admin/books/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Book
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                    <Card key={book.id} className="overflow-hidden group">
                        <div className="relative aspect-[3/4]">
                            <Image
                                src={book.image || '/placeholder-book.jpg'}
                                alt={book.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold truncate" title={book.title}>{book.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-primary">₹{book.price}</span>
                                <div className="flex gap-2">
                                    {/* <Button size="icon" variant="ghost" asChild>
                    <Link href={`/admin/books/${book.id}/edit`}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </Button> */}
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(book.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {books.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No books found. Add your first book!
                </div>
            )}
        </div>
    );
}
