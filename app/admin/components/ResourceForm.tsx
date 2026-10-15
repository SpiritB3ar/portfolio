"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { ResourceCategoryType, ResourceType } from "../../components/types/types";
import { fetchJSON } from "../../../lib/request-util";
import { Textarea } from "@/components/ui/textarea";
import CustomDatePicker from "@/app/components/dashboard/DatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/app/components/ui/image-upload";

type ResourceFormProps = {
  initialData?: Partial<ResourceFormData>;
  onSubmit: (data: ResourceFormData) => void;
};

const resourceFormDataSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url("Must be a valid URL").min(1, "Cover Image URL is required"),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  type: z.enum(['Article', 'Video', 'Ebook', 'Tutorial', 'Tool', 'Case Study'], { required_error: "Resource type is required" }),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.string().min(1, "Tags are required (comma-separated)"),
  author: z.string().min(1, "Author is required"),
  publishedAt: z.date().optional().nullable(),
  readTimeMinutes: z.coerce.number().min(1, "Read time must be at least 1 minute").optional().nullable(),
});

export type ResourceFormData = z.infer<typeof resourceFormDataSchema>;

export type ResourceFormRef = {
    submitForm: () => Promise<void>;
};

const fetchResourceCategories = async (): Promise<ResourceCategoryType[] | []> => {
    const data = await fetchJSON<ResourceCategoryType[]>("/api/resource-categories");
    return data ?? [];
};

const ResourceForm = forwardRef<
  ResourceFormRef,
  ResourceFormProps
>(({ initialData, onSubmit }, ref) => {
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormDataSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      coverImage: "",
      link: "",
      type: undefined,
      categoryId: "",
      tags: "",
      author: "",
      publishedAt: null,
      readTimeMinutes: null,
      id: undefined,
    },
  });

  const { handleSubmit, trigger, control, reset, formState: { isValid, isSubmitting, errors }, getValues } = form;

  const [categories, setCategories] = useState<ResourceCategoryType[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const fetchedCategories = await fetchResourceCategories();
      setCategories(fetchedCategories);
    };
    loadCategories();
  }, []);

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit(onSubmit),
  }));

  useEffect(() => {
    if (initialData) {
      const convertedData = {
        ...initialData,
        publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt) : null,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || "",
        readTimeMinutes: initialData.readTimeMinutes ?? null,
      };
      reset(convertedData);
      trigger();
    }
  }, [initialData, reset, trigger]);

  const onSubmitHandler: SubmitHandler<ResourceFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form id="datatable-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Resource Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Short description of the resource" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea placeholder="Full content of the resource" {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  className="mt-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Link (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/resource" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Article">Article</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Ebook">Ebook</SelectItem>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Tool">Tool</SelectItem>
                  <SelectItem value="Case Study">Case Study</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="tag1, tag2, tag3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Author Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="publishedAt"
          render={({ field }) => (
            <CustomDatePicker
              value={field.value ?? null}
              onChange={field.onChange}
              label="Published Date"
            />
          )}
        />
        <FormField
          control={control}
          name="readTimeMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Read Time (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  {...field}
                  value={field.value ?? ""} // Ensure value is a string or number, not null
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={`bg-blue-500 text-white px-4 py-2 rounded ${
            isSubmitting ? "opacity-50" : ""}`}
          disabled={!isValid || isSubmitting}
        >
          Save Resource
        </Button>
      </form>
    </Form>
  );
});

export default ResourceForm;
ResourceForm.displayName = "ResourceForm";
