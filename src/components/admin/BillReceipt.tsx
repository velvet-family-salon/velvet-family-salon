'use client';

import { Bill } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { forwardRef } from 'react';

interface BillReceiptProps {
    bill: Bill;
    showActions?: boolean;
    onPrint?: () => void;
    onDownload?: () => void;
    onWhatsApp?: () => void;
    onEmail?: () => void;
}

// Thermal printer friendly receipt (80mm width = ~48 characters)
export const BillReceipt = forwardRef<HTMLDivElement, BillReceiptProps>(
    ({ bill, showActions = false, onPrint, onDownload, onWhatsApp, onEmail }, ref) => {
        const formatBillDate = (date: string, time: string) => {
            const d = new Date(date);
            const options: Intl.DateTimeFormatOptions = {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            };
            const dateStr = d.toLocaleDateString('en-IN', options);
            const timeStr = time.slice(0, 5);
            const [h, m] = timeStr.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 || 12;
            return `${dateStr}, ${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
        };

        return (
            <div className="bg-white text-black">
                {/* Receipt Content - Thermal Printer Optimized */}
                <div
                    ref={ref}
                    className="font-mono text-sm p-4 max-w-[80mm] mx-auto bg-white"
                    style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4' }}
                >
                    {/* Header */}
                    <div className="text-center mb-4">
                        <div className="text-lg font-bold">VELVET FAMILY SALON</div>
                        <div className="text-xs text-gray-600">Premium Grooming & Styling</div>
                        <div className="border-t border-dashed border-gray-400 my-2"></div>
                    </div>

                    {/* Bill Info */}
                    <div className="mb-3">
                        <div className="flex justify-between">
                            <span>Bill No:</span>
                            <span className="font-bold">{bill.bill_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{formatBillDate(bill.bill_date, bill.bill_time)}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Customer Info */}
                    <div className="mb-3">
                        <div className="flex justify-between">
                            <span>Customer:</span>
                            <span className="font-medium">{bill.customer_name}</span>
                        </div>
                        {bill.customer_phone && (
                            <div className="flex justify-between">
                                <span>Phone:</span>
                                <span>{bill.customer_phone}</span>
                            </div>
                        )}
                        {bill.staff_name && (
                            <div className="flex justify-between">
                                <span>Stylist:</span>
                                <span>{bill.staff_name}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Services - Professional Format with MRP & Offer Price */}
                    <div className="mb-3">
                        <div className="font-bold mb-1">SERVICES</div>
                        {/* Header row */}
                        <div className="flex justify-between text-[10px] text-gray-500 border-b border-gray-200 pb-1 mb-1">
                            <span>Item</span>
                            <span>Amount</span>
                        </div>
                        {(Array.isArray(bill.services) ? bill.services : []).map((svc, i) => {
                            const hasOffer = !!(svc.compare_at_price && svc.compare_at_price > svc.price);
                            const savings = hasOffer ? (svc.compare_at_price ?? 0) - svc.price : 0;
                            return (
                                <div key={i} className="mb-1">
                                    <div className="flex justify-between items-start">
                                        <span className="flex-1 truncate pr-2 text-sm">{svc.name}</span>
                                        <div className="text-right">
                                            {hasOffer ? (
                                                <>
                                                    <span className="text-gray-400 line-through text-[10px] mr-1">
                                                        {formatPrice(svc.compare_at_price ?? 0)}
                                                    </span>
                                                    <span className="text-green-700 font-medium">
                                                        {formatPrice(svc.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>{formatPrice(svc.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Show offer savings inline */}
                                    {hasOffer && (
                                        <div className="text-right text-[9px] text-purple-600">
                                            ✨ OFFER: Save {formatPrice(savings)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Totals - Clean Professional Format */}
                    <div className="mb-3">
                        {(() => {
                            const services = Array.isArray(bill.services) ? bill.services : [];
                            const originalPriceTotal = services.reduce((sum, s) => sum + (s.compare_at_price || s.price), 0);
                            const actualPriceTotal = services.reduce((sum, s) => sum + s.price, 0);
                            const comboSavings = originalPriceTotal - actualPriceTotal;

                            return (
                                <>
                                    {/* Show MRP total only if there were offers */}
                                    {comboSavings > 0 && (
                                        <div className="flex justify-between text-gray-500 text-sm">
                                            <span>MRP Total:</span>
                                            <span className="line-through">{formatPrice(originalPriceTotal)}</span>
                                        </div>
                                    )}

                                    {/* Offer Savings */}
                                    {comboSavings > 0 && (
                                        <div className="flex justify-between text-purple-700 text-sm">
                                            <span>✨ Offer Savings:</span>
                                            <span>-{formatPrice(comboSavings)}</span>
                                        </div>
                                    )}

                                    {/* Subtotal after offers */}
                                    <div className="flex justify-between text-sm">
                                        <span>{comboSavings > 0 ? 'After Offers:' : 'Subtotal:'}</span>
                                        <span>{formatPrice(actualPriceTotal)}</span>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Store Discount */}
                        {bill.discount_percent > 0 && (
                            <div className="flex justify-between text-green-700 text-sm">
                                <span>Store Discount ({bill.discount_percent}%):</span>
                                <span>-{formatPrice(bill.discount_amount)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-300 mt-2 pt-2"></div>

                        {/* Grand Total */}
                        <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL:</span>
                            <span>{formatPrice(bill.final_amount)}</span>
                        </div>

                        {/* Total Savings Summary */}
                        {(() => {
                            const services = Array.isArray(bill.services) ? bill.services : [];
                            const originalPriceTotal = services.reduce((sum, s) => sum + (s.compare_at_price || s.price), 0);
                            const actualPriceTotal = services.reduce((sum, s) => sum + s.price, 0);
                            const comboSavings = originalPriceTotal - actualPriceTotal;
                            const totalSavings = comboSavings + bill.discount_amount;
                            if (totalSavings > 0) {
                                return (
                                    <div className="text-center mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                        <div className="text-green-700 font-bold text-xs">
                                            🎉 Total Savings: {formatPrice(totalSavings)}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {bill.payment_mode && (
                            <div className="flex justify-between text-gray-600 text-xs mt-2">
                                <span>Payment Mode:</span>
                                <span className="uppercase font-medium">{bill.payment_mode}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Footer */}
                    <div className="text-center text-xs">
                        <div className="font-medium">Thank you for visiting!</div>
                        <div className="text-gray-600">We hope to see you again soon ✨</div>
                        <div className="mt-2 text-gray-500">
                            📍 Your Trusted Salon
                        </div>
                    </div>
                </div>

                {/* Action Buttons (hidden in print) */}
                {showActions && (
                    <div className="flex flex-wrap gap-2 p-4 border-t border-gray-200 print:hidden">
                        <button
                            onClick={onPrint}
                            className="flex-1 py-2 px-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            🖨️ Print
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            📥 Download PDF
                        </button>
                        <button
                            onClick={onWhatsApp}
                            className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            💬 WhatsApp
                        </button>
                        <button
                            onClick={onEmail}
                            className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                            ✉️ Email
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

BillReceipt.displayName = 'BillReceipt';

// Generate WhatsApp-friendly receipt text
export function generateWhatsAppReceipt(bill: Bill): string {
    const formatBillDate = (date: string, time: string) => {
        const d = new Date(date);
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        };
        const dateStr = d.toLocaleDateString('en-IN', options);
        const timeStr = time.slice(0, 5);
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${dateStr}, ${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    // FIX: Safely handle bill.services - may not be array from JSONB
    const services = Array.isArray(bill.services) ? bill.services : [];
    const servicesText = services
        .map((s) => `✂️ ${s.name} - ${formatPrice(s.price)}`)
        .join('\n');

    let message = `🧾 *VELVET FAMILY SALON*
━━━━━━━━━━━━━━━━━━━━
Bill No: ${bill.bill_number}
Date: ${formatBillDate(bill.bill_date, bill.bill_time)}

👤 Customer: ${bill.customer_name}
${bill.staff_name ? `💇 Stylist: ${bill.staff_name}` : ''}

*Services:*
${servicesText}

Subtotal: ${formatPrice(bill.subtotal)}`;

    // Combo savings - FIX: Use compare_at_price for accurate calculation
    const originalPriceTotal = services.reduce((sum, s) => sum + (s.compare_at_price || s.price), 0);
    const actualPriceTotal = services.reduce((sum, s) => sum + s.price, 0);
    const comboSavings = originalPriceTotal - actualPriceTotal;
    if (comboSavings > 0) {
        message += `
🎁 Combo Offer: -${formatPrice(comboSavings)}`;
    }

    // Store discount
    if (bill.discount_percent > 0) {
        message += `
💰 Store Discount (${bill.discount_percent}%): -${formatPrice(bill.discount_amount)}`;
    }

    message += `
━━━━━━━━━━━━━━━━━━━━
*Total Paid: ${formatPrice(bill.final_amount)}* (${bill.payment_mode?.toUpperCase() || 'Cash'})`;

    // Total savings
    const totalSavings = comboSavings + bill.discount_amount;
    if (totalSavings > 0) {
        message += `

🎉 *You saved ${formatPrice(totalSavings)}!*`;
    }

    message += `

Thank you for visiting! ✨
See you again soon! 💇‍♀️`;

    return message;
}

// Generate email subject
export function generateEmailSubject(bill: Bill): string {
    return `Your Receipt from Velvet Family Salon - Bill #${bill.bill_number}`;
}

// Generate email body (plain text)
export function generateEmailBody(bill: Bill): string {
    const formatBillDate = (date: string, time: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    // FIX: Safely handle bill.services
    const services = Array.isArray(bill.services) ? bill.services : [];
    const servicesText = services
        .map((s) => `• ${s.name} - ${formatPrice(s.price)}`)
        .join('\n');

    let body = `Dear ${bill.customer_name},

Thank you for visiting Velvet Family Salon!

Here's your receipt:

Bill Number: ${bill.bill_number}
Date: ${formatBillDate(bill.bill_date, bill.bill_time)}

Services:
${servicesText}

Subtotal: ${formatPrice(bill.subtotal)}`;

    // Combo savings - FIX: Use compare_at_price for accurate calculation
    const originalPriceTotal = services.reduce((sum, s) => sum + (s.compare_at_price || s.price), 0);
    const actualPriceTotal = services.reduce((sum, s) => sum + s.price, 0);
    const comboSavings = originalPriceTotal - actualPriceTotal;
    if (comboSavings > 0) {
        body += `
Combo Offer: -${formatPrice(comboSavings)}`;
    }

    // Store discount
    if (bill.discount_percent > 0) {
        body += `
Store Discount (${bill.discount_percent}%): -${formatPrice(bill.discount_amount)}`;
    }

    body += `
Total Paid: ${formatPrice(bill.final_amount)}
Payment Mode: ${bill.payment_mode?.toUpperCase() || 'Cash'}`;

    // Total savings
    const totalSavings = comboSavings + bill.discount_amount;
    if (totalSavings > 0) {
        body += `

You saved ${formatPrice(totalSavings)} on this visit!`;
    }

    body += `

We hope you enjoyed your experience!
See you again soon.

Best regards,
Velvet Family Salon Team`;

    return body;
}

export default BillReceipt;
