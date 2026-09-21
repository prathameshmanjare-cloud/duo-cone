"""PDF invoice generated for an order once it is marked paid.

Layout is pinned to the client-approved template
(``Invoice-templatepdf.pdf``) — logo top-left, date block top-right,
seller/buyer two-column block, centered "Invoice" title, line-item
table, totals, order number. Keep this in sync with that template if
it ever changes.
"""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from fpdf import FPDF

from app.config.settings import get_settings
from app.models.commerce import Order

settings = get_settings()

_LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "invoice_logo.png"
_LOGO_W_MM = 55
_LOGO_H_MM = 19  # matches the source logo's aspect ratio (368x128)


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


def build_invoice_pdf(order: Order) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
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
            f"Date of sale: {created_str}\n"
            f"Issue date: {paid_str}\n"
            f"Due date: {due_str}\n"
            f"Payment method: {'Card' if order.payment_method == 'card' else 'Bank transfer / invoice'}"
        ),
        align="R",
    )
    pdf.set_y(y_top + max(_LOGO_H_MM, 22) + 6)

    col_w = 95

    seller_lines = [settings.invoice_seller_name, settings.invoice_seller_address,
                     f"VAT Number: {settings.invoice_seller_vat_id}"]
    if settings.invoice_seller_bank_name:
        seller_lines.append(f"Bank: {settings.invoice_seller_bank_name}")
    if settings.invoice_seller_bank_iban:
        seller_lines.append(f"Account number: {settings.invoice_seller_bank_iban}")

    buyer_lines = _address_lines(order.billing_address or order.shipping_address)

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
    pdf.cell(0, 10, "Invoice", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    headers = ["#", "Name", "Qty", "Unit price", "Net", "Gross"]
    widths = [8, 82, 14, 26, 26, 26]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(235, 235, 235)
    for h, w in zip(headers, widths):
        pdf.cell(w, 7, h, border=1, fill=True, align="C")
    pdf.ln(7)

    pdf.set_font("Helvetica", "", 9)
    for idx, item in enumerate(order.items, start=1):
        unit = _money(item.unit_price_cents, order.currency)
        net = _money(item.total_cents, order.currency)
        row = [str(idx), _latin1(item.name)[:55], str(item.qty), unit, net, net]
        for val, w, align in zip(row, widths, ["C", "L", "C", "R", "R", "R"]):
            pdf.cell(w, 6, val, border=1, align=align)
        pdf.ln(6)

    pdf.set_font("Helvetica", "B", 9)
    total = _money(order.total_cents, order.currency)
    pdf.cell(sum(widths[:4]), 7, "TOTAL", border=1, align="R")
    pdf.cell(widths[4], 7, total, border=1, align="R")
    pdf.cell(widths[5], 7, total, border=1, align="R")
    pdf.ln(10)

    pdf.set_font("Helvetica", "B", 10)
    paid = total if order.status.value == "paid" else _money(0, order.currency)
    pdf.cell(0, 6, _latin1(f"Total: {total}     Paid: {paid}     Due: {_money(0, order.currency)}"), new_x="LMARGIN", new_y="NEXT")
    if order.vat_reverse_charge:
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 6, "VAT reverse-charged to the buyer (intra-EU B2B).", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Order number: {order.number}", new_x="LMARGIN", new_y="NEXT")

    out = pdf.output()
    return bytes(out)
