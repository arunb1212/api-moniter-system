import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiService, type ApiEndpoint, type PingRecord, type ApiStats } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StatusBadge from '@/components/StatusBadge'
import ResponseChart from '@/components/ResponseChart'
import { Trash2 } from 'lucide-react'
import {
  Activity,
  ArrowLeft,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wifi,
  Zap,
  Timer,
  Play,
  Pause,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [api, setApi] = useState<ApiEndpoint | null>(null)
  const [pings, setPings] = useState<PingRecord[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinging, setPinging] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [intervalSaving, setIntervalSaving] = useState(false)

  const PING_INTERVALS = [
    { label: '1 min', value: 1 },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '60 min', value: 60 },
  ]

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [apiData, pingsData, statsData] = await Promise.all([
        apiService.get(id),
        apiService.pings(id, 100),
        apiService.stats(id),
      ])
      setApi(apiData)
      setPings(pingsData)
      setStats(statsData)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 30000)
    return () => clearInterval(interval)
  }, [load])

  const handleManualPing = async () => {
    if (!id) return
    setPinging(true)
    try {
      await apiService.manualPing(id)
      await load()
    } finally {
      setPinging(false)
    }
  }

  const handleToggle = async () => {
    if (!id || !api) return
    setToggling(true)
    try {
      const updated = await apiService.toggle(id, !api.isActive)
      setApi(updated)
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Remove this API from monitoring?')) return
    await apiService.delete(id)
    navigate('/')
  }

  const handleIntervalChange = async (newInterval: string) => {
    if (!id || !api) return
    setIntervalSaving(true)
    try {
      const updated = await apiService.updateInterval(id, parseInt(newInterval))
      setApi(updated)
    } finally {
      setIntervalSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    )
  }

  if (!api) return null

  const uptimeNum = parseFloat(stats?.uptime ?? '0')

  return (
    <div className="p-8 space-y-6">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All APIs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{api.name}</h1>
            <StatusBadge status={api.lastStatus} />
          </div>
          <a
            href={api.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors font-mono"
          >
            {api.url}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Badge variant="outline" className="font-mono">{api.method}</Badge>
            <span>Expected: HTTP {api.expectedStatus}</span>
            {api.alertEmail && <span className="text-slate-500">📧 {api.alertEmail}</span>}
            <div className="flex items-center gap-1.5 ml-1">
              <Timer className="h-3.5 w-3.5 text-slate-500" />
              <Select
                value={String(api.pingInterval ?? 1)}
                onValueChange={handleIntervalChange}
                disabled={intervalSaving}
              >
                <SelectTrigger
                  id="detail-interval"
                  className="h-6 text-xs border-white/10 bg-white/5 px-2 w-28 focus:ring-cyan-500/50"
                >
                  {intervalSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {PING_INTERVALS.map(({ label, value }) => (
                    <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
            className={api.isActive ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10' : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'}
          >
            {toggling ? <Loader2 className="animate-spin h-4 w-4" /> : (api.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />)}
            {toggling ? 'Updating…' : (api.isActive ? 'Stop' : 'Resume')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualPing}
            disabled={pinging || !api.isActive}
            id="btn-manual-ping"
          >
            {pinging ? <Loader2 className="animate-spin h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            {pinging ? 'Pinging…' : 'Ping Now'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            id="btn-delete-api"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Uptime',
            value: `${uptimeNum.toFixed(1)}%`,
            icon: Activity,
            color: uptimeNum >= 99 ? 'text-emerald-400' : uptimeNum >= 90 ? 'text-amber-400' : 'text-red-400',
          },
          {
            label: 'Avg Response',
            value: stats?.avgResponseTime ? `${stats.avgResponseTime}ms` : '—',
            icon: TrendingUp,
            color: 'text-cyan-400',
          },
          {
            label: 'Total Pings',
            value: stats?.total ?? 0,
            icon: Zap,
            color: 'text-blue-400',
          },
          {
            label: 'Last Checked',
            value: api.lastChecked
              ? formatDistanceToNow(new Date(api.lastChecked), { addSuffix: true })
              : '—',
            icon: Clock,
            color: 'text-slate-400',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Response Time — Last {pings.length} pings
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponseChart pings={pings} />
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Ping History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No pings yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Time', 'Status', 'HTTP Code', 'Response Time', 'Error'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...pings].reverse().map((ping, i) => (
                    <tr
                      key={ping._id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${i === pings.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {format(new Date(ping.timestamp), 'MMM d, HH:mm:ss')}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={ping.status} pulse={false} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        {ping.statusCode ? (
                          <Badge
                            variant={
                              ping.statusCode >= 200 && ping.statusCode < 300 ? 'success' : 'danger'
                            }
                            className="font-mono text-xs"
                          >
                            {ping.statusCode}
                          </Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">
                        {ping.responseTime != null ? `${ping.responseTime}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 text-red-400 text-xs max-w-48 truncate">
                        {ping.error ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
