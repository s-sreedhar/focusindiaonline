'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { PRIMARY_CATEGORIES, SUBJECTS } from '@/lib/constants';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FilterSidebarProps {
  filters: {
    priceRange: number[];
    selectedCategories: string[];
    selectedSubjects: string[];
    selectedLanguages: string[];
    inStockOnly: boolean;
    showBundles: boolean; // New filter
  };
  onFiltersChange: (filters: any) => void;
  availableSubjects?: string[];
  availableCategories?: string[]; // Keep for prop compatibility if passed from parent, though we fetch internally too
}

export function FilterSidebar({ filters, onFiltersChange, availableSubjects = [], availableCategories = [] }: FilterSidebarProps) {
  const {
    priceRange,
    selectedCategories,
    selectedSubjects,
    selectedLanguages,
    inStockOnly,
    showBundles
  } = filters;

  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const catQuery = query(collection(db, 'categories'), orderBy('name'));
        const catSnapshot = await getDocs(catQuery);
        const cats = catSnapshot.docs.map((doc: any) => doc.data().name as string);
        setDbCategories(cats.length > 0 ? cats : PRIMARY_CATEGORIES);

        // Fetch Subjects
        const subQuery = query(collection(db, 'subjects'), orderBy('name'));
        const subSnapshot = await getDocs(subQuery);
        const subs = subSnapshot.docs.map((doc: any) => doc.data().name as string);
        setDbSubjects(subs.length > 0 ? subs : SUBJECTS);
      } catch (error) {
        console.error("Error fetching filters", error);
        setDbCategories(PRIMARY_CATEGORIES);
        setDbSubjects(SUBJECTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePriceChange = (value: [number, number]) => {
    onFiltersChange({ ...filters, priceRange: value });
  };

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onFiltersChange({ ...filters, selectedCategories: updated });
  };

  const handleSubjectToggle = (subject: string) => {
    const updated = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    onFiltersChange({ ...filters, selectedSubjects: updated });
  };

  const handleLanguageToggle = (lang: string) => {
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter(l => l !== lang)
      : [...selectedLanguages, lang];
    onFiltersChange({ ...filters, selectedLanguages: updated });
  };

  const handleStockToggle = () => {
    onFiltersChange({ ...filters, inStockOnly: !inStockOnly });
  };

  const handleBundlesToggle = () => {
    onFiltersChange({ ...filters, showBundles: !showBundles });
  };

  const handleReset = () => {
    onFiltersChange({
      priceRange: [0, 2000],
      selectedCategories: [],
      selectedSubjects: [],
      selectedLanguages: [],
      inStockOnly: false,
      showBundles: false
    });
  };

  // Use dynamic categories if fetched, otherwise fallback to props or constants
  const categoriesToDisplay = dbCategories.length > 0 ? dbCategories : (availableCategories.length > 0 ? availableCategories : PRIMARY_CATEGORIES);
  const subjectsToDisplay = dbSubjects.length > 0 ? dbSubjects : (availableSubjects.length > 0 ? availableSubjects : SUBJECTS);

  return (
    <div className="w-full md:w-64 space-y-6">
      {/* Price Filter */}
      <div>
        <h3 className="font-bold mb-3">Filter by Price</h3>
        <Slider
          value={priceRange as [number, number]}
          onValueChange={handlePriceChange}
          min={0}
          max={2000}
          step={50}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Combos Filter - NEW SECTION */}
      <div>
        <h3 className="font-bold mb-3">Combos</h3>
        <div className="flex items-center">
          <Checkbox
            id="bundles"
            checked={showBundles}
            onCheckedChange={handleBundlesToggle}
          />
          <label htmlFor="bundles" className="ml-2 text-sm cursor-pointer">Bundles</label>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="font-bold mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categoriesToDisplay.map((category) => (
            <div key={category} className="flex items-center">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <label htmlFor={category} className="ml-2 text-sm cursor-pointer">{category}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <h3 className="font-bold mb-3">Subjects</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {subjectsToDisplay.map((subject) => (
            <div key={subject} className="flex items-center">
              <Checkbox
                id={subject}
                checked={selectedSubjects.includes(subject)}
                onCheckedChange={() => handleSubjectToggle(subject)}
              />
              <label htmlFor={subject} className="ml-2 text-sm cursor-pointer">{subject}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Language Filter */}
      <div>
        <h3 className="font-bold mb-3">Language</h3>
        <div className="space-y-2">
          {['English', 'Telugu'].map((lang) => (
            <div key={lang} className="flex items-center">
              <Checkbox
                id={lang}
                checked={selectedLanguages.includes(lang)}
                onCheckedChange={() => handleLanguageToggle(lang)}
              />
              <label htmlFor={lang} className="ml-2 text-sm cursor-pointer">{lang}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <h3 className="font-bold mb-3">Availability</h3>
        <div className="flex items-center">
          <Checkbox
            id="inStock"
            checked={inStockOnly}
            onCheckedChange={handleStockToggle}
          />
          <label htmlFor="inStock" className="ml-2 text-sm cursor-pointer">In Stock Only</label>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleReset}
      >
        Reset Filters
      </Button>
    </div>
  );
}
