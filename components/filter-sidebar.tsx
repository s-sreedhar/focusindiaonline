'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { PRIMARY_CATEGORIES, SUBJECTS } from '@/lib/constants';

interface FilterSidebarProps {
  onFiltersChange: (filters: any) => void;
  activeCategory?: string;
}

export function FilterSidebar({ onFiltersChange, activeCategory }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    onFiltersChange({ priceRange: value, selectedSubjects, selectedLanguages, inStockOnly });
  };

  const handleSubjectToggle = (subject: string) => {
    const updated = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(updated);
    onFiltersChange({ priceRange, selectedSubjects: updated, selectedLanguages, inStockOnly });
  };

  const handleLanguageToggle = (lang: string) => {
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter(l => l !== lang)
      : [...selectedLanguages, lang];
    setSelectedLanguages(updated);
    onFiltersChange({ priceRange, selectedSubjects, selectedLanguages: updated, inStockOnly });
  };

  const handleStockToggle = () => {
    setInStockOnly(!inStockOnly);
    onFiltersChange({ priceRange, selectedSubjects, selectedLanguages, inStockOnly: !inStockOnly });
  };

  const handleReset = () => {
    setPriceRange([0, 1000]);
    setSelectedSubjects([]);
    setSelectedLanguages([]);
    setInStockOnly(false);
    onFiltersChange({ priceRange: [0, 1000], selectedSubjects: [], selectedLanguages: [], inStockOnly: false });
  };

  return (
    <div className="w-full md:w-64 space-y-6">
      {/* Price Filter */}
      <div>
        <h3 className="font-bold mb-3">Filter by Price</h3>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          min={0}
          max={1000}
          step={50}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <h3 className="font-bold mb-3">Subjects</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {SUBJECTS.map((subject) => (
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
          {['English Medium', 'Telugu Medium'].map((lang) => (
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
