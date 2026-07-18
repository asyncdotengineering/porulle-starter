import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate' ? (accurateSizes[i] ?? 'Bytest') : (sizes[i] ?? 'Bytes')
  }`;
}

/** Page-number list with ellipses for the data-table pagination control. */
export function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const maxVisiblePages = 5;
  const rangeWithDots: (number | string)[] = [];

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) rangeWithDots.push(i);
  } else {
    rangeWithDots.push(1);
    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) rangeWithDots.push(i);
      rangeWithDots.push('...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      rangeWithDots.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) rangeWithDots.push(i);
    } else {
      rangeWithDots.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) rangeWithDots.push(i);
      rangeWithDots.push('...', totalPages);
    }
  }
  return rangeWithDots;
}
