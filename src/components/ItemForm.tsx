import { useState, useEffect } from 'preact/hooks';
import type { ItemWithType, CollectionType, ImageOrientation, ItemImage } from '../lib/schema';

interface ItemWithOptionalImages extends ItemWithType {
  images?: ItemImage[];
}

interface Props {
  item?: ItemWithOptionalImages;
  collectionTypeId?: number;
  onSuccess?: (item: ItemWithType) => void;
}

interface ImageItem {
  id?: number;
  image_path: string;
  image_orientation: ImageOrientation;
  is_primary: boolean;
  display_order: number;
  thumbUrl: string;
  isNew?: boolean;
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

function getThumbUrl(imagePath: string, collectionType: string): string {
  if (!imagePath) return '';
  const ext = imagePath.lastIndexOf('.');
  if (ext === -1) return imagePath;
  const base = imagePath.slice(0, ext);
  return `${base}_thumb.jpeg`;
}

export default function ItemForm({ item, collectionTypeId, onSuccess }: Props) {
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Multi-image state
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (item?.images?.length) {
      return item.images.map((img, i) => ({
        id: img.id,
        image_path: img.image_path,
        image_orientation: img.image_orientation || 'portrait',
        is_primary: img.is_primary,
        display_order: img.display_order ?? i,
        thumbUrl: getThumbUrl(img.image_path, item.collection_type_name)
      }));
    }
    // Legacy: single image
    if (item?.image_path) {
      return [{
        image_path: item.image_path,
        image_orientation: item.image_orientation || 'portrait',
        is_primary: true,
        display_order: 0,
        thumbUrl: getThumbUrl(item.image_path, item.collection_type_name)
      }];
    }
    return [];
  });

  // Track removed image IDs for cleanup
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

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
    notes: item?.notes || '',
    key_information: item?.key_information || ''
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
    const files = target.files;
    if (!files?.length) return;

    setUploading(true);
    const typeName = collectionTypes.find(t => t.id === formData.collection_type_id)?.name || 'Cards';

    for (const file of Array.from(files)) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', typeName);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });
        const data = await res.json();

        if (data.path) {
          setImages(prev => {
            const newImage: ImageItem = {
              image_path: data.path,
              image_orientation: data.orientation || 'portrait',
              is_primary: prev.length === 0,
              display_order: prev.length,
              thumbUrl: data.thumbPath || data.path,
              isNew: true
            };
            return [...prev, newImage];
          });
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
    target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const removed = prev[index];
      if (removed.id) {
        setRemovedImageIds(ids => [...ids, removed.id!]);
      }

      const updated = prev.filter((_, i) => i !== index);
      // If removed image was primary, make first image primary
      if (removed.is_primary && updated.length > 0) {
        updated[0].is_primary = true;
      }
      // Recompute display_order
      return updated.map((img, i) => ({ ...img, display_order: i }));
    });
  };

  const handleSetPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setImages(prev => {
      const newImages = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newImages.length) return prev;
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      return newImages.map((img, i) => ({ ...img, display_order: i }));
    });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Get primary image for legacy fields (backward compatibility)
    const primaryImage = images.find(img => img.is_primary) || images[0];

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
      image_path: primaryImage?.image_path || null,
      image_orientation: primaryImage?.image_orientation || 'portrait',
      notes: formData.notes || null,
      key_information: formData.key_information || null
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

      // Handle removed images
      for (const imageId of removedImageIds) {
        await fetch(`/api/items/${savedItem.id}/images/${imageId}`, {
          method: 'DELETE'
        }).catch(console.error);
      }

      // Save new images
      for (const img of images) {
        if (img.isNew) {
          await fetch(`/api/items/${savedItem.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_path: img.image_path,
              image_orientation: img.image_orientation,
              is_primary: img.is_primary,
              display_order: img.display_order
            })
          }).catch(console.error);
        } else if (img.id) {
          // Update existing images (primary, order might have changed)
          await fetch(`/api/items/${savedItem.id}/images/${img.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_primary: img.is_primary,
              display_order: img.display_order
            })
          }).catch(console.error);
        }
      }

      if (onSuccess) {
        onSuccess(savedItem);
      } else {
        const typeName = collectionTypes.find(t => t.id === savedItem.collection_type_id)?.name || 'Cards';
        // Map collection type names to routes
        const routeMap: Record<string, string> = {
          'Sports Cards': 'cards',
          'Trading Cards': 'cards',
          'Comics': 'comics'
        };
        const route = routeMap[typeName] || 'cards';
        window.location.href = `/${route}/${savedItem.id}`;
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
        <div class="bg-rust/10 border border-rust/30 text-rust-dark px-4 py-3 rounded-panel">
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

          <div class="md:col-span-2">
            <label class="label" for="key_information">Key Information</label>
            <input
              type="text"
              id="key_information"
              name="key_information"
              value={formData.key_information}
              onInput={handleChange}
              class="input"
              placeholder="e.g., First appearance of Spawn, Key issue"
            />
            <p class="mt-1 text-sm text-brown/50 font-sans">
              Notable significance (first appearances, key issues, etc.)
            </p>
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
        <h3 class="section-title mb-4">Images</h3>

        {/* Image list */}
        {images.length > 0 && (
          <div class="space-y-3 mb-4">
            {images.map((img, index) => (
              <div key={img.image_path} class="flex items-center gap-4 p-3 bg-peach rounded-panel border border-brown/20">
                {/* Thumbnail */}
                <div class="w-16 h-20 flex-shrink-0 rounded-panel overflow-hidden bg-cream border border-brown/20">
                  <img src={img.thumbUrl} alt="" class="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    {img.is_primary && (
                      <span class="badge-teal text-xs">Primary</span>
                    )}
                    <span class="text-sm text-brown/70 truncate font-sans">
                      {img.image_path.split('/').pop()}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div class="flex items-center gap-1">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      class="p-2 text-brown/50 hover:text-gold transition-colors"
                      title="Set as primary"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                    class="p-2 text-brown/50 hover:text-navy disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    class="p-2 text-brown/50 hover:text-navy disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    class="p-2 text-brown/50 hover:text-rust transition-colors"
                    title="Remove"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload input */}
        <div>
          <label class="label" for="images">Add Images</label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            class="input"
            disabled={uploading}
          />
          <p class="mt-2 text-sm text-brown/50 font-sans">
            {uploading ? 'Uploading...' : 'Supports JPEG, PNG, WebP, GIF (max 10MB each). First image becomes primary.'}
          </p>
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
          disabled={loading || uploading}
          class="btn-primary"
        >
          {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
        </button>
      </div>
    </form>
  );
}
