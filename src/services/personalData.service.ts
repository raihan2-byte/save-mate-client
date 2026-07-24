import api from '@/api'
import { extractError } from '@/utils/errors'
import type { PersonalData } from '@/types'

export async function getPersonalData(): Promise<PersonalData | null> {
  try {
    const res = await api.get('/personal-data/')
    // Backend returns 200 with data: null when the user has no personal data.
    return (res.data.data ?? null) as PersonalData | null
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat data pribadi'))
  }
}

export async function updatePersonalData(payload: {
  salary: number
  saving_type: string
  purpose_of_join_here: string
}): Promise<PersonalData> {
  try {
    const res = await api.put('/personal-data/', payload)
    return res.data.data as PersonalData
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan data pribadi'))
  }
}

export async function setNextSalary(nextSalary: number): Promise<void> {
  try {
    await api.patch('/personal-data/next-salary', { next_salary: nextSalary })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan gaji bulan depan'))
  }
}

export async function clearNextSalary(): Promise<void> {
  try {
    await api.delete('/personal-data/next-salary')
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menghapus gaji bulan depan'))
  }
}
