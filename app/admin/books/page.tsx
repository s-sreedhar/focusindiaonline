'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { SubjectManager } from '@/components/admin/subject-manager';
import { CategoryManager } from '@/components/admin/category-manager';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Book {
    id: string;
    title: string;
    author: string;
    price: number;
    image: string;
    category: string;
    subject?: string;
    subjects?: string[];
}

interface Item {
    id: string;
    name: string;
}

export default function BooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [subjects, setSubjects] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Books
                const booksSnapshot = await getDocs(collection(db, 'books'));
                const booksData = booksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Book[];
                setBooks(booksData);

                // Fetch Subjects
                const subjectsQuery = query(collection(db, 'subjects'), orderBy('name'));
                const subjectsSnapshot = await getDocs(subjectsQuery);
                const subjectsData = subjectsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setSubjects(subjectsData);

                // Fetch Categories
                const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
                const categoriesSnapshot = await getDocs(categoriesQuery);
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setCategories(categoriesData);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

        const matchesSubject = selectedSubject ? (
            (book.subject === selectedSubject) ||
            (book.subjects && book.subjects.includes(selectedSubject))
        ) : true;

        return matchesSearch && matchesCategory && matchesSubject;
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
                <div className="flex gap-2">
                    <CategoryManager />
                    <SubjectManager />
                    <Button asChild>
                        <Link href="/admin/books/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Book
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="p-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or author..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedSubject}
                        onChange={(e) => {
                            setSelectedSubject(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.name}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Pagination Logic */}
            {(() => {
                const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
                const paginatedBooks = filteredBooks.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                );

                return (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {paginatedBooks.map((book) => (
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

                                        {/* Display Subject if available */}
                                        {book.subject && (
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                {book.subject}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center mt-2">
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

                        {totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    isActive={currentPage === i + 1}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className="cursor-pointer"
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                );
            })()}

            {filteredBooks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No books found matching your criteria.
                </div>
            )}
        </div>
    );
}
