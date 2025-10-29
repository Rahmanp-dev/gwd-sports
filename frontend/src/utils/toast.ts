import { toast } from "sonner";

const commonStyle = {
  fontSize: "14px",
  fontWeight: "500",
  borderRadius: "8px",
  border: "1px solid",
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export const toastUtils = {
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      style: {
        ...commonStyle,
        background: "#f0fdf4",
        borderColor: "#bbf7d0",
        color: "#166534",
        borderLeft: "4px solid #22c55e",
      },
    });
  },

  error: (title: string, description?: string) => {
    toast.error(title, {
      description,
      style: {
        ...commonStyle,
        background: "#fef2f2",
        borderColor: "#fecaca",
        color: "#991b1b",
        borderLeft: "4px solid #ef4444",
      },
    });
  },

  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      style: {
        ...commonStyle,
        background: "#fffbeb",
        borderColor: "#fed7aa",
        color: "#92400e",
        borderLeft: "4px solid #f59e0b",
      },
    });
  },

  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      style: {
        ...commonStyle,
        background: "#eff6ff",
        borderColor: "#bfdbfe",
        color: "#1e40af",
        borderLeft: "4px solid #3b82f6",
      },
    });
  },
};

// Export as showToast for backward compatibility
export const showToast = toastUtils;
