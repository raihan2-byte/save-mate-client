import * as XLSX from 'xlsx'
import type { Transaction } from '@/types'

export function exportTransactionsToExcel(transactions: Transaction[], label: string) {
  const rows = transactions.map(tx => ({
    'Tanggal': tx.assigned_date ? tx.assigned_date.split('T')[0] : '',
    'Nama': tx.name ?? tx.description ?? '',
    'Kategori': tx.category ?? '',
    'Tipe': tx.type ?? '',
    'Nominal (Rp)': tx.amount ?? 0,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 18 }]

  // Apply number format to Nominal column (E)
  for (let i = 2; i <= rows.length + 1; i++) {
    const cell = ws[`E${i}`]
    if (cell) cell.z = '#,##0'
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')

  const filename = `transaksi_${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}
