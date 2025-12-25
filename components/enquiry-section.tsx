'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export function EnquirySection() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'enquiries'), {
                ...formData,
                status: 'new', // new, read, replied
                createdAt: serverTimestamp()
            });

            toast.success('Message sent successfully! We will get back to you soon.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Error submitting enquiry:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col md:flex-row gap-12 items-center">

                    {/* Text Content */}
                    <div className="w-full md:w-1/2 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Have questions? <br />
                            <span className="text-primary">We're here to help.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Whether you need details about our test series, study materials, or just want to say hello, fill out the form and our team will get back to you shortly.
                        </p>

                        <div className="grid grid-cols-1 gap-4 mt-8">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Quick Support</h4>
                                    <p className="text-sm text-muted-foreground">Get answers within 24 hours</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="w-full md:w-1/2">
                        <Card className="p-8 shadow-xl border-t-4 border-t-primary">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Send us a Message
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="10 digit number"
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">Subject <span className="text-red-500">*</span></label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
                                    <textarea
                                        id="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Tell us more about your inquiry..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
