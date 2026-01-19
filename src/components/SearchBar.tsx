import { useState, useEffect, useRef } from 'preact/hooks';
import type { ItemWithType } from '../lib/schema';

interface Props {
  initialQuery?: string;
  onSearch?: (results: ItemWithType[]) => void;
  placeholder?: string;
}

export default function SearchBar({ initialQuery = '', onSearch, placeholder = 'Search your collection...' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ItemWithType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data.items || []);
        setIsOpen(true);
        if (onSearch) {
          onSearch(data.items || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  const getItemUrl = (item: ItemWithType) => {
    const type = item.collection_type_name?.toLowerCase() || 'cards';
    return `/${type}/${item.id}`;
  };

  return (
    <div ref={containerRef} class="relative">
      <form onSubmit={handleSubmit}>
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            class="input pl-10 pr-10"
            placeholder={placeholder}
          />
          {loading && (
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg class="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div class="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {results.map(item => (
            <a
              key={item.id}
              href={getItemUrl(item)}
              class="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              {item.image_path ? (
                <img
                  src={item.image_path}
                  alt={item.name}
                  class="w-12 h-16 object-cover rounded"
                />
              ) : (
                <div class="w-12 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">{item.name}</div>
                <div class="text-sm text-gray-500">
                  {item.collection_type_name}
                  {item.year && ` - ${item.year}`}
                </div>
              </div>
            </a>
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            class="block p-3 text-center text-primary-600 hover:bg-primary-50 font-medium border-t border-gray-100"
          >
            View all results
          </a>
        </div>
      )}
    </div>
  );
}
