
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-content border border-border rounded-lg shadow-sm p-4 ${className || ''}`}>
            {children}
        </div>
    );
};
