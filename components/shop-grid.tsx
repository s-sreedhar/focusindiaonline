'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { CompareBar } from '@/components/compare-bar';
import { useSearchParams, useRouter } from 'next/navigation';
import Fuse from 'fuse.js';

interface ShopGridProps {
  books: Book[];
  testSeries?: any[]; // Add testSeries prop
  activeCategory?: string;
  showCombos?: boolean;
  allSubjects?: string[];
  allCategories?: string[];
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'bestselling' | 'rating';

export function ShopGrid({ books, testSeries = [], activeCategory, showCombos = false, allSubjects = [], allCategories = [] }: ShopGridProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category');
  const urlShowBundles = searchParams.get('bundles') === 'true';

  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<{
    priceRange: number[];
    selectedCategories: string[];
    selectedSubjects: string[];
    selectedLanguages: string[];
    inStockOnly: boolean;
    showBundles: boolean;
    showTestSeries: boolean;
  }>({
    priceRange: [0, 2000],
    selectedCategories: activeCategory ? [activeCategory] : (urlCategory ? [urlCategory] : []),
    selectedSubjects: [],
    selectedLanguages: [],
    inStockOnly: false,
    showBundles: urlShowBundles,
    showTestSeries: false,
  });

  const router = useRouter(); // Import useRouter from next/navigation

  // Sync state with URL only for Category
  useEffect(() => {
    if (filters.selectedCategories.length === 1) {
      const cat = filters.selectedCategories[0];
      if (cat !== urlCategory) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('category', cat);
        router.push(`/shop?${params.toString()}`, { scroll: false });
      }
    } else if (filters.selectedCategories.length === 0 && urlCategory) {
      // Clear category if removed
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      router.push(`/shop?${params.toString()}`, { scroll: false });
    }
  }, [filters.selectedCategories, urlCategory, router, searchParams]);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters, sortBy, activeCategory, itemsPerPage]);

  const displaySubjects = useMemo(() => {
    if (allSubjects && allSubjects.length > 0) {
      return allSubjects;
    }
    const subjects = new Set<string>();
    books.forEach(book => {
      book.subjects?.forEach(s => {
        if (s) subjects.add(s.trim());
      });
      if (book.subject) subjects.add(book.subject.trim());
    });
    return Array.from(subjects).sort();
  }, [books, allSubjects]);

  const displayCategories = useMemo(() => {
    if (allCategories && allCategories.length > 0) {
      return allCategories;
    }
    const categories = new Set<string>();
    books.forEach(book => {
      if (book.category) categories.add(book.category);
      if (book.primaryCategory) categories.add(book.primaryCategory);
    });
    return Array.from(categories).sort();
  }, [books, allCategories]);

  // const searchParams = useSearchParams(); // Moved up
  // const searchQuery = searchParams.get('search') || ''; // Moved up

  const filteredAndSortedBooks = useMemo(() => {
    // Merge books and test series if needed or just switch source
    let result: any[] = [...books];

    if (filters.showTestSeries) {
      // If Test Series filter is ON, we might want to show ONLY test series or mix them?
      // "Add test series like a differnt atribute in filtets" -> implies mix or filter.
      // Usually filters narrow down. If I check "Test Series", I expect to see them.
      // Since they are distinct from books, maybe we append them?
      // Or if "Test Series" is checked, we ONLY show test series?
      // Let's Append them to the result set initially, then filter.
      // ACTUALLY: The user said "like Combos". Combos are a type of book/product.
      // So let's include Test Series in the pool of items to filter.

      // HOWEVER, if Test Series is checked, we probably ONLY want to see Test Series.
      // Similar to "Bundles" filter logic I implemented: "If Bundles is ON, show ONLY combos".

      result = testSeries;
    } else {
      // If Test Series is OFF, should we hide them?
      // Yes, default behavior for "Types" filters usually.
      // But wait, "Bundles" filter logic was: if ON, show ONLY combos. If OFF, show everything (combos are part of books).
      // Test Series are NOT part of books array passed in.
      // So if Test Series filter is OFF, we just show books.
      // If Test Series filter is ON, we show Test Series.
      // This acts like a toggle between Books and Test Series?
      // Or should they be mixed? 
      // "Show test series just like other items"
      // Let's support mixing if we want, but typically:
      // Case 1: All unchecked -> Show Books (Test Series are special).
      // Case 2: Test Series checked -> Show ONLY Test Series.

      // Let's go with: If Test Series checked, show Test Series. If not, show Books.
      // AND handle Bundles within Books.

      result = books;
    }

    // 1. Fuzzy Search (First priority)
    if (searchQuery) {
      const fuse = new Fuse(result, {
        keys: ['title', 'author', 'category', 'subjects', 'description', 'publisher'],
        threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything. 0.4 is good for typos
        distance: 100,
        includeScore: true,
      });
      // Map back to item and filter by score if needed, but Fuse does a good job sorting by relevance
      result = fuse.search(searchQuery).map((res: any) => res.item);
    }

    result = result.filter((item) => {
      // Test Series don't have all book fields, so be careful.
      const isTestSeries = (item as any).isTestSeries;

      // Explicitly filter out hidden items (safety check)
      if ((item as any).show === false) return false;

      if (filters.showTestSeries) {
        // If we are showing test series, we are iterating over testSeries array (set above).
        // We might still want to apply Price filter?
        // Yes.
      } else {
        // We are iterating books.
        // Combo vs Regular Book Filter
        const isCombo = (item as any).isCombo || item.category === 'Value Bundles';

        // If "Bundles" filter is ON, show ONLY combos
        if (filters.showBundles) {
          if (!isCombo) return false;
        } else if (showCombos) {
          // If prop passed (e.g. from combos page), also show only combos 
          if (!isCombo) return false;
        }
      }

      // Price filter (Test Series also have price)
      if (item.price < filters.priceRange[0] || item.price > filters.priceRange[1]) {
        return false;
      }

      // Category filter (Test Series have category='Test Series')
      // If categories selected, does it apply to Test Series? 
      // Probably not useful for Test Series unless they have categories.
      // If user filters by "History", should Test Series show up?
      // Our Test Series data might not have subjects yet.
      // Let's apply Category/Subject filters only if not Test Series OR if Test Series has matching fields.
      if (!filters.showTestSeries) {
        if (filters.selectedCategories.length > 0) {
          const bookCategory = (item.primaryCategory || item.category || '').toLowerCase().trim();
          const moves = filters.selectedCategories.some(selected =>
            selected.toLowerCase().trim() === bookCategory
          );
          if (!moves) return false;
        }

        // Subject filter
        if (filters.selectedSubjects.length > 0) {
          const hasSubject = filters.selectedSubjects.some(subject => {
            // Check array
            const inArray = item.subjects?.some((s: string) => s && subject && s.toLowerCase().trim() === subject.toLowerCase().trim());
            // Check legacy string
            const inString = item.subject && item.subject.toLowerCase().trim() === subject.toLowerCase().trim();
            return inArray || inString;
          });
          if (!hasSubject) return false;
        }

        // Language filter
        if (filters.selectedLanguages.length > 0) {
          const hasLanguage = filters.selectedLanguages.some(lang =>
            item.language?.toLowerCase().includes(lang.toLowerCase())
          );
          if (!hasLanguage) return false;
        }

        // Stock filter
        if (filters.inStockOnly) {
          // Check both inStock boolean (if present) and stockQuantity
          const isOutOfStock = (item.inStock === false) || (item.stockQuantity !== undefined && item.stockQuantity <= 0);
          if (isOutOfStock) return false;
        }
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
        result.sort((a, b) => new Date(b.id || 0).getTime() - new Date(a.id || 0).getTime());
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
  }, [books, testSeries, filters, sortBy, showCombos]);

  const totalPages = Math.ceil(filteredAndSortedBooks.length / itemsPerPage);
  const currentBooks = filteredAndSortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          availableSubjects={displaySubjects}
          availableCategories={displayCategories}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" className="md:hidden bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[350px] overflow-y-auto px-4">
                <div className="py-6">
                  <h2 className="text-lg font-bold mb-4">Filters</h2>
                  <FilterSidebar
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableSubjects={displaySubjects}
                    availableCategories={displayCategories}
                  />
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

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
            <div className="hidden md:flex items-center gap-2">
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

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap md:hidden">Sort:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-[180px] border-none shadow-none focus:ring-0 px-0 md:text-right h-auto py-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-normal hidden md:inline">Sort by:</span>
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
        </div>

        {/* Products Grid */}
        {currentBooks.length > 0 ? (
          <>
            <div className={`grid gap-3 sm:gap-6 ${gridColumns === 2 ? 'grid-cols-2 md:grid-cols-2' :
              gridColumns === 3 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3' :
                'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
              {currentBooks.map((book) => (
                <ProductCard key={book.id} {...book} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 text-sm"
                >
                  Previous
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (typeof page === 'number') {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    disabled={typeof page !== 'number'}
                    className={`min-w-[40px] h-10 rounded-md flex items-center justify-center text-sm ${page === currentPage
                      ? 'bg-primary text-primary-foreground font-medium'
                      : typeof page === 'number'
                        ? 'border hover:bg-gray-50'
                        : 'cursor-default'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 text-sm"
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
              onClick={() => {
                setFilters({ priceRange: [0, 2000], selectedCategories: [], selectedSubjects: [], selectedLanguages: [], inStockOnly: false, showBundles: false, showTestSeries: false });
                router.push('/shop');
              }}
              className="text-primary hover:underline"
            >
              Clear filters and try again
            </button>
          </div>
        )}
      </div>
      <CompareBar />
    </div>
  );
}
