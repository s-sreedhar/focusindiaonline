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
import type { Book } from '@/lib/types';

interface ShopGridProps {
  books: Book[];
  activeCategory?: string;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'bestselling' | 'rating';

export function ShopGrid({ books, activeCategory }: ShopGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    selectedSubjects: [],
    selectedLanguages: [],
    inStockOnly: false,
  });

  const filteredAndSortedBooks = useMemo(() => {
    let result = books.filter((book) => {
      // Price filter
      if (book.price < filters.priceRange[0] || book.price > filters.priceRange[1]) {
        return false;
      }

      // Subject filter
      if (filters.selectedSubjects.length > 0) {
        const hasSubject = filters.selectedSubjects.some(subject =>
          book.subjects.includes(subject)
        );
        if (!hasSubject) return false;
      }

      // Language filter
      if (filters.selectedLanguages.length > 0) {
        if (!filters.selectedLanguages.includes(book.language)) {
          return false;
        }
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

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <FilterSidebar onFiltersChange={setFilters} activeCategory={activeCategory} />

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedBooks.length} products
          </p>
          
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="bestselling">Best Selling</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 border rounded-md p-1">
              <button
                onClick={() => setViewType('grid')}
                className={`px-3 py-1 rounded ${viewType === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`px-3 py-1 rounded ${viewType === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                ≡
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredAndSortedBooks.length > 0 ? (
          <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAndSortedBooks.map((book) => (
              <ProductCard key={book.id} {...book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
            <button
              onClick={() => setFilters({ priceRange: [0, 1000], selectedSubjects: [], selectedLanguages: [], inStockOnly: false })}
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
