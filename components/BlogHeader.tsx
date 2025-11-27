import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function BlogHeader() {
    return (
        <header className="w-full">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between">
                    <Link href="/" className="hover:opacity-70 transition-opacity">
                        <h1 className="text-2xl font-bold font-sans">Giovanni Gravili</h1>
                        <p className="text-sm text-muted-foreground mt-1">Work Portfolio & Insights</p>
                    </Link>
                    <nav className="flex gap-6">
                        <Link
                            href="/"
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            Posts
                        </Link>
                        <Link
                            href="/about"
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            About
                        </Link>
                    </nav>
                </div>
            </div>
            <Separator />
        </header>
    );
}
