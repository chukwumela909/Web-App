'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { PrinterIcon } from '@heroicons/react/24/outline'

interface BarcodeLabelProps {
  /** The value to encode in the barcode (barcode number, or SKU fallback). */
  value: string
  /** Optional product name shown on the printable label. */
  productName?: string
  /** Optional price shown on the printable label (already in the target currency). */
  price?: number
  /** Optional currency symbol/prefix to render before the price. */
  currencySymbol?: string
  /** Optional className passed to the outer wrapper. */
  className?: string
}

/**
 * Renders a scannable barcode (via JsBarcode into an inline <svg>) for a product
 * and provides a "Print" button that opens a print window containing the barcode,
 * the product name, and the price formatted as a printable shelf/price label.
 */
export default function BarcodeLabel({
  value,
  productName,
  price,
  currencySymbol = '',
  className
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Guard against empty values — JsBarcode throws on an empty string.
  const safeValue = (value || '').trim()

  useEffect(() => {
    if (!svgRef.current || !safeValue) return

    try {
      JsBarcode(svgRef.current, safeValue, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        height: 60,
        margin: 8,
        lineColor: '#000000',
        background: '#ffffff'
      })
    } catch (error) {
      console.error('Failed to render barcode:', error)
    }
  }, [safeValue])

  const priceText =
    typeof price === 'number' && !Number.isNaN(price)
      ? `${currencySymbol ? currencySymbol + ' ' : ''}${price.toLocaleString()}`
      : ''

  const handlePrint = () => {
    if (!svgRef.current || !safeValue) return

    const barcodeMarkup = svgRef.current.outerHTML
    const printWindow = window.open('', '_blank', 'width=420,height=320')
    if (!printWindow) {
      alert('Unable to open the print window. Please allow pop-ups for this site.')
      return
    }

    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Product Label</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .label {
        width: 280px;
        text-align: center;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }
      .label .name {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 8px;
        word-break: break-word;
      }
      .label .price {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 8px;
      }
      .label svg { max-width: 100%; height: auto; }
      @media print {
        body { padding: 0; }
        .label { border: none; }
      }
    </style>
  </head>
  <body>
    <div class="label">
      ${productName ? `<div class="name">${escapeHtml(productName)}</div>` : ''}
      ${barcodeMarkup}
      ${priceText ? `<div class="price">${escapeHtml(priceText)}</div>` : ''}
    </div>
    <script>
      window.onload = function () {
        window.focus();
        window.print();
        setTimeout(function () { window.close(); }, 300);
      };
    </script>
  </body>
</html>`)
    printWindow.document.close()
  }

  if (!safeValue) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500">No barcode or SKU available to generate a label.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <svg ref={svgRef} className="max-w-full" />
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-[#004AAD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003a8c]"
        >
          <PrinterIcon className="h-4 w-4" />
          Print Label
        </button>
      </div>
    </div>
  )
}
