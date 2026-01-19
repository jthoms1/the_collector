import { useState, useEffect } from 'preact/hooks';
import type { CollectionType } from '../lib/schema';

interface FilterValues {
  type?: number;
  minValue?: number;
  maxValue?: number;
  condition?: string;
  year?: number;
}

interface Props {
  initialFilters?: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
}

const CONDITION_GRADES = [
  'Mint',
  'Near Mint (NM)',
  'Very Fine (VF)',
  'Fine (F)',
  'Very Good (VG)',
  'Good (G)',
  'Fair',
  'Poor'
];

export default function FilterPanel({ initialFilters = {}, onFilterChange }: Props) {
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/types')
      .then(res => res.json())
      .then(setCollectionTypes)
      .catch(console.error);
  }, []);

  const handleChange = (key: keyof FilterValues, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div class="card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        class="w-full flex items-center justify-between p-4"
      >
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="font-medium">Filters</span>
          {hasFilters && (
            <span class="badge bg-primary-100 text-primary-700">Active</span>
          )}
        </div>
        <svg
          class={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div class="px-4 pb-4 border-t border-gray-100 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="label">Collection Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleChange('type', (e.target as HTMLSelectElement).value ? parseInt((e.target as HTMLSelectElement).value) : undefined)}
                class="input"
              >
                <option value="">All Types</option>
                {collectionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="label">Condition</label>
              <select
                value={filters.condition || ''}
                onChange={(e) => handleChange('condition', (e.target as HTMLSelectElement).value || undefined)}
                class="input"
              >
                <option value="">Any Condition</option>
                {CONDITION_GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="label">Min Value ($)</label>
              <input
                type="number"
                value={filters.minValue || ''}
                onInput={(e) => handleChange('minValue', (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined)}
                class="input"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="label">Max Value ($)</label>
              <input
                type="number"
                value={filters.maxValue || ''}
                onInput={(e) => handleChange('maxValue', (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined)}
                class="input"
                min="0"
                step="0.01"
                placeholder="No limit"
              />
            </div>

            <div>
              <label class="label">Year</label>
              <input
                type="number"
                value={filters.year || ''}
                onInput={(e) => handleChange('year', (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined)}
                class="input"
                min="1800"
                max="2100"
                placeholder="Any year"
              />
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              class="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
