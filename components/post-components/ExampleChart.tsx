"use client";

import React from 'react';

interface ExampleChartProps {
    title?: string;
}

export function ExampleChart({ title = "Data Visualization" }: ExampleChartProps) {
    const data = [
        { label: 'A', value: 30 },
        { label: 'B', value: 60 },
        { label: 'C', value: 45 },
        { label: 'D', value: 80 },
        { label: 'E', value: 55 },
    ];

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="my-8 p-6 border border-border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <span className="w-8 font-mono text-sm text-muted-foreground">
                            {item.label}
                        </span>
                        <div className="flex-1 h-8 bg-muted rounded-sm overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 hover:opacity-80"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                        </div>
                        <span className="w-12 text-right font-mono text-sm text-foreground">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
