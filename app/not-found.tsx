import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4 text-center">
            <div className="space-y-6 max-w-md mx-auto">
                <h1 className="text-9xl font-bold text-primary/20">404</h1>
                <h2 className="text-3xl font-bold text-foreground">Page Not Found</h2>
                <p className="text-muted-foreground text-lg">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Button asChild size="lg" className="rounded-full px-8">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
