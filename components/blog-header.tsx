'use client';

import Link from 'next/link';
import { Highlighter } from './ui/highlighter';

export function BlogHeader() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="w-full border-b-2 border-foreground pt-2">
            {/* Top bar with date only */}
            <div className="border-border">
                <div className="max-w-[1200px] mx-auto px-4 py-2">
                    <time className="text-sm text-muted-foreground font-medium">{today}</time>
                </div>
            </div>

            {/* Masthead - Portfolio style logo */}
            <div className="max-w-[1200px] mx-auto px-4 pb-4 text-left">
                <Link href="/" className="inline-block">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Giovanni Gravili&rsquo;s <Highlighter action="highlight" color="#ef444460" isView={false} animationDuration={800}>Work Portfolio</Highlighter> & Blog
                    </h1>
                </Link>
            </div>

            {/* Sections bar */}
            <div className="border-t border-border">
                <nav className="max-w-[1200px] mx-auto px-4">
                    <ul className="flex items-center justify-start tracking-wide gap-6 py-3 text-xs font-semibold overflow-x-auto">
                        <li><Link href="/" className="whitespace-nowrap">ALL POSTS</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">PROJECTS</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">INSIGHTS</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">TECHNOLOGY</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">DESIGN</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">RESEARCH</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">CASE STUDIES</Link></li>
                        <li><Link href="#" className="whitespace-nowrap">ABOUT</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
