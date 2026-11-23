import { CATEGORIES } from '@/lib/categories';
import type { Category } from '@/lib/types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'xs' | 'sm';
  skewed?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'xs',
  skewed = false,
  className = '',
}: CategoryBadgeProps) {
  const meta = CATEGORIES[category] ?? CATEGORIES.GAMES;
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider leading-tight ${sizeClass} ${
        skewed ? '-skew-x-6' : 'rounded-sm'
      } ${className}`}
      style={{
        backgroundColor: meta.fillVar,
        color: meta.inkOnFillVar,
      }}
    >
      <span className={skewed ? 'skew-x-6' : ''}>{meta.shortLabel}</span>
    </span>
  );
}
