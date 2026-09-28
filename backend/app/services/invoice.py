"""PDF invoice generated for an order once it is marked paid.

Layout is pinned to the client-approved template
(``Invoice-templatepdf.pdf``) — logo top-left, date block top-right,
seller/buyer two-column block, centered "Invoice" title, line-item
table, totals, order number. Keep this in sync with that template if
it ever changes.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from pathlib import Path

from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.models.commerce import Order, invoice_number_seq
from app.services.shipping import DE_VAT_RATE, EU_COUNTRIES

settings = get_settings()
logger = logging.getLogger("duocon.invoice")

_LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "invoice_logo.png"
_LOGO_W_MM = 55
_LOGO_H_MM = 19.1  # matches the source logo's aspect ratio (1024x356)


def _latin1(text: str) -> str:
    return text.encode("latin-1", "replace").decode("latin-1")


def _money(cents: int, currency: str) -> str:
    return f"{cents / 100:,.2f} {currency}"


def _address_lines(addr: dict) -> list[str]:
    lines = [addr.get("company") or addr.get("name") or ""]
    if addr.get("company") and addr.get("name"):
        lines.append(addr["name"])
    lines.append(addr.get("line1", ""))
    if addr.get("line2"):
        lines.append(addr["line2"])
    lines.append(f"{addr.get('postal_code', '')} {addr.get('city', '')}".strip())
    lines.append(addr.get("country_code", ""))
    return [_latin1(l) for l in lines if l]


async def assign_invoice_number(db: AsyncSession, order: Order) -> None:
    """Give the order its invoice number if it has none. Caller commits."""
    if order.invoice_number:
        return
    seq = await db.scalar(invoice_number_seq.next_value())
    year = (order.paid_at or order.created_at).year
    order.invoice_number = f"INV-{year}-{seq:05d}"


def _vat_rate_label(order: Order) -> str:
    return f"{round(DE_VAT_RATE * 100)}%" if order.tax_cents else "0%"


def _vat_note(order: Order) -> str:
    """Legal basis for a 0% VAT invoice (§ 14 (4) no. 8 UStG)."""
    if order.tax_cents:
        return ""
    country = (order.shipping_address or {}).get("country_code", "").upper()
    if order.vat_reverse_charge:
        return (
            "Tax-exempt intra-Community supply (§ 4 no. 1b, § 6a UStG; Art. 138 Directive 2006/112/EC). "
            f"Buyer VAT ID: {order.vat_id}. Seller VAT ID: {settings.invoice_seller_vat_id}."
        )
    if country and country not in EU_COUNTRIES:
        return "Tax-exempt export delivery to a non-EU country (§ 4 no. 1a, § 6 UStG)."
    return ""


def build_invoice_pdf(order: Order) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=30)
    pdf.add_page()

    y_top = pdf.get_y()
    if _LOGO_PATH.exists():
        pdf.image(str(_LOGO_PATH), x=15, y=y_top, w=_LOGO_W_MM, h=_LOGO_H_MM)
    else:
        pdf.set_font("Helvetica", "B", 20)
        pdf.cell(0, 10, "DUO-CONE", new_x="LMARGIN", new_y="NEXT")

    paid_str = order.paid_at.strftime("%Y-%m-%d") if order.paid_at else ""
    created_str = order.created_at.strftime("%Y-%m-%d")
    due_str = (order.paid_at or order.created_at + timedelta(days=30)).strftime("%Y-%m-%d")
    pdf.set_xy(15, y_top)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        0, 5,
        _latin1(
            f"Invoice number: {order.invoice_number or ''}\n"
            f"Date of sale: {created_str}\n"
            f"Issue date: {paid_str}\n"
            f"Due date: {due_str}\n"
            f"Payment method: {'Card' if order.payment_method == 'card' else 'Bank transfer / invoice'}"
        ),
        align="R",
    )
    pdf.set_y(y_top + max(_LOGO_H_MM, 27) + 6)

    col_w = 95

    seller_lines = [settings.invoice_seller_name, settings.invoice_seller_address,
                     f"VAT Number: {settings.invoice_seller_vat_id}"]

    buyer_lines = _address_lines(order.billing_address or order.shipping_address)
    if order.vat_id:
        buyer_lines.append(_latin1(f"VAT Number: {order.vat_id}"))

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(col_w, 6, "Seller:")
    pdf.set_x(15 + col_w)
    pdf.cell(0, 6, "Buyer:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    for i in range(max(len(seller_lines), len(buyer_lines))):
        pdf.cell(col_w, 5, _latin1(seller_lines[i]) if i < len(seller_lines) else "")
        pdf.set_x(15 + col_w)
        pdf.cell(0, 5, buyer_lines[i] if i < len(buyer_lines) else "", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 20)
    title = f"Invoice {order.invoice_number}" if order.invoice_number else "Invoice"
    pdf.cell(0, 10, _latin1(title), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    cur = order.currency
    vat_rate = _vat_rate_label(order)
    headers = ["#", "Description", "Qty", "Unit price (net)", "VAT", "Amount (net)"]
    widths = [8, 84, 14, 30, 14, 30]  # 180mm = A4 minus 15mm margins
    aligns = ["C", "L", "C", "R", "C", "R"]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(235, 235, 235)
    for h, w in zip(headers, widths):
        pdf.cell(w, 7, h, border=1, fill=True, align="C")
    pdf.ln(7)

    rows = [
        (_latin1(f"{item.name} ({item.sku})")[:60], item.qty, item.unit_price_cents, item.total_cents)
        for item in order.items
    ]
    if order.shipping_cents:
        rows.append((_latin1(f"Shipping{f' - {order.shipping_method}' if order.shipping_method else ''}")[:60],
                     1, order.shipping_cents, order.shipping_cents))
    if order.discount_cents:
        rows.append(("Discount", 1, -order.discount_cents, -order.discount_cents))

    pdf.set_font("Helvetica", "", 9)
    for idx, (name, qty, unit_cents, line_cents) in enumerate(rows, start=1):
        row = [str(idx), name, str(qty), _money(unit_cents, cur), vat_rate, _money(line_cents, cur)]
        for val, w, align in zip(row, widths, aligns):
            pdf.cell(w, 6, val, border=1, align=align)
        pdf.ln(6)
    pdf.ln(4)

    net_cents = order.subtotal_cents + order.shipping_cents - order.discount_cents
    gross_cents = net_cents + order.tax_cents
    if gross_cents != order.total_cents:
        logger.warning("Invoice %s: net+VAT %s != order total %s", order.number, gross_cents, order.total_cents)
    paid_cents = order.total_cents if order.paid_at else 0

    label_w, value_w = 60, 30
    x_label = pdf.l_margin + sum(widths) - label_w - value_w

    def total_line(label: str, cents: int, bold: bool = False, rule: bool = False) -> None:
        if rule:
            pdf.line(x_label, pdf.get_y(), x_label + label_w + value_w, pdf.get_y())
        pdf.set_x(x_label)
        pdf.set_font("Helvetica", "B" if bold else "", 10 if bold else 9)
        pdf.cell(label_w, 6, _latin1(label), align="R")
        pdf.cell(value_w, 6, _money(cents, cur), align="R", new_x="LMARGIN", new_y="NEXT")

    total_line("Subtotal goods (net)", order.subtotal_cents)
    if order.shipping_cents:
        total_line("Shipping (net)", order.shipping_cents)
    if order.discount_cents:
        total_line("Discount", -order.discount_cents)
    total_line("Total net", net_cents, rule=True)
    total_line(f"VAT {vat_rate} on {_money(net_cents, cur)}", order.tax_cents)
    total_line("Total gross", order.total_cents, bold=True, rule=True)
    total_line("Paid", paid_cents)
    total_line("Amount due", order.total_cents - paid_cents, bold=True)

    note = _vat_note(order)
    if note:
        pdf.ln(3)
        pdf.set_font("Helvetica", "", 8)
        pdf.multi_cell(0, 4, _latin1(note), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Order number: {order.number}", new_x="LMARGIN", new_y="NEXT")

    _draw_footer(pdf)

    out = pdf.output()
    return bytes(out)


def _draw_footer(pdf: FPDF) -> None:
    pdf.set_auto_page_break(auto=False)
    y = pdf.h - 24
    pdf.set_draw_color(200, 200, 200)
    pdf.line(15, y, pdf.w - 15, y)

    pdf.set_xy(15, y + 2)
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(0, 4, _latin1(settings.invoice_seller_footer_contact), align="C", new_x="LMARGIN", new_y="NEXT")

    y2 = y + 8
    left_lines = [
        f"USt-IdNr. {settings.invoice_seller_vat_id}",
        f"HRB {settings.invoice_seller_hrb}" if settings.invoice_seller_hrb else "",
        f"Geschäftsführer: {settings.invoice_seller_managers}" if settings.invoice_seller_managers else "",
    ]
    left_lines = [l for l in left_lines if l]
    pdf.set_xy(15, y2)
    pdf.set_font("Helvetica", "", 7)
    pdf.multi_cell(90, 4, _latin1("\n".join(left_lines)))

    if settings.invoice_seller_bank_name:
        # columns end at the 15mm right margin (105 + 25 + 25 + 40 = 195)
        pdf.set_xy(105, y2)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(25, 4, "Bank")
        pdf.cell(25, 4, "BIC")
        pdf.cell(40, 4, "IBAN", new_x="LMARGIN", new_y="NEXT")
        pdf.set_xy(105, y2 + 4)
        pdf.set_font("Helvetica", "", 7)
        pdf.cell(25, 4, _latin1(settings.invoice_seller_bank_name))
        pdf.cell(25, 4, _latin1(settings.invoice_seller_bank_bic))
        pdf.cell(40, 4, _latin1(settings.invoice_seller_bank_iban))

    pdf.set_text_color(0, 0, 0)
