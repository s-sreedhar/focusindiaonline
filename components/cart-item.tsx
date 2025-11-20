'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '@/lib/cart-store';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Image */}
      <div className="flex-shrink-0 w-24 h-32 bg-secondary rounded-lg overflow-hidden">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.title}
          width={96}
          height={128}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold line-clamp-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.author}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-bold text-primary">₹{item.price}</span>
          {item.originalPrice && (
            <>
              <span className="text-sm line-through text-muted-foreground">
                ₹{item.originalPrice}
              </span>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                -{discount}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quantity and Actions */}
      <div className="flex flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Item Total */}
        <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
      </div>
    </div>
  );
}
