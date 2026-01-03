// src/components/Input.tsx
import React, { InputHTMLAttributes } from 'react';

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <input className={`input ${className}`} {...props} />
);
