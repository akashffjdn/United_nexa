import { useState, useEffect } from 'react';
import type { PackingEntry } from '../../types';
import { FilePenLine, Trash2, Search, Download } from 'lucide-react';
import { PackingUnitForm } from './PackingUnitForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import { CsvImporter } from '../../components/shared/CsvImporter';
import { useToast } from '../../contexts/ToastContext';

export const PackingEntryList = () => {
  // 🟢 Get importPackings from useData
  const { packingEntries, addPackingEntry, updatePackingEntry, deletePackingEntry, fetchPackingEntries, importPackings } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PackingEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // --- Fetch on Mount ---
  useEffect(() => {
    fetchPackingEntries();
  }, [fetchPackingEntries]);

  const filteredEntries = packingEntries.filter(
    (entry: PackingEntry) =>
      entry.packingName.toLowerCase().includes(search.toLowerCase()) ||
      entry.shortName.toLowerCase().includes(search.toLowerCase())
  );

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems
  } = usePagination({ data: filteredEntries, initialItemsPerPage: 10 });

  const handleEdit = (entry: PackingEntry) => { setEditingEntry(entry); setIsFormOpen(true); };
  
  const handleDelete = (entry: PackingEntry) => {
    setDeletingId(entry.id);
    setDeleteMessage(`Are you sure you want to delete packing type "${entry.packingName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => { if (deletingId) deletePackingEntry(deletingId); setDeletingId(null); setIsConfirmOpen(false); };
  const handleCreateNew = () => { setEditingEntry(undefined); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingEntry(undefined); };
  const handleFormSave = (entry: PackingEntry) => { if (editingEntry) updatePackingEntry(entry); else addPackingEntry(entry); handleFormClose(); };

  // 🟢 UPDATED: Use Single Bulk API Call
  const handleImport = async (data: PackingEntry[]) => {
    await importPackings(data);
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Packing Name', 'Short Name'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(p => [
        `"${p.packingName.replace(/"/g, '""')}"`,
        `"${p.shortName.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `packing_units_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- RESPONSIVE BUTTON STYLE HELPER ---
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        {/* LEFT: Search */}
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Search by Packing Name or Short Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        {/* RIGHT: Create */}
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            size="sm" 
            title="Export CSV"
            className={responsiveBtnClass}
          >
            <Download size={14} className="mr-1 sm:mr-2" /> Export
          </Button>
          
          <CsvImporter<PackingEntry>
            onImport={handleImport}
            existingData={packingEntries}
            label="Import" 
            className={responsiveBtnClass} 
            checkDuplicate={(newItem, existing) => 
                newItem.packingName.toLowerCase() === existing.packingName.toLowerCase() ||
                newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={(row) => {
                if (!row.packingname || !row.shortname) return null;
                return {
                    id: `pk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    packingName: row.packingname,
                    shortName: row.shortname
                };
            }}
          />
          
          <Button 
            variant="primary" 
            onClick={handleCreateNew}
            size="sm" 
            className={responsiveBtnClass}
          >
            + Add Packing
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Packing Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Short Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 text-sm font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-sm">{entry.packingName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.shortName}</td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => handleEdit(entry)} className="text-blue-600"><FilePenLine size={18} /></button>
                      <button onClick={() => handleDelete(entry)} className="text-destructive"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        No packing entries found.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((entry, index) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                    <div className="text-lg font-semibold">{entry.packingName}</div>
                    <div className="text-sm text-muted-foreground">Short: {entry.shortName}</div>
                  </div>
                  <div className="flex flex-col space-y-3 pt-1">
                    <button onClick={() => handleEdit(entry)} className="text-blue-600"><FilePenLine size={18} /></button>
                    <button onClick={() => handleDelete(entry)} className="text-destructive"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-muted-foreground">
                No packing entries found.
             </div>
          )}
        </div>

        {filteredEntries.length > 0 && (
          <div className="border-t border-muted p-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
          </div>
        )}
      </div>

      {isFormOpen && <PackingUnitForm initialData={editingEntry} onClose={handleFormClose} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Packing Entry" 
        description={deleteMessage} 
      />
    </div>
  );
};