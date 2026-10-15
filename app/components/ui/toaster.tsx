"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "../../providers/ThemeProvider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-800 dark:group-[.toaster]:text-gray-50 dark:group-[.toaster]:border-gray-700",
          description: "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-brand-green group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-700 dark:group-[.toast]:text-gray-400",
          success:
            "group-[.toast]:bg-green-50 group-[.toast]:text-green-900 group-[.toast]:border-green-200 dark:group-[.toast]:bg-green-950 dark:group-[.toast]:text-green-50 dark:group-[.toast]:border-green-800",
          error:
            "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-950 dark:group-[.toast]:text-red-50 dark:group-[.toast]:border-red-800",
          warning:
            "group-[.toast]:bg-yellow-50 group-[.toast]:text-yellow-900 group-[.toast]:border-yellow-200 dark:group-[.toast]:bg-yellow-950 dark:group-[.toast]:text-yellow-50 dark:group-[.toast]:border-yellow-800",
          info:
            "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-900 group-[.toast]:border-blue-200 dark:group-[.toast]:bg-blue-950 dark:group-[.toast]:text-blue-50 dark:group-[.toast]:border-blue-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
