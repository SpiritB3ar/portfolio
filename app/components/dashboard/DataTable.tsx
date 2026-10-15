"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Inbox, Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Modal from "../modal/Modal";
import { toast } from "sonner";
import { getAdminApiKey } from "@/lib/admin-auth";
import { readErrorMessage } from "@/lib/request-util";

type DataTableProps<TData> = {
  entityName: string;
  data: TData[];
  columns: ColumnDef<TData, any>[];
  apiEndpoint: string;
  FormComponent: React.ComponentType<{
    initialData?: any;
    onSubmit: (data: any) => void;
  }>;
  onDataUpdate: () => void;
  loading?: boolean;
};

function DataTable<TData>({
  entityName,
  data,
  columns,
  apiEndpoint,
  FormComponent,
  onDataUpdate,
  loading = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<TData | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const allColumns: ColumnDef<TData, any>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original as any;
        const itemName = item.title || item.name || entityName;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditData(row.original);
                setIsModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteSlug(item.slug || item.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleFormSubmit = async (formData: any) => {
    try {
      const method = editData ? "PUT" : "POST";
      const url = editData
        ? `${apiEndpoint}/${(editData as any).slug || (editData as any).id}`
        : apiEndpoint;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getAdminApiKey(),
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to save the ${entityName}`));
      }
      toast.success(`${entityName} ${editData ? "updated" : "created"} successfully`);
      setIsModalOpen(false);
      setEditData(null);
      onDataUpdate();
    } catch (error) {
      toast.error(`Failed to save ${entityName}`, {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;
    try {
      const response = await fetch(`${apiEndpoint}/${deleteSlug}`, {
        method: "DELETE",
        headers: { "x-api-key": getAdminApiKey() },
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to delete the ${entityName}`));
      }
      toast.success(`${entityName} deleted successfully`);
      onDataUpdate();
    } catch (error) {
      toast.error(`Failed to delete ${entityName}`, {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeleteSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No {entityName.toLowerCase()}s yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first {entityName.toLowerCase()}
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create {entityName}
          </Button>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditData(null); }}
          title={`Create New ${entityName}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditData(null); }}>
                Cancel
              </Button>
              <Button type="submit" form="datatable-form">
                Save
              </Button>
            </div>
          }
        >
          <FormComponent onSubmit={handleFormSubmit} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${entityName.toLowerCase()}s...`}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add {entityName}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? "flex cursor-pointer select-none items-center gap-1" : ""}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} result(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        title={editData ? `Edit ${entityName}` : `Create New ${entityName}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditData(null); }}>
              Cancel
            </Button>
            <Button type="submit" form="datatable-form">
              Save
            </Button>
          </div>
        }
      >
        <FormComponent initialData={editData as any} onSubmit={handleFormSubmit} />
      </Modal>

      <AlertDialog open={!!deleteSlug} onOpenChange={() => setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {entityName.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DataTable;
