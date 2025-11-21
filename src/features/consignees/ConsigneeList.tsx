import { useState, useMemo } from 'react';
import type { Consignee } from '../../types';
import { FilePenLine, Trash2, Search, Filter, XCircle, RotateCcw } from 'lucide-react';
import { ConsigneeForm } from './ConsigneeForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const ConsigneeList = () => {
  const { consignees, addConsignee, updateConsignee, deleteConsignee } = useData();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState<Consignee | undefined>(undefined);

  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState(""); // Dynamic message

  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
  };

  const filteredConsignees = useMemo(() => {
    return consignees.filter(
      c => 
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        c.destination.toLowerCase().includes(search.toLowerCase())) &&
        (() => {
          const date = c.filingDate;
          switch (filterType) {
            case 'today': return date === getTodayDate();
            case 'yesterday': return date === getYesterdayDate();
            case 'week': return isDateInLast7Days(date);
            case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
            default: return true;
          }
        })()
    );
  }, [consignees, search, filterType, customStart, customEnd]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredConsignees, initialItemsPerPage: 10 });

  const handleEdit = (consignee: Consignee) => { setEditingConsignee(consignee); setIsFormOpen(true); };
  
  const handleDelete = (consignee: Consignee) => {
    setDeletingId(consignee.id);
    setDeleteMessage(`Are you sure you want to delete consignee "${consignee.name}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => { if (deletingId) deleteConsignee(deletingId); setIsConfirmOpen(false); setDeletingId(null); };
  const handleCreateNew = () => { setEditingConsignee(undefined); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingConsignee(undefined); };
  
  const handleFormSave = (savedConsignee: Consignee) => {
    const exists = consignees.some(c => c.id === savedConsignee.id);
    if (exists) updateConsignee(savedConsignee);
    else addConsignee(savedConsignee);
    handleFormClose();
  };

  const hasActiveFilters = filterType !== 'all' || search !== '';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        
        {/* LEFT: Search + Filter Toggle */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Name, Mobile, or Destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <Button 
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        {/* RIGHT: Create Button */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button variant="primary" onClick={handleCreateNew}>
            + Add Consignee
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium">
                <RotateCcw size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><XCircle size={18} /></button>
            </div>
          </div>
          <DateFilterButtons
            filterType={filterType}
            setFilterType={setFilterType}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />
        </div>
      )}

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mobile Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((consignee, index) => (
                <tr key={consignee.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(consignee)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                    <button onClick={() => handleDelete(consignee)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((consignee, index) => (
            <div key={consignee.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                  <div className="text-lg font-semibold text-foreground">{consignee.name}</div>
                  <div className="text-sm text-muted-foreground">{consignee.phone}</div>
                  <div className="text-sm text-muted-foreground">To: {consignee.destination}</div>
                </div>
                <div className="flex flex-col space-y-3 pt-1">
                  <button onClick={() => handleEdit(consignee)} className="text-blue-600"><FilePenLine size={18} /></button>
                  <button onClick={() => handleDelete(consignee)} className="text-destructive"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-muted p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {filteredConsignees.length === 0 && <div className="text-center py-12 text-muted-foreground">No consignees found.</div>}
      {isFormOpen && <ConsigneeForm initialData={editingConsignee} onClose={handleFormClose} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Consignee" 
        description={deleteMessage} 
      />
    </div>
  );
};