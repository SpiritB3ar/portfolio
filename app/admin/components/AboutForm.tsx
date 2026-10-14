"use client";

import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

type AboutFormProps = {
  initialData?: Partial<AboutFormData>;
  onSubmit: (data: AboutFormData) => void;
};

const aboutFormDataSchema = z.object({
  id: z.string().optional(),
  paragraph: z.string().min(1, "Paragraph is required"),
});

export type AboutFormData = z.infer<typeof aboutFormDataSchema>;

export type AboutFormRef = {
    submitForm: () => Promise<void>;
};

const AboutForm = forwardRef<
  AboutFormRef,
  AboutFormProps
>(({ initialData, onSubmit }, ref) => {
  const form = useForm<AboutFormData>({
    resolver: zodResolver(aboutFormDataSchema),
    defaultValues: {
      paragraph: "",
      id: undefined,
    },
  });

  const { handleSubmit, trigger, control, reset, formState: { isSubmitting } } = form;

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit(onSubmit),
  }));

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      trigger();
    }
  }, [initialData, reset, trigger]);

  const onSubmitHandler: SubmitHandler<AboutFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form id="datatable-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
        <FormField
          control={control}
          name="paragraph"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paragraph</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write a paragraph for the About page (shown in order of creation)"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {initialData?.id ? "Update Paragraph" : "Create Paragraph"}
        </Button>
      </form>
    </Form>
  );
});

AboutForm.displayName = "AboutForm";

export default AboutForm;
