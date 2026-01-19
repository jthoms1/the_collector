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
        <div class="h-32 bg-gray-200 rounded-lg" />
        <div class="h-32 bg-gray-200 rounded-lg" />
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
          <div class="text-sm text-gray-500 mb-1">Total Items</div>
          <div class="text-3xl font-bold text-gray-900">{stats.totalItems}</div>
        </div>

        <div class="card p-6">
          <div class="text-sm text-gray-500 mb-1">Total Value</div>
          <div class="text-3xl font-bold text-primary-600">
            {formatCurrency(stats.totalValue)}
          </div>
        </div>

        <div class="card p-6">
          <div class="text-sm text-gray-500 mb-1">Gain/Loss</div>
          <div class={`text-3xl font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
          </div>
          <div class={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : ''}{gainPercent}%
          </div>
        </div>
      </div>

      {/* Items by Type */}
      {stats.itemsByType.length > 0 && (
        <div class="card p-6">
          <h3 class="section-title mb-4">Items by Collection</h3>
          <div class="space-y-3">
            {stats.itemsByType.map(type => (
              <div key={type.name}>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium">{type.name}</span>
                  <span class="text-gray-500">{type.count}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all"
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
          <h3 class="section-title mb-4">Value by Condition</h3>
          <div class="space-y-2">
            {stats.valueByCondition.slice(0, 5).map(item => (
              <div key={item.condition} class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span class="text-gray-700">{item.condition}</span>
                <span class="font-semibold text-gray-900">
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
