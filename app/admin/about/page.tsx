"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { UserRound } from 'lucide-react';
import { fetchJSON } from '../../../lib/request-util';
import DataTable from '@/app/components/dashboard/DataTable';
import { AboutType } from '../../components/types/types';
import AboutForm from '../components/AboutForm';
import PageHeader from '../components/PageHeader';

type AboutRow = AboutType & { id: string };

const fetchAbout = async (): Promise<AboutRow[]> => {
  const data = await fetchJSON<AboutRow[]>("/api/about-me");
  return data ?? [];
};

const aboutColumns: ColumnDef<AboutRow, any>[] = [
  {
    accessorKey: 'paragraph',
    header: 'Paragraph',
    cell: ({ getValue }) => {
      const value = (getValue() as string) || '';
      return value.length > 120 ? `${value.slice(0, 120)}…` : value;
    },
  },
];

const AboutAdmin = () => {
  const { isPending, data: paragraphs, refetch } = useQuery({
    queryKey: ['about'],
    queryFn: fetchAbout,
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={UserRound} title="About" description="Manage About page paragraphs (shown in order of creation)" />
      <DataTable<AboutRow>
        entityName="Paragraph"
        data={paragraphs ?? []}
        columns={aboutColumns}
        apiEndpoint="/api/about-me"
        FormComponent={AboutForm}
        onDataUpdate={refetch}
        loading={isPending}
      />
    </div>
  );
};

export default AboutAdmin;
