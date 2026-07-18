'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { AdminBrand } from '@/lib/porulle/brands';
import type { AdminCategory } from '@/lib/porulle/categories';
import { setProductBrandAction, toggleProductCategoryAction } from './actions';

export function OrganizationPanel({
  entityId,
  brands,
  categories,
  currentBrandId,
  currentCategoryIds
}: {
  entityId: string;
  brands: AdminBrand[];
  categories: AdminCategory[];
  currentBrandId: string | null;
  currentCategoryIds: string[];
}) {
  const [brandId, setBrandId] = useState(currentBrandId ?? '');
  const [catIds, setCatIds] = useState<Set<string>>(new Set(currentCategoryIds));
  const [pending, startTransition] = useTransition();

  function changeBrand(next: string) {
    const prev = brandId || null;
    setBrandId(next);
    startTransition(async () => {
      const r = await setProductBrandAction(entityId, next || null, prev);
      if (r.error) {
        toast.error(r.error);
        setBrandId(prev ?? '');
      } else toast.success('Brand updated');
    });
  }

  function toggleCat(id: string, checked: boolean) {
    const next = new Set(catIds);
    if (checked) next.add(id);
    else next.delete(id);
    setCatIds(next);
    startTransition(async () => {
      const r = await toggleProductCategoryAction(entityId, id, checked);
      if (r.error) {
        toast.error(r.error);
        setCatIds((cur) => {
          const revert = new Set(cur);
          if (checked) revert.delete(id);
          else revert.add(id);
          return revert;
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Organization</CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-1.5'>
          <Label htmlFor='brand'>Brand</Label>
          <select
            id='brand'
            value={brandId}
            disabled={pending}
            onChange={(e) => changeBrand(e.target.value)}
            className='border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-64 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none'
          >
            <option value=''>— None —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className='grid gap-2'>
          <Label>Categories</Label>
          {categories.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No categories yet.</p>
          ) : (
            <div className='grid grid-cols-2 gap-2'>
              {categories.map((c) => (
                <label key={c.id} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    checked={catIds.has(c.id)}
                    disabled={pending}
                    onCheckedChange={(v) => toggleCat(c.id, v === true)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
