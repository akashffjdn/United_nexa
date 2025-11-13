import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { GcPrintCopy } from './GcPrintCopy';
import type { GcEntry, Consignor, Consignee } from '../../types';

// This component fetches the data and loops through the selected GCs
export const GcPrintView = () => {
  const [searchParams] = useSearchParams();
  const { getGcEntry, consignors, consignees } = useData();
  
  const gcIds = useMemo(() => searchParams.get('ids')?.split(',') || [], [searchParams]);
  
  const printJobs = useMemo(() => {
    return gcIds.map(id => {
      const gc = getGcEntry(id);
      if (!gc) return null;
      
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      
      if (!consignor || !consignee) return null;
      
      return { gc, consignor, consignee };
    }).filter(Boolean) as { gc: GcEntry, consignor: Consignor, consignee: Consignee }[];
    
  }, [gcIds, getGcEntry, consignors, consignees]);

  // Trigger print dialog on load
  useEffect(() => {
    if (printJobs.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500); // Give a slight delay for content to render
    }
  }, [printJobs.length]);

  if (printJobs.length === 0) {
    return <div className="p-4">No valid GC Entries to print.</div>;
  }
  
  return (
    <div className="print-container">
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .print-page {
            page-break-after: always;
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
            border: none;
            box-shadow: none;
            margin: 0;
            padding: 10mm;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        @media screen {
          body {
            background: #eee;
          }
          .print-page {
            background: white;
            width: 210mm;
            height: 297mm;
            margin: 20px auto;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 10mm;
            box-sizing: border-box;
          }
        }
      `}</style>
      
      {printJobs.flatMap(({ gc, consignor, consignee }) => [
        <GcPrintCopy 
          key={`${gc.id}-consignor`} 
          gc={gc} 
          consignor={consignor} 
          consignee={consignee} 
          copyType="CONSIGNOR COPY" 
        />,
        <GcPrintCopy 
          key={`${gc.id}-consignee`} 
          gc={gc} 
          consignor={consignor} 
          consignee={consignee} 
          copyType="CONSIGNEE COPY" 
        />,
        <GcPrintCopy 
          key={`${gc.id}-lorry`} 
          gc={gc} 
          consignor={consignor} 
          consignee={consignee} 
          copyType="LORRY COPY" 
        />,
      ])}
    </div>
  );
};