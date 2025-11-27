import Link from 'next/link';

export function BlogHeader() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="w-full pt-4 border-border">
            {/* Masthead */}
            <div className="max-w-4xl mx-auto px-6 pt-10 pb-4">
                <Link href="/" className="transition-all">
                    <h1 className="text-3xl font-bold mb-1">
                        Giovanni Gravili
                    </h1>
                    <p className="text-sm text-muted-foreground">Work Portfolio & Insights</p>
                </Link>

                {/* Navigation */}
                <nav className="flex gap-6 mt-4 pt-4 text-sm uppercase">
                    <Link
                        href="/"
                        className="font-medium transition-all"
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        className="font-medium transition-all"
                    >
                        About
                    </Link>
                </nav>
            </div>
        </header>
    );
}
