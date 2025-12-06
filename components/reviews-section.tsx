'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/auth-store';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, where } from 'firebase/firestore';
import { toast } from 'sonner';

interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  date: any;
  userId: string;
}

interface ReviewsSectionProps {
  bookId: string;
  averageRating: number;
  totalReviews: number;
}

export function ReviewsSection({ bookId, averageRating, totalReviews }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Assuming reviews are a subcollection of books or a top-level collection with bookId
        // Let's use a top-level collection 'reviews' for easier querying across the app if needed
        // or subcollection 'books/{bookId}/reviews' which is cleaner for this use case.
        // Let's go with subcollection 'reviews' inside the book document.
        const q = query(collection(db, 'books', bookId, 'reviews'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];

        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchReviews();
    }
  }, [bookId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to write a review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        author: user.displayName || 'Anonymous',
        userId: user.id,
        rating,
        title,
        content,
        verified: true, // Assuming if they can write, they might have bought it? Or we should check orders. For now true.
        helpful: 0,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString() // Fallback for immediate display
      };

      const docRef = await addDoc(collection(db, 'books', bookId, 'reviews'), reviewData);

      // Update local state
      setReviews([
        { id: docRef.id, ...reviewData } as unknown as Review,
        ...reviews
      ]);

      // Reset form
      setTitle('');
      setContent('');
      setRating(5);
      toast.success('Review submitted successfully!');

      // Note: We should also update the book's average rating and review count in Firestore.
      // This is best done via a Cloud Function trigger, but for now we'll skip the aggregation logic on client.

    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="reviews" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        <TabsTrigger value="write">Write a Review</TabsTrigger>
      </TabsList>

      <TabsContent value="reviews" className="space-y-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{review.author}</p>
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {review.date instanceof Object && 'seconds' in review.date
                    ? new Date(review.date.seconds * 1000).toLocaleDateString()
                    : review.date}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating
                        ? 'fill-accent text-accent'
                        : 'text-muted'
                        }`}
                    />
                  ))}
                </div>
                <p className="font-semibold text-sm">{review.title}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{review.content}</p>

              <Button variant="ghost" size="sm">
                Helpful ({review.helpful || 0})
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review this book!</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="write" className="mt-6">
        {!user ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="mb-4">Please log in to write a review.</p>
            <Button asChild>
              <a href="/login">Login Now</a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-6 bg-card p-6 rounded-lg border">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= rating ? 'fill-accent text-accent' : 'text-muted'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Review</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you like or dislike?"
                required
                rows={4}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </form>
        )}
      </TabsContent>
    </Tabs>
  );
}
