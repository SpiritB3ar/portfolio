import React from 'react'
import { getBlogsV2 } from '../requests/requests'
import { BlogsTitle } from '../components/BlogsTitle'
import { BlogCard } from '../components/BlogCard'
import { BlogsEmptyState } from '../components/BlogsEmptyState'

const Blog = async () => {
    const blogs = await getBlogsV2();

    return (
        <div className="flex flex-col">
            <BlogsTitle />

            {blogs && blogs.length > 0 ? (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    {blogs.map((item, i) => <BlogCard key={i} blog={item} />)}
                </div>
            ) : (
                <BlogsEmptyState />
            )}
        </div>
    )
}

export default Blog
