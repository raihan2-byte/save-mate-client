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

// Quick-fill description suggestions per transaction category.
export const DESCRIPTION_PRESETS: Record<string, string[]> = {
  food:          ['Makan siang', 'Makan malam', 'Sarapan', 'Ngopi', 'Jajan'],
  entertainment: ['Nonton', 'Game', 'Langganan', 'Nongkrong'],
  shopping:      ['Groceries', 'Baju', 'Skincare', 'Kebutuhan'],
  misc:          ['Bensin', 'Pulsa', 'Parkir', 'Lain-lain'],
}

// Quick-fill description suggestions for income.
export const INCOME_DESCRIPTION_PRESETS = ['Gaji', 'Bonus', 'Freelance', 'THR', 'Hadiah', 'Cashback']

export const MANDATORY_CATEGORIES = [
  { value: 'housing',      icon: '🏠', label: 'Kost/Sewa' },
  { value: 'subscription', icon: '📱', label: 'Langganan' },
  { value: 'transport',    icon: '🚗', label: 'Transportasi' },
  { value: 'other',        icon: '📌', label: 'Lainnya' },
]
