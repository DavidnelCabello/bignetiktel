// Utilidades de exportación: CSV (Excel), Word (.doc) y PDF (imprimir).

function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Excel-compatible (CSV con BOM para acentos).
export function exportCSV(filename, headers, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
  download(filename, 'text/csv;charset=utf-8', '﻿' + csv)
}

// Construye el HTML del reporte a partir de secciones [{heading, headers, rows}].
export function reportHTML(title, subtitle, sections) {
  const style = `body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:24px}
    h1{color:#047857;margin:0;font-size:22px} .sub{color:#6b7280;margin:4px 0 18px;font-size:13px}
    h2{margin:18px 0 6px;font-size:14px;color:#111827} table{border-collapse:collapse;width:100%;margin-bottom:10px}
    th,td{border:1px solid #e5e7eb;padding:6px 10px;font-size:12px;text-align:left} th{background:#f1f5f9}
    td.n,th.n{text-align:right}`
  const tbl = s => `<h2>${s.heading}</h2><table><thead><tr>${s.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  return `<html><head><meta charset="utf-8"><title>${title}</title><style>${style}</style></head><body><h1>${title}</h1><div class="sub">${subtitle}</div>${sections.map(tbl).join('')}</body></html>`
}

export function exportWord(filename, html) {
  download(filename, 'application/msword', html)
}

// Imprime (el usuario elige "Guardar como PDF").
export function printPDF(html) {
  const iframe = document.createElement('iframe')
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow.document
  doc.open(); doc.write(html); doc.close()
  iframe.contentWindow.focus()
  setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1500) }, 350)
}
