"use client";
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/app/components/ui/image-upload";
import FileUpload from "@/app/components/ui/file-upload";
import { getAdminApiKey } from "@/lib/admin-auth";

// Validation schema
const profileSchema = z.object({
  welcomeTitle: z.string().min(3, 'Title must be at least 3 characters'),
  welcomeNote: z.string().min(3, 'Note must be at least 3 characters'),
  welcomeDescription: z.string().min(10, 'Description must be at least 10 characters'),
  cvFile: z.string().optional().or(z.literal('')),
  userImage: z.string().url('Must be a valid URL'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const queryClient = useQueryClient();

  // Fetch user details
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-details'],
    queryFn: async () => {
      const res = await fetch('/api/user-details');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return (await res.json()) as {
        id: string;
        welcomeTitle: string;
        welcomeNote: string;
        welcomeDescription: string;
        cvFile?: string | null;
        userImage: string;
      };
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const userImageValue = watch('userImage');
  const cvFileValue = watch('cvFile');

  // Load profile data into form when fetched
  useEffect(() => {
    if (profile) {
      reset({
        welcomeTitle: profile.welcomeTitle || '',
        welcomeNote: profile.welcomeNote || '',
        welcomeDescription: profile.welcomeDescription || '',
        cvFile: profile.cvFile || '',
        userImage: profile.userImage || '',
      });
    }
  }, [profile, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch('/api/user-details', {
        method: profile?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getAdminApiKey(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-details'] });
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast.error('Failed to update profile', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <User className="w-8 h-8 text-brand-green" />
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your portfolio&apos;s main information and welcome message
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Section</CardTitle>
            <CardDescription>
              This appears on the homepage hero section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Welcome Title */}
            <div className="space-y-2">
              <Label htmlFor="welcomeTitle">
                Welcome Title
                <Badge variant="secondary" className="ml-2">Required</Badge>
              </Label>
              <Input
                id="welcomeTitle"
                placeholder="e.g., Hi, I'm John Doe"
                {...register('welcomeTitle')}
                className={errors.welcomeTitle ? 'border-red-500' : ''}
              />
              {errors.welcomeTitle && (
                <p className="text-sm text-red-500">{errors.welcomeTitle.message}</p>
              )}
            </div>

            {/* Welcome Note */}
            <div className="space-y-2">
              <Label htmlFor="welcomeNote">
                Welcome Note
                <Badge variant="secondary" className="ml-2">Required</Badge>
              </Label>
              <Input
                id="welcomeNote"
                placeholder="e.g., Full Stack Developer"
                {...register('welcomeNote')}
                className={errors.welcomeNote ? 'border-red-500' : ''}
              />
              {errors.welcomeNote && (
                <p className="text-sm text-red-500">{errors.welcomeNote.message}</p>
              )}
            </div>

            {/* Welcome Description */}
            <div className="space-y-2">
              <Label htmlFor="welcomeDescription">
                Welcome Description
                <Badge variant="secondary" className="ml-2">Required</Badge>
              </Label>
              <Textarea
                id="welcomeDescription"
                placeholder="A brief introduction about yourself..."
                rows={4}
                {...register('welcomeDescription')}
                className={errors.welcomeDescription ? 'border-red-500' : ''}
              />
              {errors.welcomeDescription && (
                <p className="text-sm text-red-500">{errors.welcomeDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Media Section */}
        <Card>
          <CardHeader>
            <CardTitle>Media & Files</CardTitle>
            <CardDescription>
              Upload your profile image and provide your CV file URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Image */}
            <div className="space-y-2">
              <Label htmlFor="userImage">
                Profile Image
                <Badge variant="secondary" className="ml-2">Required</Badge>
              </Label>
              <ImageUpload
                value={userImageValue}
                onChange={(url) => setValue('userImage', url, { shouldValidate: true })}
              />
              {errors.userImage && (
                <p className="text-sm text-red-500">{errors.userImage.message}</p>
              )}
            </div>

            {/* CV File */}
            <div className="space-y-2">
              <Label>
                CV / Resume
                <Badge variant="outline" className="ml-2">Optional</Badge>
              </Label>
              <FileUpload
                value={cvFileValue}
                onChange={(url) => setValue('cvFile', url, { shouldValidate: true })}
              />
              {errors.cvFile && (
                <p className="text-sm text-red-500">{errors.cvFile.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-brand-green to-brand-medium"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
