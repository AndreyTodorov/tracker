import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'strong';
  hover?: boolean;
}

export const Card = ({ children, variant = 'default', hover = false, className = '', ...props }: CardProps) => {
  const baseStyles = 'rounded-xl transition-all duration-300';
  const variants = {
    default: 'glass',
    strong: 'glass-strong',
  };

  const hoverStyles = hover ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
