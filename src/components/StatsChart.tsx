import { useEffect, useState } from 'preact/hooks';
import type { CollectionStats } from '../lib/schema';

export default function StatsChart() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class="animate-pulse space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="h-32 bg-peach rounded-panel border-3 border-brown/30" />
          <div class="h-32 bg-peach rounded-panel border-3 border-brown/30" />
          <div class="h-32 bg-peach rounded-panel border-3 border-brown/30" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const gain = stats.totalValue - stats.totalInvested;
  const gainPercent = stats.totalInvested > 0
    ? ((gain / stats.totalInvested) * 100).toFixed(1)
    : '0';

  const maxByType = Math.max(...stats.itemsByType.map(t => t.count), 1);

  return (
    <div class="space-y-6">
      {/* Summary Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card p-6">
          <div class="stat-label mb-1">Total Items</div>
          <div class="text-4xl font-display font-bold text-navy">{stats.totalItems}</div>
          <div class="mt-2 flex items-center gap-1 text-sm text-brown/60">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>in collection</span>
          </div>
        </div>

        <div class="card p-6">
          <div class="stat-label mb-1">Total Value</div>
          <div class="stat-value text-4xl">
            {formatCurrency(stats.totalValue)}
          </div>
          <div class="mt-2 flex items-center gap-1 text-sm text-brown/60">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>estimated</span>
          </div>
        </div>

        <div class="card p-6">
          <div class="stat-label mb-1">Gain/Loss</div>
          <div class={`text-4xl font-display font-bold ${gain >= 0 ? 'text-teal' : 'text-rust'}`}>
            {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
          </div>
          <div class={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${gain >= 0 ? 'bg-teal/10 text-teal' : 'bg-rust/10 text-rust'}`}>
            {gain >= 0 ? (
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {gain >= 0 ? '+' : ''}{gainPercent}%
          </div>
        </div>
      </div>

      {/* Items by Type */}
      {stats.itemsByType.length > 0 && (
        <div class="card p-6">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Items by Collection
          </h3>
          <div class="space-y-4">
            {stats.itemsByType.map(type => (
              <div key={type.name}>
                <div class="flex justify-between text-sm mb-2">
                  <span class="font-display font-semibold text-navy">{type.name}</span>
                  <span class="font-sans text-brown/70">{type.count} items</span>
                </div>
                <div class="h-3 bg-cream rounded-full overflow-hidden border-2 border-brown/30">
                  <div
                    class="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-500"
                    style={{ width: `${(type.count / maxByType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value by Condition */}
      {stats.valueByCondition.length > 0 && (
        <div class="card p-6">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Value by Condition
          </h3>
          <div class="divide-y-2 divide-dashed divide-brown/20">
            {stats.valueByCondition.slice(0, 5).map(item => (
              <div key={item.condition} class="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <span class="font-sans text-brown">{item.condition}</span>
                <span class="price-tag">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
