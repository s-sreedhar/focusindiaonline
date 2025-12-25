import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Quote, Star, PenLine, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Autoplay from "embla-carousel-autoplay"

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    avatarUrl: string;
    rating: number;
    createdAt: any;
}

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        rating: 5
    });

    const fetchTestimonials = async () => {
        try {
            // Fetch latest 10 reviews
            const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Testimonial[];

            setTestimonials(data);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate
        if (!formData.name.trim() || !formData.content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }
        if (formData.rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setSubmitting(true);
        try {
            // Generate Avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;

            await addDoc(collection(db, 'reviews'), {
                name: formData.name,
                role: 'Customer',
                content: formData.content,
                rating: Number(formData.rating),
                avatarUrl,
                createdAt: serverTimestamp(),
                // Add order field for backward compatibility/admin usage if needed, but we rely on createdAt here
                order: 999
            });

            toast.success("Thank you! Your review has been posted.");
            setIsDialogOpen(false);
            setFormData({ name: '', content: '', rating: 5 });
            fetchTestimonials(); // Refresh list to show new review if it's in top 10
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <section className="py-20 bg-secondary/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary blur-3xl"></div>
                <div className="absolute top-40 -left-40 w-80 h-80 rounded-full bg-blue-500 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center w-full"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 inline-block mb-2">
                            Customer Reviews
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            See what our students are saying about Focus India
                        </p>
                    </motion.div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                                <PenLine className="w-4 h-4 mr-2" />
                                Write a Review
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Write a Review</DialogTitle>
                                <DialogDescription>
                                    Share your experience with us. Your feedback matters!
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmitReview} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Your Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Rahul Kumar"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Rating</Label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                                className={`focus:outline-none transition-colors ${formData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                            >
                                                <Star size={24} fill="currentColor" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content">Your Review</Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        placeholder="Tell us about your experience..."
                                        rows={4}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Review"
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {testimonials.length > 0 ? (
                    <Carousel
                        plugins={[
                            Autoplay({
                                delay: 4000,
                            }),
                        ]}
                        className="w-full max-w-6xl mx-auto"
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

                                                    <p className="text-muted-foreground flex-grow mb-6 italic text-sm line-clamp-4">
                                                        "{testimonial.content}"
                                                    </p>

                                                    <div className="flex items-center gap-4 mt-auto pt-4 border-t">
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                                                            {testimonial.avatarUrl ? (
                                                                <Image
                                                                    src={testimonial.avatarUrl}
                                                                    alt={testimonial.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                                                    <span className="font-bold text-xs">{testimonial.name?.slice(0, 2).toUpperCase()}</span>
                                                                </div>
                                                            )}
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
                ) : (
                    <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed">
                        <p className="text-muted-foreground">Be the first to write a review!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
