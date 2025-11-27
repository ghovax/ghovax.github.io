import Link from 'next/link';

export function BlogHeader() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="w-full border-b-2 border-foreground">
            {/* Top bar with date only */}
            <div className="border-b border-border">
                <div className="max-w-[1200px] mx-auto px-4 py-2">
                    <time className="text-xs font-medium">{today}</time>
                </div>
            </div>

            {/* Masthead - The New York Times style logo */}
            <div className="max-w-[1200px] mx-auto px-4 py-4 text-left">
                <Link href="/" className="inline-block">
                    <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'Old English Text MT, Georgia, serif' }}>
                        The New York Times
                    </h1>
                </Link>
            </div>

            {/* Sections bar */}
            <div className="border-t border-border">
                <nav className="max-w-[1200px] mx-auto px-4">
                    <ul className="flex items-center justify-start gap-6 py-2 text-xs font-semibold overflow-x-auto">
                        <li><Link href="/" className="hover:underline whitespace-nowrap">TOP NEWS</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">WORLD</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">U.S.</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">POLITICS</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">BUSINESS</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">TECHNOLOGY</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">OPINION</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">ARTS</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">SCIENCE</Link></li>
                        <li><Link href="#" className="hover:underline whitespace-nowrap">SPORTS</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
