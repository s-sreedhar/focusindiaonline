'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
    title: string;
    text?: string;
    url: string;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
}

export function ShareButton({
    title,
    text,
    url,
    className,
    variant = "outline",
    size = "icon",
    children
}: ShareButtonProps) {

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent parent clicks (like card navigation)

        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: text || `Check out ${title} on Focus India Online`,
                    url,
                });
            } catch (error) {
                // User cancelled or share failed, fallback silently or just log
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
            } catch (error) {
                toast.error('Failed to copy link');
            }
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleShare}
            title="Share"
        >
            {children || <Share2 className="w-4 h-4" />}
        </Button>
    );
}
