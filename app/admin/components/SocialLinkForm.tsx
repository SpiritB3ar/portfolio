"use client";

import React, { forwardRef, useEffect, useImperativeHandle } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { iconMap } from "../../components/SocialLink";

type SocialLinkFormProps = {
  initialData?: Partial<SocialLinkFormData>;
  onSubmit: (data: SocialLinkFormData) => void;
};

// Must stay in sync with `iconMap` in app/components/SocialLink.tsx —
// the public footer only renders links whose icon key exists there.
const ICON_OPTIONS = ["linkedin", "github", "instagram", "twitter", "youtube", "facebook", "tiktok", "mail", "globe"];

const socialLinkFormDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  link: z.string().min(1, "Link is required"),
  icon: z.string().min(1, "Icon is required"),
});

export type SocialLinkFormData = z.infer<typeof socialLinkFormDataSchema>;

export type SocialLinkFormRef = {
    submitForm: () => Promise<void>;
};

const SocialLinkForm = forwardRef<
  SocialLinkFormRef,
  SocialLinkFormProps
>(({ initialData, onSubmit }, ref) => {
  const form = useForm<SocialLinkFormData>({
    resolver: zodResolver(socialLinkFormDataSchema),
    defaultValues: {
      name: "",
      link: "",
      icon: "globe",
      id: undefined,
    },
  });

  const { handleSubmit, trigger, control, reset, formState: { isSubmitting }, watch } = form;
  const selectedIcon = watch("icon");
  const PreviewIcon = iconMap[selectedIcon] || Globe;

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit(onSubmit),
  }));

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      trigger();
    }
  }, [initialData, reset, trigger]);

  const onSubmitHandler: SubmitHandler<SocialLinkFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form id="datatable-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="LinkedIn" {...field} />
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
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
                  <PreviewIcon size={20} />
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {initialData?.id ? "Update Social Link" : "Create Social Link"}
        </Button>
      </form>
    </Form>
  );
});

SocialLinkForm.displayName = "SocialLinkForm";

export default SocialLinkForm;
