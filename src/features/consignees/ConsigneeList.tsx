import { useState } from 'react';
import type { Consignee } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { ConsigneeForm } from './ConsigneeForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData'; // Import the new hook

export const ConsigneeList = () => {
  // Use global state from context instead of local state
  const { consignees, addConsignee, updateConsignee, deleteConsignee } = useData();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState<Consignee | undefined>(undefined);

  // State for Date Filters
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // State for Delete Confirmation
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConsignees = consignees.filter(
    c => 
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase())) &&
      // Date filter logic
      (() => {
        const date = c.filingDate;
        switch (filterType) {
          case 'today':
            return date === getTodayDate();
          case 'yesterday':
            return date === getYesterdayDate();
          case 'week':
            return isDateInLast7Days(date);
          case 'custom':
            return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
          case 'all':
          default:
            return true;
        }
      })()
  );

  const handleEdit = (consignee: Consignee) => {
    setEditingConsignee(consignee);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteConsignee(deletingId); // Use context function
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
  };
  
  const handleCreateNew = () => {
    setEditingConsignee(undefined);
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConsignee(undefined);
  };
  
  const handleFormSave = (savedConsignee: Consignee) => {
    if (editingConsignee) {
      updateConsignee(savedConsignee); // Use context function
    } else {
      addConsignee(savedConsignee); // Use context function
    }
    handleFormClose();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header: Title and Create Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-foreground">Consignees List</h1>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
        >
          + Create New Consignee
        </button>
      </div>

      {/* 2. Search and Filter Section */}
      <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Name, Mobile, or Destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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

      {/* 3. Responsive Data Display */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {filteredConsignees.map((consignee, index) => (
                <tr key={consignee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(consignee)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <FilePenLine size={18} />
                    </button>
                    <button onClick={() => handleDelete(consignee.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD LIST --- */}
        <div className="block md:hidden divide-y divide-muted">
          {filteredConsignees.map((consignee, index) => (
            <div key={consignee.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground">#{index + 1}</div>
                  <div className="text-lg font-semibold text-foreground">{consignee.name}</div>
                  <div className="text-sm text-muted-foreground">{consignee.phone}</div>
                  <div className="text-sm text-muted-foreground">To: {consignee.destination}</div>
                </div>
                <div className="flex flex-col space-y-3 pt-1">
                  <button onClick={() => handleEdit(consignee)} className="text-blue-600" title="Edit">
                    <FilePenLine size={18} />
                  </button>
                  <button onClick={() => handleDelete(consignee.id)} className="text-destructive" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No results message */}
      {filteredConsignees.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No consignees found for the selected filters.
        </div>
      )}

      {/* The Modal Form */}
      {isFormOpen && (
        <ConsigneeForm 
          initialData={editingConsignee}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {/* --- The Confirmation Dialog --- */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Consignee"
        description="Are you sure you want to delete this consignee? This action cannot be undone."
      />
    </div>
  );
};