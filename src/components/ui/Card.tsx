import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'rounded-xl transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'glass',
        strong: 'glass-strong',
      },
      hover: {
        true: 'hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, hover, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
