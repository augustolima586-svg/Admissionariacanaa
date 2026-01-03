// src/components/Card.tsx
import React from 'react';

export const Card = ({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) => (
    <div className={`card ${className}`} {...props}>{children}</div>
);
