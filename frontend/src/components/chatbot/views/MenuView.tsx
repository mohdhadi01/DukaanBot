'use client'

import { useEffect, useState, useMemo } from 'react'
import { api, API, formatINR, SHOP_TYPES } from '../api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useApp } from '../store'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Tag,
  PackageOpen,
  IndianRupee,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MenuView() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [catOpen, setCatOpen] = useState(false)
  const { refreshKey } = useApp()
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    const [p, c] = await Promise.all([api(API.products), api(API.categories)])
    setProducts(p.products)
    setCategories(c.categories)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (cancelled) return
      await load()
    })()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filterCat !== 'all' && p.categoryId !== filterCat) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, search, filterCat])

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {}
    for (const p of filtered) {
      const key = p.categoryId || 'uncategorized'
      if (!g[key]) g[key] = []
      g[key].push(p)
    }
    return g
  }, [filtered])

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await api(API.products, {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, ...data }),
        })
        toast({ title: 'Product updated' })
      } else {
        await api(API.products, {
          method: 'POST',
          body: JSON.stringify(data),
        })
        toast({ title: 'Product added' })
      }
      setEditOpen(false)
      setEditing(null)
      load()
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await api(`${API.products}?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Product deleted' })
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleToggleAvailable = async (p: any) => {
    try {
      await api(API.products, {
        method: 'PATCH',
        body: JSON.stringify({ id: p.id, isAvailable: !p.isAvailable }),
      })
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveCategory = async (data: any) => {
    try {
      await api(API.categories, { method: 'POST', body: JSON.stringify(data) })
      toast({ title: 'Category added' })
      setCatOpen(false)
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add products, set prices, organize into categories. These will appear in your WhatsApp menu.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Category
              </Button>
            </DialogTrigger>
            <CategoryDialog onSave={handleSaveCategory} categories={categories} />
          </Dialog>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setEditing(null)
              setEditOpen(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat
          icon={Package}
          label="Total Products"
          value={products.length}
          color="text-emerald-600 bg-emerald-50"
        />
        <MiniStat
          icon={PackageOpen}
          label="Available"
          value={products.filter((p) => p.isAvailable).length}
          color="text-blue-600 bg-blue-50"
        />
        <MiniStat
          icon={Tag}
          label="Categories"
          value={categories.length}
          color="text-purple-600 bg-purple-50"
        />
        <MiniStat
          icon={IndianRupee}
          label="Avg Price"
          value={products.length ? formatINR(products.reduce((s, p) => s + p.price, 0) / products.length) : '—'}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Product list grouped by category */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading products...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No products yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add your first product to start selling on WhatsApp.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              onClick={() => {
                setEditing(null)
                setEditOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([catId, items]) => {
            const cat = categories.find((c) => c.id === catId)
            return (
              <div key={catId}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{cat?.emoji || '📦'}</span>
                  <h3 className="text-sm font-semibold">{cat?.name || 'Uncategorized'}</h3>
                  <Badge variant="outline" className="text-xs">{items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onEdit={() => {
                        setEditing(p)
                        setEditOpen(true)
                      }}
                      onDelete={() => handleDelete(p.id)}
                      onToggle={() => handleToggleAvailable(p)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null) }}>
        <ProductDialog product={editing} categories={categories} onSave={handleSave} />
      </Dialog>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: any
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-base font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: any
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <Card className={cn('transition-all hover:shadow-md', !product.isAvailable && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold truncate">{product.name}</h4>
              {!product.isAvailable && (
                <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                  Unavailable
                </Badge>
              )}
            </div>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="font-semibold text-emerald-700 bg-emerald-50">
                {formatINR(product.price)}{product.unit ? ` /${product.unit}` : ''}
              </Badge>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category.emoji} {product.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1.5">
            <Switch checked={product.isAvailable} onCheckedChange={onToggle} id={`av-${product.id}`} />
            <Label htmlFor={`av-${product.id}`} className="text-xs text-muted-foreground cursor-pointer">
              Available
            </Label>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductDialog({
  product,
  categories,
  onSave,
}: {
  product: any
  categories: any[]
  onSave: (data: any) => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [unit, setUnit] = useState(product?.unit || '')
  const [categoryId, setCategoryId] = useState(product?.categoryId || '')
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name || !price) return
    setSaving(true)
    await onSave({
      name,
      description,
      price,
      unit,
      categoryId,
      isAvailable,
    })
    setSaving(false)
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogDescription>
          {product ? 'Update product details' : 'Add a new item to your menu'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aashirvaad Atta"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (₹) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, L, pcs..."
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: short description shown to customers"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="avail" checked={isAvailable} onCheckedChange={setIsAvailable} />
          <Label htmlFor="avail" className="text-sm cursor-pointer">
            Available for ordering
          </Label>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving || !name || !price} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {product ? 'Save Changes' : 'Add Product'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function CategoryDialog({
  onSave,
  categories: _categories,
}: {
  onSave: (data: any) => void
  categories: any[]
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛒')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name) return
    setSaving(true)
    await onSave({ name, emoji })
    setSaving(false)
    setName('')
    setEmoji('🛒')
  }

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Add Category</DialogTitle>
        <DialogDescription>Group similar products together</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5 col-span-1">
            <Label>Emoji</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="text-center text-lg"
            />
          </div>
          <div className="space-y-1.5 col-span-3">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beverages"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving || !name} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add Category
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
