import type { ProductVariant } from '@/types/product.types';

export const getVariantStock = (variant: ProductVariant | null | undefined): number => {
  return variant?.stock_quantity ?? 0;
};

export const getVariantPrice = (variant: ProductVariant | null | undefined, basePrice?: number): number => {
  if (!variant) return basePrice ?? 0;
  if (variant.price_override && variant.price_override > 0) return variant.price_override;
  if (variant.price && variant.price > 0) return variant.price;
  return basePrice ?? 0;
};

export const getCheapestVariant = (
  variants: ProductVariant[] | null | undefined,
  options: { onlyInStock?: boolean; basePrice?: number } = {}
): ProductVariant | null => {
  if (!variants || variants.length === 0) return null;

  let filtered = variants;
  if (options.onlyInStock) {
    filtered = filtered.filter(v => (getVariantStock(v) > 0));
  }

  // Exclude variants without a valid positive price
  filtered = filtered.filter(v => {
    const price = getVariantPrice(v, options.basePrice);
    return typeof price === 'number' && price > 0;
  });

  if (filtered.length === 0) return null;

  return filtered.reduce((prev, curr) => {
    const prevPrice = getVariantPrice(prev, options.basePrice);
    const currPrice = getVariantPrice(curr, options.basePrice);
    return prevPrice < currPrice ? prev : curr;
  });
};

export const formatVariantLabel = (variant: ProductVariant | null | undefined): string => {
  if (!variant) return '';
  return variant.title || variant.sku || '';
};

export const isJsonVariantOptionValues = (values: any): boolean => {
  if (!values) return false;
  if (typeof values === 'string') {
    try {
      JSON.parse(values);
      return true;
    } catch {
      return false;
    }
  }
  return typeof values === 'object';
};

export const normalizeVariantOptionValues = (values: any): string => {
  if (typeof values === 'string') {
    return values.trim(); // Giữ nguyên chữ người dùng nhập
  }
  // Nếu vô tình là object thì mới stringify
  return typeof values === 'object' ? JSON.stringify(values || {}) : String(values);
};

export const formatVariantOptionValues = (values: any): string => {
  if (!values) return '';
  if (typeof values === 'string') {
    try {
      // Nếu dữ liệu cũ đang lưu dạng JSON thì vẫn hiển thị đẹp
      const obj = JSON.parse(values);
      return Object.values(obj).join(', ');
    } catch {
      // Nếu là chữ thường thì trả về nguyên bản
      return values;
    }
  }
  return Object.values(values || {}).join(', ');
};

export const isVariantActive = (variant: ProductVariant | null | undefined): boolean => {
  return variant?.is_active ?? true;
};
