'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      {/* Main Image */}
      <div className="relative bg-secondary/20 rounded-lg overflow-hidden aspect-[3/4] md:aspect-square w-full flex items-center justify-center">
        <Image
          src={images[selectedIndex] || '/placeholder.svg'}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-contain p-4 mix-blend-multiply"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={nextImage}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${index === selectedIndex ? 'border-primary' : 'border-transparent'
                }`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={80}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
