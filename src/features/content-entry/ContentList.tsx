import { useState } from 'react';
import type { ContentEntry } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { ContentForm } from './ContentForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const ContentList = () => {
  const { contentEntries, addContentEntry, updateContentEntry, deleteContentEntry } = useData();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContentEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const filteredEntries = contentEntries.filter(
    (entry: ContentEntry) =>
      entry.contentName.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleEdit = (entry: ContentEntry) => { setEditingEntry(entry); setIsFormOpen(true); };
  
  const handleDelete = (entry: ContentEntry) => {
    setDeletingId(entry.id);
    setDeleteMessage(`Are you sure you want to delete content type "${entry.contentName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => { if (deletingId) deleteContentEntry(deletingId); setDeletingId(null); setIsConfirmOpen(false); };
  const handleCreateNew = () => { setEditingEntry(undefined); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingEntry(undefined); };
  const handleFormSave = (savedEntry: ContentEntry) => { if (editingEntry) updateContentEntry(savedEntry); else addContentEntry(savedEntry); handleFormClose(); };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        {/* LEFT: Search */}
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Search by Content Name or Short Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        {/* RIGHT: Create */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button variant="primary" onClick={handleCreateNew}>
            + Add Content
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Content Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Short Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.contentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{entry.shortName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                    <button onClick={() => handleDelete(entry)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((entry, index) => (
            <div key={entry.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                  <div className="text-lg font-semibold">{entry.contentName}</div>
                  <div className="text-sm text-muted-foreground">Short: {entry.shortName}</div>
                </div>
                <div className="flex flex-col space-y-3 pt-1">
                  <button onClick={() => handleEdit(entry)} className="text-blue-600"><FilePenLine size={18} /></button>
                  <button onClick={() => handleDelete(entry)} className="text-destructive"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-muted p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {filteredEntries.length === 0 && <div className="text-center py-12 text-muted-foreground">No content entries found.</div>}
      {isFormOpen && <ContentForm initialData={editingEntry} onClose={handleFormClose} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Content Entry" 
        description={deleteMessage} 
      />
    </div>
  );
};