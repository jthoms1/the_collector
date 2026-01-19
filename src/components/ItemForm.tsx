import { useState, useEffect } from 'preact/hooks';
import type { ItemWithType, CollectionType } from '../lib/schema';

interface Props {
  item?: ItemWithType;
  collectionTypeId?: number;
  onSuccess?: (item: ItemWithType) => void;
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

const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'SGC', 'CSG'];

export default function ItemForm({ item, collectionTypeId, onSuccess }: Props) {
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_path || null);

  const [formData, setFormData] = useState({
    collection_type_id: item?.collection_type_id || collectionTypeId || 1,
    name: item?.name || '',
    year: item?.year?.toString() || '',
    publisher: item?.publisher || '',
    series: item?.series || '',
    issue_number: item?.issue_number || '',
    variant: item?.variant || '',
    condition_grade: item?.condition_grade || '',
    professional_grade: item?.professional_grade?.toString() || '',
    grading_company: item?.grading_company || '',
    cert_number: item?.cert_number || '',
    purchase_price: item?.purchase_price?.toString() || '',
    purchase_date: item?.purchase_date || '',
    estimated_value: item?.estimated_value?.toString() || '',
    image_path: item?.image_path || '',
    notes: item?.notes || ''
  });

  useEffect(() => {
    fetch('/api/types')
      .then(res => res.json())
      .then(setCollectionTypes)
      .catch(console.error);
  }, []);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    setFormData(prev => ({
      ...prev,
      [target.name]: target.value
    }));
  };

  const handleImageUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const typeName = collectionTypes.find(t => t.id === formData.collection_type_id)?.name || 'Cards';
    formDataUpload.append('type', typeName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.path) {
        setFormData(prev => ({ ...prev, image_path: data.path }));
        setImagePreview(data.path);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      collection_type_id: formData.collection_type_id,
      name: formData.name,
      year: formData.year ? parseInt(formData.year) : null,
      publisher: formData.publisher || null,
      series: formData.series || null,
      issue_number: formData.issue_number || null,
      variant: formData.variant || null,
      condition_grade: formData.condition_grade || null,
      professional_grade: formData.professional_grade ? parseFloat(formData.professional_grade) : null,
      grading_company: formData.grading_company || null,
      cert_number: formData.cert_number || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      purchase_date: formData.purchase_date || null,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      image_path: formData.image_path || null,
      notes: formData.notes || null
    };

    try {
      const url = item ? `/api/items/${item.id}` : '/api/items';
      const method = item ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save item');
      }

      const savedItem = await res.json();

      if (onSuccess) {
        onSuccess(savedItem);
      } else {
        const typeName = collectionTypes.find(t => t.id === savedItem.collection_type_id)?.name?.toLowerCase() || 'cards';
        window.location.href = `/${typeName}/${savedItem.id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-8">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div class="card p-6">
        <h3 class="section-title mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="label" for="collection_type_id">Collection Type</label>
            <select
              id="collection_type_id"
              name="collection_type_id"
              value={formData.collection_type_id}
              onChange={handleChange}
              class="input"
              required
            >
              {collectionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="label" for="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onInput={handleChange}
              class="input"
              required
              placeholder="e.g., 1989 Ken Griffey Jr. Rookie"
            />
          </div>

          <div>
            <label class="label" for="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onInput={handleChange}
              class="input"
              min="1800"
              max="2100"
              placeholder="e.g., 1989"
            />
          </div>

          <div>
            <label class="label" for="publisher">Publisher</label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onInput={handleChange}
              class="input"
              placeholder="e.g., Donruss, Marvel, DC"
            />
          </div>

          <div>
            <label class="label" for="series">Series</label>
            <input
              type="text"
              id="series"
              name="series"
              value={formData.series}
              onInput={handleChange}
              class="input"
              placeholder="e.g., The Rookies, Amazing Spider-Man"
            />
          </div>

          <div>
            <label class="label" for="issue_number">Issue/Card Number</label>
            <input
              type="text"
              id="issue_number"
              name="issue_number"
              value={formData.issue_number}
              onInput={handleChange}
              class="input"
              placeholder="e.g., 33, 129"
            />
          </div>

          <div class="md:col-span-2">
            <label class="label" for="variant">Variant</label>
            <input
              type="text"
              id="variant"
              name="variant"
              value={formData.variant}
              onInput={handleChange}
              class="input"
              placeholder="e.g., Gold Foil, First Print"
            />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="section-title mb-4">Condition & Grading</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="label" for="condition_grade">Condition (Raw)</label>
            <select
              id="condition_grade"
              name="condition_grade"
              value={formData.condition_grade}
              onChange={handleChange}
              class="input"
            >
              <option value="">Select condition...</option>
              {CONDITION_GRADES.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="label" for="grading_company">Grading Company</label>
            <select
              id="grading_company"
              name="grading_company"
              value={formData.grading_company}
              onChange={handleChange}
              class="input"
            >
              <option value="">Not professionally graded</option>
              {GRADING_COMPANIES.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="label" for="professional_grade">Professional Grade</label>
            <input
              type="number"
              id="professional_grade"
              name="professional_grade"
              value={formData.professional_grade}
              onInput={handleChange}
              class="input"
              step="0.5"
              min="1"
              max="10"
              placeholder="e.g., 9.5"
            />
          </div>

          <div>
            <label class="label" for="cert_number">Certification Number</label>
            <input
              type="text"
              id="cert_number"
              name="cert_number"
              value={formData.cert_number}
              onInput={handleChange}
              class="input"
              placeholder="e.g., 12345678"
            />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="section-title mb-4">Value & Purchase Info</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="label" for="purchase_price">Purchase Price ($)</label>
            <input
              type="number"
              id="purchase_price"
              name="purchase_price"
              value={formData.purchase_price}
              onInput={handleChange}
              class="input"
              step="0.01"
              min="0"
              placeholder="e.g., 150.00"
            />
          </div>

          <div>
            <label class="label" for="purchase_date">Purchase Date</label>
            <input
              type="date"
              id="purchase_date"
              name="purchase_date"
              value={formData.purchase_date}
              onInput={handleChange}
              class="input"
            />
          </div>

          <div>
            <label class="label" for="estimated_value">Estimated Value ($)</label>
            <input
              type="number"
              id="estimated_value"
              name="estimated_value"
              value={formData.estimated_value}
              onInput={handleChange}
              class="input"
              step="0.01"
              min="0"
              placeholder="e.g., 500.00"
            />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="section-title mb-4">Image</h3>
        <div class="flex gap-6">
          <div class="flex-1">
            <label class="label" for="image">Upload Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
              class="input"
            />
            <p class="mt-2 text-sm text-gray-500">Supports JPEG, PNG, WebP, GIF (max 10MB)</p>
          </div>

          {imagePreview && (
            <div class="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                class="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div class="card p-6">
        <h3 class="section-title mb-4">Notes</h3>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onInput={handleChange}
          class="input min-h-[120px]"
          placeholder="Any additional notes about this item..."
        />
      </div>

      <div class="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          class="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          class="btn-primary"
        >
          {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
        </button>
      </div>
    </form>
  );
}
