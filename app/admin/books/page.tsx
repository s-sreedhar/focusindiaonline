'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

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

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? book.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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

            <Card className="p-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or author..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">All Categories</option>
                        <option value="UPSC">UPSC</option>
                        <option value="SSC">SSC</option>
                        <option value="RRB">RRB</option>
                        <option value="BANKING">Banking</option>
                        <option value="APPSC">APPSC</option>
                        <option value="TSPSC">TSPSC</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBooks.map((book) => (
                    <Card key={book.id} className="overflow-hidden group">
                        <div className="relative aspect-[3/4]">
                            <Image
                                src={book.image || '/placeholder-book.jpg'}
                                alt={book.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold truncate flex-1" title={book.title}>{book.title}</h3>
                                {book.category && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded-full ml-2 shrink-0">
                                        {book.category}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-primary">₹{book.price}</span>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" asChild>
                                        <Link href={`/admin/books/${book.id}`}>
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(book.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredBooks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No books found matching your criteria.
                </div>
            )}
        </div>
    );
}
