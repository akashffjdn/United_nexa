import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalItems: number;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: PaginationProps) => {

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Left Side: Item Count */}
      <div className="text-sm text-muted-foreground w-full md:w-auto text-center md:text-left">
        Showing{' '}
        <span className="font-medium text-foreground">{totalItems > 0 ? startIndex : 0}</span>
        {' '}to{' '}
        <span className="font-medium text-foreground">{endIndex}</span>
        {' '}of{' '}
        <span className="font-medium text-foreground">{totalItems}</span>
        {' '}results
      </div>

      {/* Right Side: Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-4 sm:gap-6 w-full md:w-auto">
        
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 px-3 text-sm font-medium border border-border rounded-lg bg-background text-foreground cursor-pointer transition-all duration-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat pr-8"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={handleFirst}
            disabled={currentPage === 1}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border disabled:hover:text-muted-foreground"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border disabled:hover:text-muted-foreground"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Indicator */}
          <div className="flex items-center gap-1 px-3">
            <span className="h-9 min-w-[36px] flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              {currentPage}
            </span>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm text-muted-foreground font-medium">{totalPages || 1}</span>
          </div>

          {/* Next Page */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border disabled:hover:text-muted-foreground"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={handleLast}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border disabled:hover:text-muted-foreground"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};