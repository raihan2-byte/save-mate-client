import { ref, computed } from 'vue'
import { toLocaleDateStr, addDays } from '@/utils/formatting'

export type FilterMode = 'single' | 'range' | 'all'

export function useListFilter() {
  const today = new Date()
  const todayStr = toLocaleDateStr(today)

  const filterMode = ref<FilterMode>('single')
  const modes = [
    { value: 'single' as FilterMode, label: 'Tanggal' },
    { value: 'range'  as FilterMode, label: 'Rentang' },
    { value: 'all'    as FilterMode, label: 'Semua' },
  ]

  // Single day
  const selectedDate = ref(todayStr)

  const isToday = computed(() => selectedDate.value === todayStr)

  const dateLabel = computed(() => {
    if (selectedDate.value === todayStr) return 'Hari Ini'
    const yesterday = addDays(todayStr, -1)
    if (selectedDate.value === yesterday) return 'Kemarin'
    const [y, m, d] = selectedDate.value.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  })

  function prevDay() {
    selectedDate.value = addDays(selectedDate.value, -1)
  }
  function nextDay() {
    if (!isToday.value) selectedDate.value = addDays(selectedDate.value, 1)
  }

  // Range
  const rangeFromDate = ref(addDays(todayStr, -6))
  const rangeToDate = ref(todayStr)

  const rangeLabel = computed(() => {
    const [fy, fm, fd] = rangeFromDate.value.split('-').map(Number)
    const [ty, tm, td] = rangeToDate.value.split('-').map(Number)
    const from = new Date(fy, fm - 1, fd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const to = new Date(ty, tm - 1, td).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${from} – ${to}`
  })

  function shiftRange(dir: 1 | -1) {
    const diff = Math.round((new Date(rangeToDate.value).getTime() - new Date(rangeFromDate.value).getTime()) / 86400000) + 1
    rangeFromDate.value = addDays(rangeFromDate.value, dir * diff)
    rangeToDate.value   = addDays(rangeToDate.value,   dir * diff)
    if (rangeToDate.value > todayStr) {
      rangeToDate.value = todayStr
      rangeFromDate.value = addDays(todayStr, -(diff - 1))
    }
  }

  function setMode(m: FilterMode) {
    filterMode.value = m
  }

  return {
    todayStr,
    filterMode, modes, setMode,
    selectedDate, isToday, dateLabel, prevDay, nextDay,
    rangeFromDate, rangeToDate, rangeLabel, shiftRange,
  }
}
