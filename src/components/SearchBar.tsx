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
    const typeName = item.collection_type_name || 'Cards';
    const isCardType = typeName === 'Sports Cards' || typeName === 'Trading Cards';
    return isCardType ? `/cards/${item.id}` : `/comics/${item.id}`;
  };

  const getThumbnailClass = (item: ItemWithType) => {
    const orientation = item.image_orientation || 'portrait';
    if (orientation === 'landscape') return 'w-16 h-12';
    if (orientation === 'square') return 'w-12 h-12';
    return 'w-12 h-16';
  };

  const getThumbUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    const lastDot = imagePath.lastIndexOf('.');
    if (lastDot === -1) return imagePath;
    return `${imagePath.slice(0, lastDot)}_thumb.jpeg`;
  };

  return (
    <div ref={containerRef} class="relative">
      <form onSubmit={handleSubmit}>
        <div class="relative">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            class="input pl-12 pr-12"
            placeholder={placeholder}
          />
          {loading && (
            <div class="absolute right-4 top-1/2 -translate-y-1/2">
              <svg class="animate-spin w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div class="absolute top-full left-0 right-0 mt-2 bg-peach-light rounded-panel shadow-comic border border-brown/30 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {results.map(item => (
            <a
              key={item.id}
              href={getItemUrl(item)}
              class="flex items-center gap-3 p-3 hover:bg-peach transition-colors border-b-2 border-dashed border-brown/20 last:border-b-0"
            >
              {item.image_path ? (
                <img
                  src={getThumbUrl(item.image_path) || item.image_path}
                  alt={item.name}
                  class={`${getThumbnailClass(item)} object-contain rounded-panel border border-brown/30 bg-peach`}
                />
              ) : (
                <div class={`${getThumbnailClass(item)} bg-cream rounded-panel flex items-center justify-center text-brown/30 border border-brown/30`}>
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div class="flex-1 min-w-0">
                <div class="font-display font-semibold text-navy truncate">{item.name}</div>
                <div class="text-sm text-brown/60 font-sans">
                  {item.collection_type_name}
                  {item.year && ` - ${item.year}`}
                </div>
              </div>
            </a>
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            class="block p-3 text-center text-teal hover:text-teal-dark hover:bg-peach font-display font-semibold border-t-2 border-brown/20 transition-colors"
          >
            View all results
          </a>
        </div>
      )}
    </div>
  );
}
