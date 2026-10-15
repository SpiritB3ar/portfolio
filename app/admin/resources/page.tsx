"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { BookOpen } from 'lucide-react';
import Image from 'next/image';
import { fetchJSON } from '../../../lib/request-util';
import { ResourceType } from '../../../app/components/types/types';
import { formatTableDate } from '../../../lib/date-utils';
import ResourceForm from '../../admin/components/ResourceForm';
import DataTable from '@/app/components/dashboard/DataTable';
import PageHeader from '../components/PageHeader';

const fetchResources = async (): Promise<ResourceType[] | []> => {
  const data = await fetchJSON<ResourceType[]>("/api/resources");
  return data ?? [];
};

const resourceColumns: ColumnDef<ResourceType, any>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'author', header: 'Author' },
  {
    accessorKey: 'publishedAt',
    header: 'Published At',
    cell: ({ getValue }) => formatTableDate(getValue() as string),
  },
  {
    id: 'coverImage',
    header: 'Cover',
    accessorKey: 'coverImage',
    cell: ({ getValue }) => {
      const src = getValue() as string;
      return src ? (
        <Image src={src} width={40} height={40} alt="Cover" className="object-cover w-10 h-10 rounded" />
      ) : null;
    },
  },
  {
    id: 'category',
    header: 'Category',
    accessorFn: (row) => row.category?.name || '',
  },
];

const ResourcesAdmin = () => {
  const { isPending, isError, data: resources, error, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: fetchResources,
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Resources" description="Curate learning resources for your portfolio visitors" />
      <DataTable<ResourceType>
        entityName="Resource"
        data={resources ?? []}
        columns={resourceColumns}
        apiEndpoint="/api/resources"
        FormComponent={ResourceForm}
        onDataUpdate={refetch}
        loading={isPending}
      />
    </div>
  );
};

export default ResourcesAdmin;
