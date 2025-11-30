import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { ChevronDownIcon } from './ChevronDownIcon.tsx';

interface CollapsibleCardProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden">
            <button
                className="w-full flex justify-between items-center text-left"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                {children}
            </div>
        </Card>
    );
};