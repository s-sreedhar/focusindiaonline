'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Quote, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    avatarUrl: string;
    rating: number;
    order: number;
}

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const q = query(collection(db, 'testimonials'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Testimonial[];

                // Sort by order
                data.sort((a, b) => {
                    const orderA = a.order ?? 999;
                    const orderB = b.order ?? 999;
                    return orderA - orderB;
                });

                setTestimonials(data);
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading) return null;
    if (testimonials.length === 0) return null;

    return (
        <section className="py-20 bg-secondary/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary blur-3xl"></div>
                <div className="absolute top-40 -left-40 w-80 h-80 rounded-full bg-blue-500 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 inline-block mb-4">
                        Testimonials
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        See what our students are saying about Focus India
                    </p>
                </motion.div>

                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 4000,
                        }),
                    ]}
                    className="w-full max-w-5xl mx-auto"
                >
                    <CarouselContent>
                        {testimonials.map((testimonial) => (
                            <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 p-2">
                                <div className="p-1 h-full">
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full"
                                    >
                                        <Card className="h-full border-none shadow-lg bg-background/80 backdrop-blur-sm relative pt-8">
                                            <div className="absolute -top-4 left-6 bg-primary text-primary-foreground p-3 rounded-xl shadow-lg">
                                                <Quote size={20} fill="currentColor" />
                                            </div>
                                            <CardContent className="flex flex-col h-full p-6">
                                                <div className="flex mb-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={`${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} mr-1`}
                                                        />
                                                    ))}
                                                </div>

                                                <p className="text-muted-foreground flex-grow mb-6 italic">
                                                    "{testimonial.content}"
                                                </p>

                                                <div className="flex items-center gap-4 mt-auto pt-4 border-t">
                                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                                        <Image
                                                            src={testimonial.avatarUrl}
                                                            alt={testimonial.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm">{testimonial.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="-left-12 border-primary/20 hover:bg-primary hover:text-white" />
                        <CarouselNext className="-right-12 border-primary/20 hover:bg-primary hover:text-white" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
}
