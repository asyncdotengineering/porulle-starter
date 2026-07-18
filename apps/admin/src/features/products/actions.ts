'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import {
  archiveProduct,
  createProduct,
  setFeaturedImage,
  updateProduct,
  type ProductInput
} from '@/lib/porulle/products';
import { setStock } from '@/lib/porulle/inventory';
import { uploadImage } from '@/lib/porulle/media';
import { assignBrand, unassignBrand } from '@/lib/porulle/brands';
import { assignCategory, unassignCategory } from '@/lib/porulle/categories';
import { addOptionType, generateVariants } from '@/lib/porulle/variants';

export type ProductFormState = { error?: string };

function parse(formData: FormData): ProductInput {
  return {
    title: String(formData.get('title') ?? '').trim(),
    slug: String(formData.get('slug') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    price: Number(formData.get('price') ?? 0),
    publish: formData.get('publish') === 'on'
  };
}

export async function saveProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const input = parse(formData);
  if (!input.title || !input.slug) return { error: 'Title and slug are required.' };
  if (!Number.isFinite(input.price) || input.price < 0) return { error: 'Enter a valid price.' };

  const result = id ? await updateProduct(id, input) : await createProduct(input);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/products');
  redirect('/dashboard/products');
}

export async function archiveProductAction(id: string): Promise<ProductFormState> {
  await requireAdmin();
  const result = await archiveProduct(id);
  revalidatePath('/dashboard/products');
  return result;
}

export async function setStockAction(entityId: string, amount: number): Promise<{ error?: string }> {
  await requireAdmin();
  if (!Number.isInteger(amount) || amount < 0) return { error: 'Enter a whole number ≥ 0.' };
  const result = await setStock(entityId, amount, 'Manual adjustment from admin');
  if (!result.error) revalidatePath(`/dashboard/products/${entityId}`);
  return result;
}

export async function setProductBrandAction(
  entityId: string,
  brandId: string | null,
  previousBrandId: string | null
): Promise<{ error?: string }> {
  await requireAdmin();
  if (previousBrandId && previousBrandId !== brandId) {
    const removed = await unassignBrand(entityId, previousBrandId);
    if (removed.error) return removed;
  }
  if (brandId && brandId !== previousBrandId) {
    const added = await assignBrand(entityId, brandId);
    if (added.error) return added;
  }
  revalidatePath(`/dashboard/products/${entityId}`);
  return {};
}

export async function toggleProductCategoryAction(
  entityId: string,
  categoryId: string,
  assigned: boolean
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = assigned
    ? await assignCategory(entityId, categoryId)
    : await unassignCategory(entityId, categoryId);
  if (!result.error) revalidatePath(`/dashboard/products/${entityId}`);
  return result;
}

export async function addOptionTypeAction(
  entityId: string,
  name: string,
  values: string[]
): Promise<{ error?: string }> {
  await requireAdmin();
  const clean = values.map((v) => v.trim()).filter(Boolean);
  if (!name.trim() || clean.length === 0) return { error: 'Name and at least one value are required.' };
  const result = await addOptionType(entityId, name.trim(), clean);
  if (!result.error) revalidatePath(`/dashboard/products/${entityId}`);
  return result;
}

export async function generateVariantsAction(entityId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await generateVariants(entityId);
  if (!result.error) revalidatePath(`/dashboard/products/${entityId}`);
  return result;
}

export async function uploadProductImageAction(
  entityId: string,
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  await requireAdmin();
  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image file.' };
  const up = await uploadImage(file);
  if (up.error || !up.url) return { error: up.error ?? 'Upload failed.' };
  const set = await setFeaturedImage(entityId, up.url);
  if (set.error) return set;
  revalidatePath(`/dashboard/products/${entityId}`);
  revalidatePath('/dashboard/products');
  return { url: up.url };
}
