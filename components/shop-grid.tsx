'use client';

import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/product-card';
import { FilterSidebar } from '@/components/filter-sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Grid2x2, Grid3x3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Book } from '@/lib/types';

interface ShopGridProps {
  books: Book[];
  activeCategory?: string;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'bestselling' | 'rating';

export function ShopGrid({ books, activeCategory }: ShopGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<{
    priceRange: number[];
    selectedCategories: string[];
    selectedSubjects: string[];
    selectedLanguages: string[];
    inStockOnly: boolean;
  }>({
    priceRange: [0, 1000],
    selectedCategories: activeCategory ? [activeCategory] : [],
    selectedSubjects: [],
    selectedLanguages: [],
    inStockOnly: false,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters, sortBy, activeCategory, itemsPerPage]);

  const filteredAndSortedBooks = useMemo(() => {
    let result = books.filter((book) => {
      // Price filter
      if (book.price < filters.priceRange[0] || book.price > filters.priceRange[1]) {
        return false;
      }

      // Category filter
      if (filters.selectedCategories.length > 0) {
        const bookCategory = book.primaryCategory || book.category;
        if (!bookCategory || !filters.selectedCategories.includes(bookCategory)) {
          return false;
        }
      }

      // Subject filter
      if (filters.selectedSubjects.length > 0) {
        const hasSubject = filters.selectedSubjects.some(subject =>
          book.subjects?.some(s => s.toLowerCase() === subject.toLowerCase())
        );
        if (!hasSubject) return false;
      }

      // Language filter
      if (filters.selectedLanguages.length > 0) {
        const hasLanguage = filters.selectedLanguages.some(lang =>
          book.language?.toLowerCase().includes(lang.toLowerCase())
        );
        if (!hasLanguage) return false;
      }

      // Stock filter
      if (filters.inStockOnly && !book.inStock) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        break;
      case 'bestselling':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [books, filters, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedBooks.length / itemsPerPage);
  const currentBooks = filteredAndSortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <FilterSidebar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                <div className="py-6">
                  <h2 className="text-lg font-bold mb-4">Filters</h2>
                  <FilterSidebar filters={filters} onFiltersChange={setFilters} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium">Show:</span>
              {[9, 12, 18, 24].map((num, index, arr) => (
                <button
                  key={num}
                  onClick={() => setItemsPerPage(num)}
                  className={`text-sm hover:text-primary transition-colors ${itemsPerPage === num ? 'font-bold text-primary' : 'text-muted-foreground'
                    }`}
                >
                  {num} {index < arr.length - 1 && <span className="text-muted-foreground/50 font-normal mx-1">/</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGridColumns(2)}
                className={`p-1 rounded hover:bg-muted ${gridColumns === 2 ? 'text-primary' : 'text-muted-foreground'}`}
                title="2 Columns"
              >
                <Grid2x2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridColumns(3)}
                className={`p-1 rounded hover:bg-muted ${gridColumns === 3 ? 'text-primary' : 'text-muted-foreground'}`}
                title="3 Columns"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridColumns(4)}
                className={`p-1 rounded hover:bg-muted ${gridColumns === 4 ? 'text-primary' : 'text-muted-foreground'}`}
                title="4 Columns"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 px-0 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">Sort by:</span>
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="featured">Default sorting</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="bestselling">Best Selling</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {currentBooks.length > 0 ? (
          <>
            <div className={`grid gap-6 ${gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
              gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
              {currentBooks.map((book) => (
                <ProductCard key={book.id} {...book} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
            <button
              onClick={() => setFilters({ priceRange: [0, 1000], selectedCategories: [], selectedSubjects: [], selectedLanguages: [], inStockOnly: false })}
              className="text-primary hover:underline"
            >
              Clear filters and try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
