"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Share2, Globe } from 'lucide-react';
import { fetchJSON } from '../../../lib/request-util';
import DataTable from '@/app/components/dashboard/DataTable';
import { SocialLinkType } from '../../components/types/types';
import { iconMap } from '../../components/SocialLink';
import SocialLinkForm from '../components/SocialLinkForm';
import PageHeader from '../components/PageHeader';

type SocialLinkRow = SocialLinkType & { id: string };

const fetchSocialLinks = async (): Promise<SocialLinkRow[]> => {
  const data = await fetchJSON<SocialLinkRow[]>("/api/user-social-links");
  return data ?? [];
};

const socialLinkColumns: ColumnDef<SocialLinkRow, any>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'link', header: 'Link' },
  {
    accessorKey: 'icon',
    header: 'Icon',
    cell: ({ getValue }) => {
      const key = getValue() as string;
      const Icon = iconMap[key] || Globe;
      return (
        <span className="inline-flex items-center gap-2">
          <Icon size={16} />
          {key}
        </span>
      );
    },
  },
];

const SocialLinksAdmin = () => {
  const { isPending, data: links, refetch } = useQuery({
    queryKey: ['social-links'],
    queryFn: fetchSocialLinks,
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={Share2} title="Social Links" description="Manage footer and contact social links (only listed icons render publicly)" />
      <DataTable<SocialLinkRow>
        entityName="Social Link"
        data={links ?? []}
        columns={socialLinkColumns}
        apiEndpoint="/api/user-social-links"
        FormComponent={SocialLinkForm}
        onDataUpdate={refetch}
        loading={isPending}
      />
    </div>
  );
};

export default SocialLinksAdmin;
