import { toast } from "sonner";

export function showSuccessToast(message: string) {
  toast.success(message);
}

export function showErrorToast(message: string, error?: Error) {
  const errorMessage = error?.message
    ? `${message}: ${error.message}`
    : message;
  toast.error(errorMessage);
}

export function showLoadingToast(message: string) {
  return toast.loading(message);
}

export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}
