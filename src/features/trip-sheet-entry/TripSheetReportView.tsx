// src/features/trip-sheet-entry/TripSheetReportView.tsx
import { useSearchParams } from "react-router-dom";
import { useData } from "../../hooks/useData";
import { useEffect, useMemo } from "react";
import type { TripSheetEntry } from "../../types";

export const TripSheetReportView = () => {
  const [searchParams] = useSearchParams();
  const { getTripSheet } = useData();

  // Read "?ts=1,2,3"
  const ids = useMemo(() => {
    const param = searchParams.get("ts");
    return param ? param.split(",") : [];
  }, [searchParams]);

  // Resolve trip sheets (type-safe)
  const sheets = useMemo(() => {
    return ids
      .map((id) => getTripSheet(id))
      .filter((t): t is TripSheetEntry => Boolean(t));
  }, [ids, getTripSheet]);

  // Auto-print
  useEffect(() => {
    if (sheets.length > 0) {
      setTimeout(() => window.print(), 300);
    }
  }, [sheets.length]);

  if (sheets.length === 0) {
    return (
      <div style={{ padding: 20, fontSize: 18, color: "red" }}>
        ❌ No TripSheets found.
      </div>
    );
  }

  return (
    <div className="report-container" style={{ padding: "20px" }}>
      <style>
        {`
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: Arial, Helvetica, sans-serif;
        }

        .report-title {
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        th, td {
          border: 1px solid #000;
          padding: 6px 8px;
        }

        th {
          background: #f2f2f2;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
        }

        td {
          font-size: 11px;
        }

        @media print {
          @page { size: A4; margin: 10mm; }
        }
      `}
      </style>

      <div className="report-title">TRIP SHEET REPORT</div>

      <table>
        <thead>
          <tr>
            <th>TS No</th>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Total Amount</th>
          </tr>
        </thead>

        <tbody>
          {sheets.map((ts) => (
            <tr key={ts.mfNo}>
              <td>{ts.mfNo}</td>
              <td>{ts.tsDate}</td>
              <td>{ts.fromPlace}</td>
              <td>{ts.toPlace}</td>
              <td>₹{(ts.totalAmount ?? 0).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
