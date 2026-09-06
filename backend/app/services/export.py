"""Generic CSV / PDF table exporters used by the admin list endpoints."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime
from typing import Any, Sequence

from fastapi import Response
from fpdf import FPDF

Column = tuple[str, str]  # (key, header)


def _fmt(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (datetime, date)):
        return value.isoformat(sep=" ", timespec="minutes") if isinstance(value, datetime) else value.isoformat()
    if isinstance(value, float):
        return f"{value:g}"
    return str(value)


def rows_to_csv(rows: Sequence[dict], columns: Sequence[Column]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([header for _, header in columns])
    for row in rows:
        writer.writerow([_fmt(row.get(key)) for key, _ in columns])
    return buf.getvalue().encode("utf-8-sig")


def _latin1(text: str) -> str:
    return text.encode("latin-1", "replace").decode("latin-1")


def rows_to_pdf(title: str, rows: Sequence[dict], columns: Sequence[Column]) -> bytes:
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 9, _latin1(title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(
        0, 5,
        f"Generated {datetime.now().isoformat(sep=' ', timespec='seconds')} - {len(rows)} rows",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(2)

    usable = pdf.w - pdf.l_margin - pdf.r_margin
    col_w = usable / max(len(columns), 1)
    line_h = 6

    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(230, 230, 230)
    for _, header in columns:
        pdf.cell(col_w, line_h, _truncate(header, col_w, pdf), border=1, fill=True)
    pdf.ln(line_h)

    pdf.set_font("Helvetica", "", 8)
    for i, row in enumerate(rows):
        pdf.set_fill_color(248, 248, 248)
        fill = i % 2 == 1
        for key, _ in columns:
            pdf.cell(col_w, line_h, _truncate(_fmt(row.get(key)), col_w, pdf), border=1, fill=fill)
        pdf.ln(line_h)

    out = pdf.output()
    return bytes(out)


def _truncate(text: str, width_mm: float, pdf: FPDF) -> str:
    text = text.replace("\n", " ").replace("\r", " ")
    # latin-1 is fpdf core-font safe; drop anything outside it
    text = text.encode("latin-1", "replace").decode("latin-1")
    if pdf.get_string_width(text) <= width_mm - 2:
        return text
    while text and pdf.get_string_width(text + "…") > width_mm - 2:
        text = text[:-1]
    return text + "…"


def export_response(
    fmt: str,
    filename_stem: str,
    title: str,
    rows: Sequence[dict],
    columns: Sequence[Column],
) -> Response:
    if fmt == "pdf":
        data = rows_to_pdf(title, rows, columns)
        media = "application/pdf"
        ext = "pdf"
    else:
        data = rows_to_csv(rows, columns)
        media = "text/csv; charset=utf-8"
        ext = "csv"
    stamp = datetime.now().strftime("%Y%m%d-%H%M")
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename_stem}-{stamp}.{ext}"'},
    )
