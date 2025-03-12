/**
 * Formats a number into Indonesian Rupiah currency format.
 * @param amount - The numeric value to format.
 * @returns A string formatted as Rupiah, e.g., "Rp100.000".
 */
export function formatToRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted.replace(/\u00A0/g, '');
}
  