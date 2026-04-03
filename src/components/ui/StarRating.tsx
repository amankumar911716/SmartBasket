'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface StarRatingProps {
  /** Current rating value (0 – maxStars, supports decimals like 4.5) */
  rating: number;
  /** Maximum number of stars rendered (default 5) */
  maxStars?: number;
  /** Visual size of each star */
  size?: StarSize;
  /** When true the user can hover & click to set a rating */
  interactive?: boolean;
  /** Callback fired when a user clicks a star */
  onRate?: (rating: number) => void;
  /** Show the numeric rating next to the stars */
  showValue?: boolean;
  /** Optional review‑count displayed as "(count)" */
  count?: number;
  /** Additional CSS classes applied to the root element */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SIZE_MAP: Record<StarSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

const TEXT_SIZE_MAP: Record<StarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
};

/**
 * Returns the "fill level" of a star at the given index (0‑based).
 *   0  → empty
 *   1  → fully filled
 *   0‑1→ partially filled (e.g. 0.5 for a half‑star)
 */
function starFillLevel(rating: number, index: number): number {
  if (rating >= index + 1) return 1;
  if (rating > index) return rating - index;
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRate,
  showValue = false,
  count,
  className,
}: StarRatingProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  /* Clamp rating to [0, maxStars] */
  const clampedRating = Math.max(0, Math.min(rating, maxStars));

  /* Determine which fill level to render for each star.
     In interactive mode the hovered preview takes precedence. */
  function getFillLevel(index: number): number {
    if (interactive && hoveredIndex !== null) {
      // Hover preview: fully fill up to and including hoveredIndex
      return index <= hoveredIndex ? 1 : 0;
    }
    return starFillLevel(clampedRating, index);
  }

  /* Event handlers (interactive mode) */
  const handleMouseEnter = React.useCallback(
    (index: number) => {
      if (interactive) setHoveredIndex(index);
    },
    [interactive],
  );

  const handleMouseLeave = React.useCallback(() => {
    if (interactive) setHoveredIndex(null);
  }, [interactive]);

  const handleClick = React.useCallback(
    (index: number) => {
      if (interactive && onRate) {
        onRate(index + 1);
      }
    },
    [interactive, onRate],
  );

  /* Keyboard accessibility */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!interactive) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(clampedRating + 1, maxStars);
        onRate?.(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        const prev = Math.max(clampedRating - 1, 0);
        onRate?.(prev);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRate?.(Math.round(clampedRating));
      }
    },
    [interactive, clampedRating, maxStars, onRate],
  );

  const iconSize = SIZE_MAP[size];
  const textSize = TEXT_SIZE_MAP[size];

  /* Display rating — in interactive hover mode show the preview value */
  const displayRating =
    interactive && hoveredIndex !== null ? hoveredIndex + 1 : clampedRating;

  return (
    <div
      ref={containerRef}
      role={interactive ? 'slider' : 'img'}
      aria-label={
        interactive
          ? `Rating: ${clampedRating} out of ${maxStars}`
          : `Rated ${clampedRating} out of ${maxStars}`
      }
      aria-valuenow={interactive ? clampedRating : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? maxStars : undefined}
      aria-readonly={!interactive}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={cn(
        'inline-flex items-center gap-0.5',
        interactive && 'cursor-pointer',
        className,
      )}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      {/* Stars */}
      {Array.from({ length: maxStars }, (_, i) => {
        const fill = getFillLevel(i);
        const isFilled = fill === 1;
        const isHalf = fill > 0 && fill < 1;

        return (
          <span
            key={i}
            className={cn(
              /* Touch‑friendly 44×44 tap target when interactive */
              interactive && 'inline-flex items-center justify-center p-1.5 -m-1.5',
              interactive && 'transition-transform duration-150',
            )}
            style={{ minWidth: interactive ? 44 : undefined, minHeight: interactive ? 44 : undefined }}
            onMouseEnter={() => handleMouseEnter(i)}
            onClick={() => handleClick(i)}
          >
            {/* Filled layer (below) + Empty layer (above) with clip for half‑star support */}
            <span
              className={cn(
                'relative inline-flex items-center justify-center',
                interactive &&
                  'hover:scale-125 transition-transform duration-150',
              )}
            >
              {/* Base (empty) star */}
              <Star
                size={iconSize}
                className={cn(
                  'transition-colors duration-150',
                  isFilled
                    ? 'text-amber-400'
                    : isHalf
                      ? 'text-amber-400/50'
                      : 'text-gray-300',
                )}
                fill={
                  isFilled
                    ? 'currentColor'
                    : isHalf
                      ? 'currentColor'
                      : 'none'
                }
                strokeWidth={isFilled ? 0 : isHalf ? 0 : 1.5}
                aria-hidden="true"
              />
            </span>
          </span>
        );
      })}

      {/* Numeric value badge */}
      {showValue && (
        <span
          className={cn(
            'ml-1 inline-flex items-center font-medium tabular-nums text-amber-600',
            textSize,
          )}
        >
          {displayRating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {count !== undefined && (
        <span
          className={cn(
            'ml-0.5 inline-flex items-center text-muted-foreground tabular-nums',
            textSize,
          )}
        >
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

export default StarRating;
export { StarRating };
