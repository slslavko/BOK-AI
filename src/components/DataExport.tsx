'use client';

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface DataExportProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function DataExport({ dateFrom, dateTo }: DataExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const blob = await apiClient.exportThreadsToCSV(dateFrom, dateTo);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rozmowy_allegro_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Błąd eksportu. Sprawdź połączenie z Allegro.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={exporting}
      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-green-700 transition mb-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Eksportuję...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Eksportuj dane do CSV
        </>
      )}
    </button>
  );
} 