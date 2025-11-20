'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  date: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ReviewsSection({ reviews, averageRating, totalReviews }: ReviewsSectionProps) {
  return (
    <Tabs defaultValue="reviews" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
        <TabsTrigger value="rating">Rating</TabsTrigger>
      </TabsList>

      <TabsContent value="reviews" className="space-y-6">
        {reviews.length > 0 ? (
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
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
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
                Helpful ({review.helpful})
              </Button>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
        )}
      </TabsContent>

      <TabsContent value="rating" className="space-y-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</p>
            <div className="flex justify-center my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating)
                      ? 'fill-accent text-accent'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{totalReviews} reviews</p>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-8">{rating}★</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{
                      width: `${(Math.random() * 100).toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
