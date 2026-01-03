// src/components/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

export const Button = ({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button className={`btn ${className}`} {...props}>
        {children}
    </button>
);
