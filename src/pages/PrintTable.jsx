import dayjs from "dayjs";

export const printInvoice = (formData) => {
  const printWindow = window.open('', '', 'height=842,width=595'); // A4 dimensions in pixels (approx.)
  if (!printWindow) {
    console.error("Popup blocked. Please allow popups for this site.");
    return;
  }
  printWindow.document.write('<html><head><title>Professional Invoice</title>');
  printWindow.document.write('<style>' +
    'body { font-family: "Helvetica", Arial, sans-serif; margin: 0; padding: 20px; background: #ffffff; color: #333; }' +
    '.invoice-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #f8f9fa; border-bottom: 2px solid #007bff; margin-bottom: 20px; }' +
    '.company-info { text-align: left; }' +
    '.company-name { font-size: 28px; font-weight: bold; color: #007bff; }' +
    '.logo { width: 120px; height: 120px; background: #e9ecef; border: 1px dashed #ced4da; }' +
    '.invoice-details { margin: 20px 0; padding: 15px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 5px; }' +
    '.invoice-details h3 { color: #343a40; margin-bottom: 10px; font-size: 18px; }' +
    '.invoice-details p { margin: 5px 0; }' +
    'table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; }' +
    'th, td { border: 1px solid #dee2e6; padding: 10px; text-align: left; font-size: 14px; }' +
    'th { background: #007bff; color: white; font-weight: bold; }' +
    'td { vertical-align: top; }' +
    '.totals { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px; font-weight: bold; font-size: 16px; }' +
    '.totals p { margin: 5px 0; }' +
    '@media print { body { margin: 0; padding: 20mm; } @page { size: A4; margin: 0; } .invoice-header { border-bottom: 2px solid #007bff; } }' +
    '</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write('<div class="invoice-header">');
  printWindow.document.write('<div class="company-info">');
  printWindow.document.write('<div class="company-name">' + (formData.sellerBusinessName || 'Your Company Name') + '</div>');
  printWindow.document.write('</div>');
  printWindow.document.write('<div class="logo"><img src="/images/download.png" alt="Company Logo"/></div>'); // Logo on the right side
  printWindow.document.write('</div>');
  printWindow.document.write('<div class="invoice-details">');
  printWindow.document.write('<p><strong>Invoice #:</strong> ' + (formData.invoiceRefNo || 'N/A') + '</p>');
  printWindow.document.write('<p><strong>Date:</strong> ' + (formData.invoiceDate ? dayjs(formData.invoiceDate).format('DD MMM YYYY') : 'N/A') + '</p>');
  printWindow.document.write('<h3>Bill To:</h3>');
  printWindow.document.write('<p>' + (formData.buyerBusinessName || 'N/A') + '</p>');
  printWindow.document.write('<p>' + (formData.buyerAddress || 'N/A') + ', ' + (formData.buyerProvince || 'N/A') + '</p>');
  printWindow.document.write('<p>NTN: ' + (formData.buyerNTNCNIC || 'N/A') + '</p>');
  printWindow.document.write('<h3>Sold By:</h3>');
  printWindow.document.write('<p>' + (formData.sellerBusinessName || 'N/A') + '</p>');
  printWindow.document.write('<p>' + (formData.sellerAddress || 'N/A') + ', ' + (formData.sellerProvince || 'N/A') + '</p>');
  printWindow.document.write('<p>NTN: ' + (formData.sellerNTNCNIC || 'N/A') + '</p>');
  printWindow.document.write('</div>');
  printWindow.document.write('<table>');
  printWindow.document.write('<tr><th>HS Code</th><th>Description</th><th>Unit</th><th>Quantity</th><th>Rate</th><th>Unit Cost</th><th>Total (Excl. ST)</th><th>Sales Tax</th><th>Total</th></tr>');
  (formData.items || []).forEach(item => {
    printWindow.document.write('<tr>');
    printWindow.document.write('<td>' + (item.hsCode || 'N/A') + '</td>');
    printWindow.document.write('<td>' + (item.productDescription || 'N/A') + '</td>');
    printWindow.document.write('<td>' + (item.uoM || 'N/A') + '</td>');
    printWindow.document.write('<td>' + (item.quantity || 0) + '</td>');
    printWindow.document.write('<td>' + (item.rate || '0%') + '</td>');
    printWindow.document.write('<td>' + (item.fixedNotifiedValueOrRetailPrice || 0) + '</td>');
    printWindow.document.write('<td>' + (item.valueSalesExcludingST || 0).toFixed(2) + '</td>');
    printWindow.document.write('<td>' + (item.salesTaxApplicable || 0).toFixed(2) + '</td>');
    printWindow.document.write('<td>' + (item.totalValues || 0).toFixed(2) + '</td>');
    printWindow.document.write('</tr>');
  });
  printWindow.document.write('</table>');
  printWindow.document.write('<div class="totals">');
  printWindow.document.write('<p><strong>Sub Total:</strong> ' + (formData.items || []).reduce((sum, item) => sum + (item.valueSalesExcludingST || 0), 0).toFixed(2) + '</p>');
  printWindow.document.write('<p><strong>Sales Tax:</strong> ' + (formData.items || []).reduce((sum, item) => sum + (item.salesTaxApplicable || 0), 0).toFixed(2) + '</p>');
  printWindow.document.write('<p><strong>Further Tax:</strong> ' + (formData.items || []).reduce((sum, item) => sum + (item.furtherTax || 0), 0).toFixed(2) + '</p>');
  printWindow.document.write('<p><strong>Total:</strong> ' + (formData.items || []).reduce((sum, item) => sum + (item.totalValues || 0), 0).toFixed(2) + '</p>');
  printWindow.document.write('</div>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};