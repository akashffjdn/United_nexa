// src/features/trip-sheet-entry/TripSheetPrintCopy.tsx
import React from "react";
import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { numberToWordsInRupees } from "../../utils/toWords";

interface Props {
  sheet: TripSheetEntry;
}

/**
 * TripSheetPrintCopy
 * - Single A4 page layout
 * - Top "TRIP SHEET" heading outside the 2px box (per your screenshot)
 * - 2px border around content
 * - Vertical column lines only in the table, 15 rows total (filler rows if fewer)
 * - Bottom/total row and immediate footer with dashed fill-in-the-blanks
 */
export const TripSheetPrintCopy: React.FC<Props> = ({ sheet }) => {
  const fmtDate = (d?: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${String(dt.getDate()).padStart(2, "0")}/${String(
      dt.getMonth() + 1
    ).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const total = sheet.totalAmount ?? 0;
  const totalWords = numberToWordsInRupees(total);

  // Ensure 15 visible rows (items + filler)
  const visibleRowCount = 15;
  const items: TripSheetGCItem[] = sheet.items ?? [];
  const fillerCount = Math.max(0, visibleRowCount - items.length);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>
        {`
        /* Print / page sizing */
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-wrapper {
            margin: 0;
            padding: 0;
          }
        }

        /* Outer page heading (outside the 2px box) */
        .page-heading {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 6px;
        }

        /* Outer 2px border box */
        .box {
          border: 2px solid #000;
          padding: 10px;
          box-sizing: border-box;
          width: 100%;
        }

        /* Top header area inside box */
        .header-flex {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap: 12px;
        }
        .company-block { width: 68%; }
        .company-title { font-weight: 900; font-size: 20px; letter-spacing: 0.4px; }
        .company-sub { font-size: 11px; margin-top: 4px; }

        .meta-block { width: 32%; text-align: right; font-size: 12px; }

        /* From/To/Date row */
        .fromto {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-top:8px;
          padding:6px 2px;
          font-weight:700;
          border-top: 1px solid #000;
        }

        /* TABLE: column lines only */
        .ts-table {
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 8px;
          font-size: 12px;
        }

        /* Top header line (single) */
        .ts-table thead th {
          padding:8px 6px;
          text-align:left;
          font-weight:700;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }

        /* Column separators (vertical lines) */
        .ts-table tbody td,
        .ts-table thead th {
          border-left: 1px solid #000;
        }
        /* first column needs left border as well to match screenshot */
        .ts-table thead th:first-child,
        .ts-table tbody td:first-child {
          border-left: 1px solid #000;
        }
        /* right-most border */
        .ts-table thead th:last-child,
        .ts-table tbody td:last-child {
          border-right: 1px solid #000;
        }

        /* Remove horizontal lines between rows (no border-bottom on tbody rows)
           but keep a strong bottom border for the table itself and a top border for header. */
        .ts-table tbody td {
          padding:9px 6px;
          border-bottom: none;
          vertical-align: top;
        }

        /* Table bottom line above footer */
        .ts-table__bottom {
          border-top: 2px solid #000; /* separates rows area and total bar */
          margin-top: 0;
        }

        /* Total row style */
        .total-row td {
          padding:8px 6px;
          font-weight:800;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;

        }
        .total-row .total-label { text-align:right; }
        .total-row .total-amt { text-align:right; white-space:nowrap; }

        /* Footer paragraph and dashed fill-in blanks */
        .footer {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.4;
        }
        .dash {
          display:inline-block;
          padding:0 6px;
          border-bottom:1px dashed #000;
          margin:0 6px;
          min-width: 120px;
        }
        .dash.bold { font-weight:700; }

        /* Driver / Owner / Lorry grid with dashed underlines for values */
        .trip-footer-grid {
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          font-size: 12px;
        }
        .trip-footer-grid .col-line { border-bottom:1px dashed #000; padding-bottom:4px; display:inline-block; min-width:160px; }

        /* Small legal paragraph above signatures */
        .legal {
          margin-top: 10px;
          font-size: 11px;
          text-align: left;
        }

        /* Signature lines */
        .sigs {
          display:flex;
          justify-content:space-between;
          margin-top: 14px;
        }
        .sig-box { width:45%; text-align:center; }
        .sig-line { display:block; margin: 0 auto 6px; width: 70%; border-top:1px solid #000; height: 2px; }

        /* ensure no big gap below table (page flow) */
        .no-gap { margin-bottom: 0; padding-bottom: 0; }
      `}
      </style>

      {/* Heading outside the 2px box */}
      <div className="page-heading">TRIP SHEET</div>

      <div className="box">
        {/* Header */}
        <div className="header-flex">
          <div className="company-block">
            <div style={{ fontSize: 11 }}>GSTIN:33ABLPV5082H3Z8 &nbsp; Mobile: 9787718433</div>
            <div className="company-title">UNITED TRANSPORT COMPANY</div>
            <div className="company-sub">164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123</div>
          </div>

          <div className="meta-block">
            <div><strong>M.F. No. :</strong> {sheet.mfNo}</div>
            <div><strong>Carriers:</strong> {sheet.carriers ?? ""}</div>
            <div style={{ marginTop: 6 }}>{/* small spacer */}</div>
          </div>
        </div>

        {/* From / To / Date bar */}
        <div className="fromto">
          <div><strong>From :</strong> {sheet.fromPlace}</div>
          <div style={{ textAlign: "center" }}><strong>To :</strong> {sheet.toPlace}</div>
          <div style={{ textAlign: "right" }}><strong>Date :</strong> {fmtDate(sheet.tsDate)}</div>
        </div>

        {/* Table with vertical column lines only */}
        <table className="ts-table" aria-hidden>
          <thead>
            <tr>
              <th style={{ width: "10%" }}>C.N.No.</th>
              <th style={{ width: "12%" }}>No. of Packages</th>
              <th style={{ width: "15%" }}>Contents</th>
              <th style={{ width: "28%" }}>Consignor</th>
              <th style={{ width: "28%" }}>Consignee</th>
              <th style={{ width: "15%", textAlign: "right" }}>To Pay</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "left" }}>{it.gcNo}</td>
                <td style={{ textAlign: "left" }}>
                  {/* Show qty + unit in same cell */}
                  {it.qty} {it.packingDts ?? ""}
                </td>
                <td>{it.contentDts ?? ""}</td>
                <td>{it.consignor ?? ""}</td>
                <td>{it.consignee ?? ""}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  ₹{(it.amount ?? 0).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}

            {/* filler rows to reach visibleRowCount */}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`f-${i}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* total row with top border to separate from rows */}
            <tr className="total-row">
              <td colSpan={5} className="total-label">TOTAL</td>
              <td className="total-amt">₹{total.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        {/* small horizontal rule under table (visual separation) */}
        <div style={{ borderTop: "2px solid #000", marginTop: 6 }} />

        {/* Footer paragraph: same line for unload place and lorry hire amount (dashed blanks) */}
        <div className="footer no-gap">
          Goods have been loaded in good condition. All Checkpost papers have been handed over to the truck driver.
          Goods to be unloaded at<span className="dash bold">{sheet.unloadPlace     ?? sheet.toPlace}</span>
          &nbsp;&nbsp; Please pay lorry hire Rs. <span className="dash bold">₹{total.toLocaleString("en-IN")}</span>
          &nbsp;&nbsp; <strong>{totalWords}</strong> on receiving the goods in sound condition.
        </div>
        
        <div style={{ borderTop: "1px solid #000", marginTop: 10, paddingTop: 8 }}>

        {/* Driver / Owner / Lorry block with dashed underlines for values */}
        <div className="trip-footer-grid font-thin">
          <div>
            <div><strong>Driver Name</strong> <span className="col-line font-semibold">{sheet.driverName    ?? ""}</span></div>
            <div style={{ marginTop: 6 }}>
              <strong>D.L.No.</strong> <span className="col-line font-semibold">{sheet.dlNo ?? ""}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Driver number</strong> <span className="col-line font-semibold">{sheet.driverMobile ?? ""}</span>
            </div>
          </div>

          <div>
            <div><strong>Owner Name</strong> <span className="col-line font-semibold">{sheet.ownerName ?? ""}</span></div>
            <div style={{ marginTop: 6 }}>
              <strong>Owner number</strong> <span className="col-line font-semibold">{sheet.ownerMobile ?? ""}</span>
            </div>
          </div>

          <div>
            <div><strong>Lorry No.</strong> <span className="col-line font-semibold">{sheet.lorryNo ?? ""}</span></div>
            <div style={{ marginTop: 6 }}>
              <strong>Lorry Name</strong> <span className="col-line font-semibold">{sheet.lorryName ?? ""}</span>
            </div>
          </div>
        </div>
        </div>

        {/* thin separator line above legal paragraph and signatures */}
        <div style={{ borderTop: "1px solid #000", marginTop: 10, paddingTop: 8 }}>
          {/* legal paragraph */}
          <div className="legal">
            I have received the goods noted above in good and condition along with the documents. I am responsible for the safe delivery at the destination.
            All risks and expenses EN ROUTE will be of the driver. Transit risks are covered by driver/owner.
            Received all the related documents & goods intact. We will not be responsible for the unloading on holidays.
          </div>

          {/* Signatures in same section */}
          <div className="sigs">
            <div className="sig-box">
              <span className="sig-line" />
              Signature of the Owner/Driver/Broker
            </div>
            <div className="sig-box">
              <span className="sig-line" />
              Signature of the Booking Clerk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSheetPrintCopy;
