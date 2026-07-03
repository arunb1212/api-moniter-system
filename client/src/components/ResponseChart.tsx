import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { type PingRecord } from '@/lib/api'
import { format } from 'date-fns'

interface ResponseChartProps {
  pings: PingRecord[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const ping = payload[0].payload as PingRecord
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm p-3 shadow-xl text-xs">
        <p className="text-slate-400 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-cyan-400 font-semibold">{ping.responseTime ?? '—'}ms response</p>
          <p className={ping.status === 'up' ? 'text-emerald-400' : 'text-red-400'}>
            HTTP {ping.statusCode ?? 'ERR'} — {ping.status.toUpperCase()}
          </p>
          {ping.error && <p className="text-red-400 max-w-48 truncate">{ping.error}</p>}
        </div>
      </div>
    )
  }
  return null
}

export default function ResponseChart({ pings }: ResponseChartProps) {
  const data = pings.map((p) => ({
    ...p,
    time: format(new Date(p.timestamp), 'HH:mm'),
    responseTime: p.responseTime,
  }))

  const avgResponseTime =
    data.filter((d) => d.responseTime).reduce((s, d) => s + (d.responseTime ?? 0), 0) /
    (data.filter((d) => d.responseTime).length || 1)

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500 text-sm">
        No ping data yet — pings arrive every minute
      </div>
    )
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgResponseTime}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: `avg ${Math.round(avgResponseTime)}ms`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
          />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="url(#lineGradient)"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props
              return (
                <circle
                  key={`dot-${payload.timestamp}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={payload.status === 'down' ? '#ef4444' : '#06b6d4'}
                  stroke="transparent"
                />
              )
            }}
            activeDot={{ r: 5, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
