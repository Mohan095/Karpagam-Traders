/**
 * Karpagam Traders - Professional Black & White Billing Receipt Image Generator
 * Generates ultra-sharp, high-DPI (Retina 2x) black-and-white retail invoices in PNG/JPG format.
 * Features:
 * - Pure white background (#ffffff) with high-contrast crisp black typography and borders
 * - Shop branding, customer details, itemized table, totals, amount in words, barcode
 * - Instant automatic download for both customer and owner/admin
 */

// Helper to convert numbers to Indian Rupee Words
export function numberToWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return 'INR ' + inWords(rounded) + ' Rupees Only';
}

// Draw text with word-wrap support
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(' ');
  let line = '';
  let curY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      linesCount++;
      if (linesCount >= maxLines - 1) {
        // truncate remaining
        const remaining = words.slice(n).join(' ');
        ctx.fillText((remaining.length > 30 ? remaining.slice(0, 27) + '...' : remaining), x, curY);
        return curY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

// Generate the Black & White bill canvas
export function generateBillingCanvas(order) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const logicalWidth = 820;
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ name: order.service || 'Calendar Printing Order', qty: 1, price: order.total || order.totalAmount || 0 }];

  // Compute dynamic height
  const baseHeight = 680;
  const itemRowHeight = 36;
  const tableHeight = Math.max(120, items.length * itemRowHeight);
  const logicalHeight = baseHeight + tableHeight;

  // Retina 2x scale for ultra-crisp output
  const scale = 2;
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  ctx.scale(scale, scale);

  // Background - Pure White
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Borders - Double crisp black frame
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, logicalWidth - 36, logicalHeight - 36);

  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, logicalWidth - 48, logicalHeight - 48);

  let curY = 46;

  // Header: Shop Name & Details
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  // Auspicious symbol & Title
  ctx.font = 'bold 15px "Outfit", Arial, sans-serif';
  ctx.fillText('|| ஸ்ரீ கற்பக விநாயகர் துணை ||', logicalWidth / 2, curY);
  curY += 28;

  ctx.font = '900 28px "Outfit", "Arial Black", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('KARPAGAM TRADERS', logicalWidth / 2, curY);
  curY += 22;

  ctx.font = 'bold 16px "Inter", Arial, sans-serif';
  ctx.fillText('கற்பகம் டிரேடர்ஸ் • சிவகாசி', logicalWidth / 2, curY);
  curY += 18;

  ctx.font = '600 11px "Inter", Arial, sans-serif';
  ctx.fillText('PREMIUM DAILY & MONTHLY CALENDARS • COMMERCIAL OFFSET PRINTERS & DIARIES', logicalWidth / 2, curY);
  curY += 16;

  ctx.font = 'normal 10.5px "Inter", Arial, sans-serif';
  ctx.fillText('12/4, Main Road, Near Bus Stand, Sivakasi - 626 123, Tamil Nadu, India', logicalWidth / 2, curY);
  curY += 15;

  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.fillText('Phone / WhatsApp: +91 9566801402 | Email: contact@karpagamtraders.com', logicalWidth / 2, curY);
  curY += 18;

  // Solid Black Banner: RETAIL ORDER INVOICE
  ctx.fillStyle = '#000000';
  ctx.fillRect(24, curY, logicalWidth - 48, 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 12px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ RETAIL ORDER BILL / CASH MEMO (ORIGINAL COPY) ★', logicalWidth / 2, curY + 19);
  curY += 36;

  // Two-column section: Customer Info (Left) & Invoice Meta (Right)
  const metaBoxY = curY;
  const metaBoxHeight = 115;
  const colSplitX = (logicalWidth / 2) + 20;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, metaBoxY, logicalWidth - 48, metaBoxHeight);

  // Vertical Divider
  ctx.beginPath();
  ctx.moveTo(colSplitX, metaBoxY);
  ctx.lineTo(colSplitX, metaBoxY + metaBoxHeight);
  ctx.stroke();

  // LEFT COLUMN: Customer Info
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  ctx.font = '900 11px "Inter", Arial, sans-serif';
  ctx.fillText('BILLED TO / CUSTOMER DETAILS:', 34, metaBoxY + 18);

  ctx.font = 'bold 12px "Inter", Arial, sans-serif';
  ctx.fillText(`Customer: ${order.customerName || order.name || 'Valued Customer'}`, 34, metaBoxY + 36);

  ctx.font = 'normal 11px "Inter", Arial, sans-serif';
  ctx.fillText(`Mobile: ${order.phone || 'N/A'}`, 34, metaBoxY + 54);

  if (order.email && order.email !== 'N/A') {
    ctx.fillText(`Email: ${order.email}`, 34, metaBoxY + 70);
  }

  // Address
  ctx.font = 'normal 10.5px "Inter", Arial, sans-serif';
  const addrY = (order.email && order.email !== 'N/A') ? metaBoxY + 86 : metaBoxY + 72;
  ctx.fillText('Address: ', 34, addrY);
  wrapText(ctx, order.address || 'Direct Shop / Counter Dispatch', 86, addrY, colSplitX - 98, 14, 2);

  // RIGHT COLUMN: Invoice Metadata
  const rightColX = colSplitX + 12;
  ctx.font = '900 11px "Inter", Arial, sans-serif';
  ctx.fillText('INVOICE & ORDER PARTICULARS:', rightColX, metaBoxY + 18);

  const invId = order.id || order.invoiceNo || ('KT-INV-' + Date.now().toString().slice(-6));
  ctx.font = 'bold 12px "Inter", Arial, sans-serif';
  ctx.fillText(`Invoice No: ${invId}`, rightColX, metaBoxY + 36);

  const now = new Date();
  const dateStr = order.date || order.timestamp || (now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  ctx.font = 'normal 11px "Inter", Arial, sans-serif';
  ctx.fillText(`Date & Time: ${dateStr}`, rightColX, metaBoxY + 54);

  ctx.fillText(`Order Channel: WhatsApp Express Checkout`, rightColX, metaBoxY + 72);

  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.fillText(`Payment Mode: Direct WhatsApp / GPay / Cash`, rightColX, metaBoxY + 90);

  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.fillText(`Order Status: Confirmed & Dispatched`, rightColX, metaBoxY + 106);

  curY = metaBoxY + metaBoxHeight + 14;

  // TABLE OF ITEMS
  const tableY = curY;
  const thHeight = 26;

  // Table header background (Black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(24, tableY, logicalWidth - 48, thHeight);

  // Header column definitions
  // Total table width = logicalWidth - 48 = 772
  const c2 = 70;        // Description (390px)
  const c3 = 490;       // Specs (100px)
  const c4 = 600;       // Qty (50px)
  const c5 = 680;       // Rate (₹) (60px)

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('S.No', 45, tableY + 17);

  ctx.textAlign = 'left';
  ctx.fillText('Item Description / Particulars', c2, tableY + 17);
  ctx.fillText('Specs', c3, tableY + 17);

  ctx.textAlign = 'center';
  ctx.fillText('Qty', c4 + 15, tableY + 17);

  ctx.textAlign = 'right';
  ctx.fillText('Rate (₹)', c5 + 25, tableY + 17);
  ctx.fillText('Total (₹)', 24 + logicalWidth - 58, tableY + 17);

  // Table Rows
  curY = tableY + thHeight;
  let totalQty = 0;
  let computedSubtotal = 0;

  ctx.font = 'normal 11px "Inter", Arial, sans-serif';

  items.forEach((it, idx) => {
    const qty = Number(it.qty || it.quantity || 1);
    const price = Number(it.price || 0);
    const itemTotal = qty * price;
    totalQty += qty;
    computedSubtotal += itemTotal;

    // Row divider
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, curY + itemRowHeight);
    ctx.lineTo(logicalWidth - 24, curY + itemRowHeight);
    ctx.stroke();

    ctx.fillStyle = '#000000';

    // S.No
    ctx.textAlign = 'center';
    ctx.fillText(String(idx + 1), 45, curY + 22);

    // Name (wrapped if needed)
    ctx.textAlign = 'left';
    ctx.font = 'bold 11.5px "Inter", Arial, sans-serif';
    const itemName = it.name || 'Custom Calendar Order';
    ctx.fillText(itemName.length > 45 ? itemName.slice(0, 42) + '...' : itemName, c2, curY + 22);

    // Specs
    ctx.font = 'normal 10px "Inter", Arial, sans-serif';
    const specs = [it.size, it.quality].filter(Boolean).join(' • ') || 'Standard';
    ctx.fillText(specs, c3, curY + 22);

    // Qty
    ctx.font = 'bold 11px "Inter", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(qty), c4 + 15, curY + 22);

    // Rate
    ctx.textAlign = 'right';
    ctx.font = 'normal 11px "Inter", Arial, sans-serif';
    ctx.fillText(price.toFixed(2), c5 + 25, curY + 22);

    // Total
    ctx.font = 'bold 11px "Inter", Arial, sans-serif';
    ctx.fillText(itemTotal.toFixed(2), 24 + logicalWidth - 58, curY + 22);

    curY += itemRowHeight;
  });

  // Table outer frame
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, tableY, logicalWidth - 48, curY - tableY);

  const grandTotal = Number(order.total || order.totalAmount || computedSubtotal);

  // SUMMARY & GRAND TOTAL BOX
  curY += 8;
  const summaryBoxY = curY;
  const summaryHeight = 85;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, summaryBoxY, logicalWidth - 48, summaryHeight);

  // Left Side: Amount in Words & Notes
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.fillText('Amount Chargeable (in words):', 34, summaryBoxY + 22);

  ctx.font = 'italic 11px "Inter", Georgia, serif';
  ctx.fillText(numberToWords(grandTotal), 34, summaryBoxY + 38);

  ctx.font = 'normal 10px "Inter", Arial, sans-serif';
  ctx.fillText(`Total Items Count: ${items.length} item(s) | Total Quantity: ${totalQty} units`, 34, summaryBoxY + 58);
  ctx.fillText('Delivery Charges: ₹0.00 (Free Express Shop Delivery / Sivakasi Dispatch)', 34, summaryBoxY + 72);

  // Right Side: Grand Total Box
  const grandBoxWidth = 270;
  const grandBoxX = logicalWidth - 24 - grandBoxWidth;

  // Vertical border separating words and total
  ctx.beginPath();
  ctx.moveTo(grandBoxX, summaryBoxY);
  ctx.lineTo(grandBoxX, summaryBoxY + summaryHeight);
  ctx.stroke();

  // Grand Total banner
  ctx.fillStyle = '#000000';
  ctx.fillRect(grandBoxX, summaryBoxY + 35, grandBoxWidth, 50);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px "Inter", Arial, sans-serif';
  ctx.fillText('Sub Total:', grandBoxX + 14, summaryBoxY + 22);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${grandTotal.toFixed(2)}`, logicalWidth - 36, summaryBoxY + 22);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.font = '900 13px "Outfit", Arial, sans-serif';
  ctx.fillText('GRAND TOTAL:', grandBoxX + 14, summaryBoxY + 65);

  ctx.textAlign = 'right';
  ctx.font = '900 19px "Outfit", Arial, sans-serif';
  ctx.fillText(`₹${grandTotal.toFixed(2)}`, logicalWidth - 36, summaryBoxY + 66);

  curY = summaryBoxY + summaryHeight + 14;

  // TERMS & DECLARATION
  const termsBoxY = curY;
  const termsHeight = 85;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, termsBoxY, logicalWidth - 48, termsHeight);

  // Left terms
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = 'bold 10px "Inter", Arial, sans-serif';
  ctx.fillText('TERMS & CONDITIONS:', 34, termsBoxY + 18);

  ctx.font = 'normal 9.5px "Inter", Arial, sans-serif';
  ctx.fillText('1. Goods once dispatched are verified for quality calendar printing and offset bindery.', 34, termsBoxY + 32);
  ctx.fillText('2. For proof design adjustments, notify via WhatsApp (+91 9566801402) within 24 hours.', 34, termsBoxY + 46);
  ctx.fillText('3. Subject to Sivakasi Jurisdiction only. This order bill is generated automatically.', 34, termsBoxY + 60);
  ctx.fillText('4. E. & O. E. (Errors and Omissions Excepted). Thank you for your patronage!', 34, termsBoxY + 74);

  // Right Signatory
  const sigX = logicalWidth - 200;
  ctx.beginPath();
  ctx.moveTo(sigX - 20, termsBoxY);
  ctx.lineTo(sigX - 20, termsBoxY + termsHeight);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 10.5px "Inter", Arial, sans-serif';
  ctx.fillText('For KARPAGAM TRADERS', sigX + 80, termsBoxY + 18);

  ctx.font = 'italic 10px "Inter", Georgia, serif';
  ctx.fillText('[ Authorized Signatory ]', sigX + 80, termsBoxY + 68);

  curY = termsBoxY + termsHeight + 16;

  // SIMULATED AUTHENTIC BARCODE & FOOTER
  const barcodeY = curY;
  const barcodeX = (logicalWidth / 2) - 130;
  const barcodeHeight = 24;

  // Draw simulated black and white barcode lines
  ctx.fillStyle = '#000000';
  const barPattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 1, 3, 2, 4, 1, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2];
  let bx = barcodeX;
  barPattern.forEach((w, idx) => {
    if (idx % 2 === 0) {
      ctx.fillRect(bx, barcodeY, w * 1.6, barcodeHeight);
    }
    bx += w * 2.5;
  });

  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`* ${invId} *`, logicalWidth / 2, barcodeY + barcodeHeight + 12);

  ctx.font = 'bold 10px "Inter", Arial, sans-serif';
  ctx.fillText('★ THANK YOU FOR CHOOSING KARPAGAM TRADERS, SIVAKASI ★', logicalWidth / 2, barcodeY + barcodeHeight + 25);

  return canvas;
}

// Generate Data URL for image (PNG or JPG)
export function generateBillingImageDataUrl(order, format = 'png') {
  const canvas = generateBillingCanvas(order);
  const mimeType = format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg'
    ? 'image/jpeg'
    : 'image/png';
  return canvas.toDataURL(mimeType, 0.95);
}

// Download the Black & White bill as an image file
export function downloadBillingImage(order, format = 'png') {
  try {
    const dataUrl = generateBillingImageDataUrl(order, format);
    const invId = order.id || order.invoiceNo || ('KT-INV-' + Date.now().toString().slice(-6));
    const filename = `Karpagam_Traders_Bill_${invId}.${format.toLowerCase()}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, filename, dataUrl };
  } catch (err) {
    console.error("Error generating bill image download:", err);
    return { success: false, error: err.message };
  }
}
