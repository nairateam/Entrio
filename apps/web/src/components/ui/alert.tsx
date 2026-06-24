import { forwardRef, type HTMLAttributes } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

const variantConfig: Record<AlertVariant, { className: string; Icon: LucideIcon }> = {
  info: { className: 'border-border bg-muted text-foreground', Icon: Info },
  success: { className: 'border-success/40 bg-success/10 text-foreground', Icon: CheckCircle2 },
  warning: { className: 'border-warning/40 bg-warning/10 text-foreground', Icon: AlertTriangle },
  destructive: {
    className: 'border-destructive/40 bg-destructive/10 text-foreground',
    Icon: XCircle,
  },
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  /** Set false to hide the leading icon. */
  showIcon?: boolean;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, showIcon = true, children, ...props }, ref) => {
    const { className: variantClass, Icon } = variantConfig[variant];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn('flex gap-3 rounded-lg border p-4 text-sm', variantClass, className)}
        {...props}
      >
        {showIcon && <Icon className="mt-0.5 h-5 w-5 shrink-0" />}
        <div className="space-y-1">
          {title && <p className="font-medium leading-none">{title}</p>}
          {children && <div className="text-muted-foreground">{children}</div>}
        </div>
      </div>
    );
  },
);

Alert.displayName = 'Alert';
