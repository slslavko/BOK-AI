"use client";
import { useState } from "react";
import { mockKnowledgeDocs } from "@/lib/mockData";
import { motion } from "framer-motion";
import { KnowledgeFilters } from "@/components/AdvancedFilters";
import DataExport from "@/components/DataExport";

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const filteredDocs = mockKnowledgeDocs.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
    doc.category.toLowerCase().includes(search.toLowerCase())
  );
  const selectedDoc =
    filteredDocs.find(doc => doc.id === selectedDocId) ||
    filteredDocs[0] ||
    null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <KnowledgeFilters value={search} onChange={setSearch} />
          <div className="flex justify-end">
            <DataExport />
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-white/10 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 flex flex-col gap-4 min-h-[220px]">
          <div className="font-semibold text-gray-700 dark:text-white/80 mb-2">Załadowane dokumenty</div>
          <div className="flex flex-col gap-2">
            {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={`bg-white dark:bg-white/10 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10 flex flex-col gap-1 text-left transition ${selectedDocId === doc.id ? "ring-2 ring-violet-400" : ""}`}
                onClick={() => setSelectedDocId(doc.id)}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{doc.name}</span>
                  <span className="text-xs text-gray-500 dark:text-white/60">{doc.category}</span>
                  <span className="flex gap-1 ml-auto">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 text-xs font-medium">{tag}</span>
                    ))}
                  </span>
                </div>
                <div className="text-gray-700 dark:text-white/70 text-xs truncate">{doc.content}</div>
              </motion.button>
            )) : <div className="text-gray-400 dark:text-white/40 text-center py-8">Brak dokumentów w bazie wiedzy</div>}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 min-h-[120px] flex flex-col gap-4">
        <div className="font-semibold text-gray-700 dark:text-white/80 mb-2">Przeszukaj bazę wiedzy</div>
        <div className="text-gray-800 dark:text-white/80 mt-2 min-h-[40px]">
          {selectedDoc ? (
            <>
              <div className="font-bold text-violet-700 dark:text-violet-300 mb-1">{selectedDoc.name}</div>
              <div className="text-xs text-gray-500 dark:text-white/60 mb-2">{selectedDoc.category} | {selectedDoc.tags.join(", ")}</div>
              <div className="text-sm text-gray-900 dark:text-white/90 whitespace-pre-line">{selectedDoc.content}</div>
            </>
          ) : (
            <span className="text-gray-400 dark:text-white/40">Wybierz dokument, aby zobaczyć podgląd</span>
          )}
        </div>
      </div>
    </div>
  );
} 