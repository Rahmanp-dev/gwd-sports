import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastOptions) => {
    const message = title || description || ""
    const fullMessage = title && description ? `${title}: ${description}` : message

    if (variant === "destructive") {
      return sonnerToast.error(fullMessage)
    } else {
      return sonnerToast.success(fullMessage)
    }
  }

  return {
    toast,
    // Legacy support for existing code
    dismiss: sonnerToast.dismiss,
  }
}

// Export the toast function directly for convenience
export const toast = sonnerToast