export interface CategoryMeta {
  label: string
  emoji: string
  icon: string
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  food:          { label: 'Makanan',  emoji: '🍔', icon: '🍜' },
  entertainment: { label: 'Hiburan',  emoji: '🎮', icon: '🎮' },
  shopping:      { label: 'Belanja',  emoji: '🛍️', icon: '🛍️' },
  misc:          { label: 'Lainnya',  emoji: '📦', icon: '📦' },
}

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([value, meta]) => ({ value, ...meta }))

export const MANDATORY_CATEGORIES = [
  { value: 'housing',      icon: '🏠', label: 'Kost/Sewa' },
  { value: 'subscription', icon: '📱', label: 'Langganan' },
  { value: 'transport',    icon: '🚗', label: 'Transportasi' },
  { value: 'other',        icon: '📌', label: 'Lainnya' },
]
