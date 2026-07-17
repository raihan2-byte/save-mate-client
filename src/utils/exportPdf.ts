import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface SummaryData {
  total_income: number
  total_expense?: number
  total_spent?: number
  total_food_spent?: number
  total_lifestyle_spent?: number
  total_mandatory?: number
  total_savings?: number
  net_balance?: number
}

export function exportSummaryToPdf(summary: SummaryData, monthLabel: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  // Header
  doc.setFontSize(18)
  doc.setTextColor(30, 30, 30)
  doc.text('Laporan Keuangan Bulanan', pageW / 2, 20, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(monthLabel, pageW / 2, 28, { align: 'center' })

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 33, pageW - 14, 33)

  // Net balance
  const net = summary.net_balance ?? 0
  doc.setFontSize(13)
  doc.setTextColor(net >= 0 ? 16 : 200, net >= 0 ? 185 : 30, net >= 0 ? 129 : 30)
  doc.text(net >= 0 ? 'Keuangan Sehat' : 'Pengeluaran Melebihi Pemasukan', 14, 42)

  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text(fmt(Math.abs(net)), 14, 52)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(net >= 0 ? 'Sisa / berhasil dihemat' : 'Defisit bulan ini', 14, 58)

  // Summary table
  const totalOut = (summary.total_food_spent ?? 0) + (summary.total_lifestyle_spent ?? 0) + (summary.total_mandatory ?? 0)
  const withinBudget = summary.total_income > 0 ? totalOut <= summary.total_income : true

  autoTable(doc, {
    startY: 66,
    head: [['Keterangan', 'Jumlah']],
    body: [
      ['Total Pemasukan', fmt(summary.total_income ?? 0)],
      ['Total Pengeluaran', fmt(summary.total_expense ?? summary.total_spent ?? 0)],
      ['Pengeluaran Makan', fmt(summary.total_food_spent ?? 0)],
      ['Pengeluaran Lifestyle', fmt(summary.total_lifestyle_spent ?? 0)],
      ['Pengeluaran Wajib', fmt(summary.total_mandatory ?? 0)],
      ['Tabungan', fmt(summary.total_savings ?? 0)],
      ['Status vs Budget', withinBudget ? 'Dalam Budget' : 'Melebihi Budget'],
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(`Digenerate oleh Save Mate - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, finalY)

  const filename = `laporan_${monthLabel.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
