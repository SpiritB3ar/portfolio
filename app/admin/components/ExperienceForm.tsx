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
import { fetchJSON } from "../../../lib/request-util";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/app/components/ui/image-upload";
import CustomDatePicker from "@/app/components/dashboard/DatePicker";

type ExperienceFormProps = {
  initialData?: Partial<ExperienceFormData>;
  onSubmit: (data: ExperienceFormData) => void;
};

const experienceFormDataSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  clientImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional().nullable(),
  technologies: z.string().min(1, "Technologies are required (comma-separated)"),
});

export type ExperienceFormData = z.infer<typeof experienceFormDataSchema>;

export type ExperienceFormRef = {
    submitForm: () => Promise<void>;
};

const ExperienceForm = forwardRef<
  ExperienceFormRef,
  ExperienceFormProps
>(({ initialData, onSubmit }, ref) => {
  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceFormDataSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      image: "",
      clientImage: "",
      startDate: undefined,
      endDate: null,
      technologies: "",
      id: undefined,
    },
  });

  const { handleSubmit, trigger, control, reset, formState: { isValid, isSubmitting, errors }, getValues } = form;

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit(onSubmit),
  }));

  useEffect(() => {
    if (initialData) {
      const convertedData = {
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : null,
        technologies: Array.isArray(initialData.technologies) ? initialData.technologies.join(', ') : initialData.technologies || "",
      };
      reset(convertedData);
      trigger();
    }
  }, [initialData, reset, trigger]);

  const onSubmitHandler: SubmitHandler<ExperienceFormData> = (data) => {
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
                <Input placeholder="Experience Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Company Name" {...field} />
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
                <Textarea placeholder="Description of your role and responsibilities" {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Logo (Optional)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ?? ""}
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
          name="clientImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Logo (Optional, for consultancy roles)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ?? ""}
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
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <CustomDatePicker
                value={field.value ?? null}
                onChange={(date) => field.onChange(date)}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <CustomDatePicker
                value={field.value ?? null}
                onChange={(date) => field.onChange(date)}
                label="End Date (Optional)"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="technologies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technologies (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="React, Node.js, TypeScript" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {initialData?.id ? "Update Experience" : "Create Experience"}
        </Button>
      </form>
    </Form>
  );
});

ExperienceForm.displayName = "ExperienceForm";

export default ExperienceForm;
