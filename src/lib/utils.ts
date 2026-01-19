export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function getImageUrl(imagePath: string | null | undefined, collectionType: string): string {
  if (!imagePath) {
    return '/images/placeholder.svg';
  }
  // If it's already a full path starting with /, return as is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  // Otherwise, construct the path based on collection type
  const folder = collectionType.toLowerCase() === 'cards' ? 'Cards' : 'Comics';
  return `/${folder}/${imagePath}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function getConditionColor(condition: string | null | undefined): string {
  if (!condition) return 'bg-gray-100 text-gray-600';

  const normalized = condition.toLowerCase();
  if (normalized.includes('mint') && !normalized.includes('near')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (normalized.includes('near mint') || normalized.includes('nm')) {
    return 'bg-green-100 text-green-800';
  }
  if (normalized.includes('very fine') || normalized.includes('vf')) {
    return 'bg-lime-100 text-lime-800';
  }
  if (normalized.includes('fine') || normalized === 'f') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (normalized.includes('very good') || normalized.includes('vg')) {
    return 'bg-orange-100 text-orange-800';
  }
  if (normalized.includes('good') || normalized === 'g') {
    return 'bg-amber-100 text-amber-800';
  }
  if (normalized.includes('fair')) {
    return 'bg-red-100 text-red-800';
  }
  if (normalized.includes('poor')) {
    return 'bg-red-200 text-red-900';
  }
  return 'bg-gray-100 text-gray-600';
}

export function getProfessionalGradeColor(grade: number | null | undefined): string {
  if (grade == null) return 'bg-gray-100 text-gray-600';

  if (grade >= 9.5) return 'bg-emerald-100 text-emerald-800';
  if (grade >= 9) return 'bg-green-100 text-green-800';
  if (grade >= 8) return 'bg-lime-100 text-lime-800';
  if (grade >= 7) return 'bg-yellow-100 text-yellow-800';
  if (grade >= 6) return 'bg-orange-100 text-orange-800';
  if (grade >= 5) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
