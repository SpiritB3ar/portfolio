import React from 'react'
import { getResources, getResourceCategories } from '@/lib/data'
import ResourcesContent from './ResourcesContent'

const Resources = async () => {
    const resources = await getResources();
    const categories = await getResourceCategories();

    return <ResourcesContent initialResources={resources} categories={categories} />
}

export default Resources