import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingState({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = 'حدث خطأ أثناء تحميل البيانات.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-gray-400">
      {icon ?? <Inbox className="h-8 w-8" />}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
