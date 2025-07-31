
import React, { useState, useMemo } from 'react';
import type { DataTableColumn, SortConfig } from '../../types';

interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  initialSortConfig?: SortConfig<T>;
}

const SortArrow: React.FC<{ direction: 'ascending' | 'descending' }> = ({ direction }) => (
    <span className="ml-1">{direction === 'ascending' ? '▲' : '▼'}</span>
);

export function DataTable<T extends object>({ columns, data, initialSortConfig }: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSortConfig || null);

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle date sorting for "Needs Your Reply"
      if (sortConfig.key === 'received' && 'rawDate' in a && 'rawDate' in b) {
          const aDate = (a as any).rawDate as Date;
          const bDate = (b as any).rawDate as Date;
          if (aDate < bDate) return -1;
          if (aDate > bDate) return 1;
          return 0;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      }

      return String(aValue).localeCompare(String(bValue));
    });

    if (sortConfig.direction === 'descending') {
      sorted.reverse();
    }
    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="overflow-y-auto h-full">
      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.accessor)}
                scope="col"
                className={`px-4 py-3 ${column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600' : ''}`}
                onClick={() => column.sortable && requestSort(column.accessor)}
              >
                <div className="flex items-center">
                  {column.header}
                  {sortConfig && sortConfig.key === column.accessor && <SortArrow direction={sortConfig.direction} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 ${((row as any).important) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800'}`}>
              {columns.map((column) => (
                <td key={String(column.accessor)} className="px-4 py-3 text-slate-900 dark:text-white whitespace-nowrap">
                  {(column.accessor === 'subject' && (row as any).link) ? (
                    <a href={(row as any).link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {String(row[column.accessor])}
                    </a>
                  ) : (
                    String(row[column.accessor])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
