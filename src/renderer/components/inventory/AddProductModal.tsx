import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { api } from '../../lib/api'
import type { Product, Category } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  cost_price: z.coerce.number().min(0).default(0),
  stock_quantity: z.coerce.number().min(0).default(0),
  low_stock_alert: z.coerce.number().min(0).default(5),
  category_id: z.coerce.number().optional(),
  description: z.string().optional()
})

type FormData = z.infer<typeof schema>
interface Props { open: boolean; product?: Product; onClose: () => void }

const CATEGORY_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

const s: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' },
  select: { background: 'var(--color-background)', border: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family)', fontSize: 16, padding: '10px 14px', width: '100%', outline: 'none', cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' },
}

export function AddProductModal({ open, product, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[4])
  const [showNewCat, setShowNewCat] = useState(false)
  const [savingCat, setSavingCat] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)
  const isEdit = Boolean(product)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const loadCategories = () => api.categories.list().then(setCategories)
  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    if (open && product) {
      reset({ name: product.name, barcode: product.barcode ?? '', sku: product.sku ?? '', price: product.price / 100, cost_price: product.cost_price / 100, stock_quantity: product.stock_quantity, low_stock_alert: product.low_stock_alert, category_id: product.category_id ?? undefined, description: product.description ?? '' })
      setImagePath(product.image_path ?? null)
    }
    if (open && !product) { reset({}); setImagePath(null) }
    setShowNewCat(false); setNewCatName(''); setCatError(null)
  }, [open, product])

  const handlePickImage = async () => {
    const path = await api.dialog.selectImage()
    if (path) setImagePath(path)
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setSavingCat(true); setCatError(null)
    try {
      const cat = await api.categories.create(newCatName.trim(), newCatColor)
      await loadCategories()
      setValue('category_id', cat.id)
      setNewCatName(''); setShowNewCat(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setCatError(msg.includes('UNIQUE') ? `"${newCatName.trim()}" already exists` : 'Failed to create category')
    } finally { setSavingCat(false) }
  }

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, price: Math.round(data.price * 100), cost_price: Math.round((data.cost_price ?? 0) * 100), category_id: data.category_id || undefined, sku: data.sku || undefined, image_path: imagePath ?? undefined }
    if (isEdit && product) await api.products.update(product.id, payload)
    else await api.products.create(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(onSubmit)}>{isEdit ? 'Save Changes' : 'Add Product'}</Button></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <Input label="Product Name *" {...register('name')} error={errors.name?.message} />
        <Input label="Barcode" {...register('barcode')} placeholder="Scan or type barcode" />
        <Input label="SKU" {...register('sku')} placeholder="Stock keeping unit" />
        <div style={s.grid2}>
          <Input label="Selling Price *" type="number" step="0.01" min="0" {...register('price')} error={errors.price?.message} />
          <Input label="Cost Price" type="number" step="0.01" min="0" {...register('cost_price')} />
        </div>
        <div style={s.grid2}>
          <Input label="Stock Quantity" type="number" min="0" {...register('stock_quantity')} />
          <Input label="Low Stock Alert" type="number" min="0" {...register('low_stock_alert')} />
        </div>

        {/* Category */}
        <div style={s.field}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={s.label}>Category</label>
            <button type="button" onClick={() => setShowNewCat(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
              {showNewCat ? '✕ Cancel' : '+ New Category'}
            </button>
          </div>
          {!showNewCat && (
            <select {...register('category_id')} style={s.select}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {showNewCat && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--color-surface-high)', borderRadius: 'var(--radius-md)', border: 'var(--border)' }}>
              <input value={newCatName} onChange={e => { setNewCatName(e.target.value); setCatError(null) }} placeholder="Category name"
                style={{ background: 'var(--color-background)', border: catError ? '1.5px solid var(--color-error)' : 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family)', fontSize: 14, padding: '8px 12px', outline: 'none' }} />
              {catError && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{catError}</span>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORY_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewCatColor(c)}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: newCatColor === c ? '2.5px solid var(--color-on-surface)' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: 'none' }} />
                ))}
              </div>
              <Button onClick={handleCreateCategory} disabled={savingCat || !newCatName.trim()} size="sm">
                {savingCat ? 'Creating…' : 'Create Category'}
              </Button>
            </div>
          )}
        </div>

        {/* Image upload */}
        <div style={s.field}>
          <label style={s.label}>Product Image</label>
          {imagePath ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={`product-image:///${imagePath}`} alt="Product"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: 'var(--border)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button type="button" onClick={handlePickImage}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, textAlign: 'left' }}>
                  Change Image
                </button>
                <button type="button" onClick={() => setImagePath(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'left' }}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={handlePickImage}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 100, border: '1.5px dashed var(--color-outline)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-high)', cursor: 'pointer', color: 'var(--color-muted)', transition: 'border-color 150ms, color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-outline)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}>
              <Camera size={24} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Click to select image</span>
              <span style={{ fontSize: 11 }}>PNG, JPG, WEBP</span>
            </button>
          )}
        </div>

        <Input label="Description" {...register('description')} placeholder="Optional product description" />
      </div>
    </Modal>
  )
}
