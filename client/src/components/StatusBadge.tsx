import { type ApiEndpoint } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ApiEndpoint['lastStatus']
  pulse?: boolean
  size?: 'sm' | 'default'
}

export default function StatusBadge({ status, pulse = true, size = 'default' }: StatusBadgeProps) {
  const map = {
    up: { variant: 'success' as const, label: 'UP', color: 'bg-emerald-400' },
    down: { variant: 'danger' as const, label: 'DOWN', color: 'bg-red-400' },
    unknown: { variant: 'unknown' as const, label: 'UNKNOWN', color: 'bg-slate-400' },
  }
  const { variant, label, color } = map[status]

  return (
    <Badge variant={variant} className={cn('gap-1.5', size === 'sm' && 'text-[10px] px-2 py-0.5')}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && status !== 'unknown' && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', color)} />
      </span>
      {label}
    </Badge>
  )
}
