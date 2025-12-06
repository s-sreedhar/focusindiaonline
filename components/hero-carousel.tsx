'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
    id: string;
    imageUrl: string;
    title?: string;
    link?: string;
}

interface HeroCarouselProps {
    banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    if (!banners || banners.length === 0) return null;

    return (
        <div className="relative group">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {banners.map((banner) => (
                        <div key={banner.id} className="relative flex-[0_0_100%] min-w-0">
                            <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px]">
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title || 'Banner'}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Overlay/Content */}
                                {(banner.title || banner.link) && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="text-center text-white p-4 max-w-4xl">
                                            {banner.title && (
                                                <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                                                    {banner.title}
                                                </h2>
                                            )}
                                            {banner.link && (
                                                <Button asChild size="lg" className="rounded-full text-lg px-8 shadow-lg">
                                                    <Link href={banner.link}>
                                                        Explore Now
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                onClick={scrollPrev}
            >
                <ChevronLeft className="w-8 h-8" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                onClick={scrollNext}
            >
                <ChevronRight className="w-8 h-8" />
            </Button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === selectedIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                            }`}
                        onClick={() => scrollTo(index)}
                    />
                ))}
            </div>
        </div>
    );
}
