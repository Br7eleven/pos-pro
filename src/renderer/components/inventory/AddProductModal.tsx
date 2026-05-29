import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { api } from '../../lib/api'
import type { Product, Category } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  cost_price: z.coerce.number().min(0).default(0),
  stock_quantity: z.coerce.number().min(0).default(0),
  low_stock_alert: z.coerce.number().min(0).default(5),
  category_id: z.coerce.number().optional(),
  description: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; product?: Product; onClose: () => void }

export function AddProductModal({ open, product, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const isEdit = Boolean(product)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  useEffect(() => { api.categories.list().then(setCategories) }, [])

  useEffect(() => {
    if (open && product) reset({
      name: product.name,
      barcode: product.barcode ?? '',
      price: product.price / 100,
      cost_price: product.cost_price / 100,
      stock_quantity: product.stock_quantity,
      low_stock_alert: product.low_stock_alert,
      category_id: product.category_id ?? undefined,
      description: product.description ?? ''
    })
    if (open && !product) reset({})
  }, [open, product])

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, price: Math.round(data.price * 100), cost_price: Math.round((data.cost_price ?? 0) * 100) }
    if (isEdit && product) {
      await api.products.update(product.id, payload)
    } else {
      await api.products.create(payload)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)}>{isEdit ? 'Save Changes' : 'Add Product'}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <Input label="Product Name *" {...register('name')} error={errors.name?.message} />
        <Input label="Barcode" {...register('barcode')} placeholder="Scan or type barcode" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <Input label="Selling Price *" type="number" step="0.01" min="0" {...register('price')} error={errors.price?.message} />
          <Input label="Cost Price" type="number" step="0.01" min="0" {...register('cost_price')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <Input label="Stock Quantity" type="number" min="0" {...register('stock_quantity')} />
          <Input label="Low Stock Alert" type="number" min="0" {...register('low_stock_alert')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <label style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-bold)', letterSpacing: 'var(--letter-spacing-label)', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
            Category
          </label>
          <select {...register('category_id')} style={{ background: 'var(--color-background)', border: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-body-md)', padding: '10px 14px', width: '100%', outline: 'none' }}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Input label="Description" {...register('description')} placeholder="Optional product description" />
      </div>
    </Modal>
  )
}
