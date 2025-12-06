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
    <div className="flex gap-3 sm:gap-4 py-4 border-b last:border-b-0">
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-32 bg-secondary rounded-lg overflow-hidden">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.title}
          width={96}
          height={128}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Details & Actions Container */}
      <div className="flex flex-1 flex-col sm:flex-row sm:justify-between">
        <div className="flex-1 min-w-0 mr-0 sm:mr-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{item.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive h-8 w-8 -mr-2 -mt-2 sm:hidden"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{item.author}</p>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-bold text-primary text-sm sm:text-base">₹{item.price}</span>
            {item.originalPrice && (
              <>
                <span className="text-xs line-through text-muted-foreground">
                  ₹{item.originalPrice}
                </span>
                <span className="text-[10px] sm:text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                  -{discount}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between mt-4 sm:mt-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 border rounded-md h-8 sm:h-9">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-end">
            <p className="font-semibold text-sm sm:text-base">₹{(item.price * item.quantity).toLocaleString()}</p>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hidden sm:flex h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
