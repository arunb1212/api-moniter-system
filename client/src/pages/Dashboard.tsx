import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiService, type ApiEndpoint, type PingRecord } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/StatusBadge'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
  TrendingUp,
  Globe,
  Play,
  Pause,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Compact uptime bar — last 30 pings as colored squares
function UptimeBar({ apiId }: { apiId: string }) {
  const [bars, setBars] = useState<PingRecord[]>([])

  useEffect(() => {
    apiService.pings(apiId, 30).then(setBars).catch(() => {})
  }, [apiId])

  if (bars.length === 0) return <span className="text-slate-600 text-xs">No data</span>

  return (
    <div className="flex items-center gap-px">
      {bars.map((p) => (
        <div
          key={p._id}
          title={`${p.status.toUpperCase()} — ${p.responseTime ?? '?'}ms`}
          className={`h-4 w-1.5 rounded-[2px] transition-all ${
            p.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [apis, setApis] = useState<ApiEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiService.list()
      setApis(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 30000)
    return () => clearInterval(interval)
  }, [load])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Remove this API from monitoring?')) return
    setDeletingId(id)
    try {
      await apiService.delete(id)
      setApis((prev) => prev.filter((a) => a._id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (id: string, isActive: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    setTogglingId(id)
    try {
      const updated = await apiService.toggle(id, isActive)
      setApis((prev) => prev.map((a) => (a._id === id ? updated : a)))
    } finally {
      setTogglingId(null)
    }
  }

  const upCount = apis.filter((a) => a.lastStatus === 'up' && a.isActive).length
  const downCount = apis.filter((a) => a.lastStatus === 'down').length
  const unknownCount = apis.filter((a) => a.lastStatus === 'unknown').length
  const overallHealth = apis.length > 0 ? Math.round((upCount / apis.length) * 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {apis.length > 0
              ? `Monitoring ${apis.length} endpoint${apis.length !== 1 ? 's' : ''}`
              : 'No endpoints monitored yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing} id="btn-refresh">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="glow" size="sm" asChild id="btn-add-api">
            <Link to="/add"><Plus />Add API</Link>
          </Button>
        </div>
      </div>

      {/* Overall Health Banner */}
      {apis.length > 0 && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${
          downCount > 0
            ? 'border-red-500/20 bg-red-500/5'
            : 'border-emerald-500/20 bg-emerald-500/5'
        }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            downCount > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
          }`}>
            {downCount > 0
              ? <AlertTriangle className="h-5 w-5 text-red-400" />
              : <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            }
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${downCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {downCount > 0
                ? `${downCount} endpoint${downCount > 1 ? 's' : ''} currently down`
                : 'All systems operational'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {upCount} up · {downCount} down · {unknownCount} pending · {overallHealth}% health
            </p>
          </div>
          {/* Health bar */}
          <div className="w-32">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${downCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${overallHealth}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-right mt-1">{overallHealth}%</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total APIs',
            value: apis.length,
            icon: Globe,
            gradient: 'from-blue-600/20 to-blue-800/10',
            iconColor: 'text-blue-400',
            border: 'border-blue-500/15',
            ring: 'bg-blue-500/10',
          },
          {
            title: 'Operational',
            value: upCount,
            icon: CheckCircle2,
            gradient: 'from-emerald-600/20 to-emerald-800/10',
            iconColor: 'text-emerald-400',
            border: 'border-emerald-500/15',
            ring: 'bg-emerald-500/10',
          },
          {
            title: 'Incidents',
            value: downCount,
            icon: AlertTriangle,
            gradient: 'from-red-600/20 to-red-800/10',
            iconColor: 'text-red-400',
            border: 'border-red-500/15',
            ring: 'bg-red-500/10',
          },
          {
            title: 'Avg Uptime',
            value: apis.length > 0 ? `${overallHealth}%` : '—',
            icon: TrendingUp,
            gradient: 'from-cyan-600/20 to-cyan-800/10',
            iconColor: 'text-cyan-400',
            border: 'border-cyan-500/15',
            ring: 'bg-cyan-500/10',
          },
        ].map(({ title, value, icon: Icon, gradient, iconColor, border, ring }) => (
          <Card key={title} className={`border ${border} overflow-hidden relative`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{title}</p>
                <div className={`h-8 w-8 rounded-lg ${ring} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${iconColor}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Monitored Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
                <p className="text-sm text-slate-500">Loading endpoints…</p>
              </div>
            </div>
          ) : apis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-white/[0.06] flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-slate-300 font-semibold text-lg">No APIs monitored yet</p>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-64">
                Add your first endpoint and start getting real-time uptime insights
              </p>
              <Button variant="glow" asChild>
                <Link to="/add"><Plus />Add your first API</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      { label: 'Endpoint', w: '' },
                      { label: 'Status', w: 'w-28' },
                      { label: 'Last 30 pings', w: 'w-40' },
                      { label: 'Method', w: 'w-24' },
                      { label: 'Interval', w: 'w-24' },
                      { label: 'Checked', w: 'w-32' },
                      { label: '', w: 'w-10' },
                    ].map((h) => (
                      <th key={h.label} className={`text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 ${h.w}`}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apis.map((api, i) => (
                    <tr
                      key={api._id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group ${
                        i === apis.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Name + URL */}
                      <td className="px-5 py-3.5">
                        <Link to={`/endpoint/${api._id}`} className="group/link flex flex-col gap-0.5">
                          <span className="font-medium text-white group-hover/link:text-cyan-400 transition-colors flex items-center gap-1.5">
                            {api.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </span>
                          <span className="text-xs text-slate-500 font-mono truncate max-w-56">{api.url}</span>
                        </Link>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={api.lastStatus} />
                          {!api.isActive && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-800/50 text-slate-400 border-slate-700">PAUSED</Badge>
                          )}
                        </div>
                      </td>
                      {/* Uptime Bar */}
                      <td className="px-5 py-3.5">
                        <UptimeBar apiId={api._id} />
                      </td>
                      {/* Method */}
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="font-mono text-xs">{api.method}</Badge>
                      </td>
                      {/* Interval */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-400">{api.pingInterval ?? 1}m</span>
                      </td>
                      {/* Last checked */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Clock className="h-3 w-3 text-slate-600" />
                          {api.lastChecked
                            ? formatDistanceToNow(new Date(api.lastChecked), { addSuffix: true })
                            : '—'}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            id={`btn-toggle-${api._id}`}
                            onClick={(e) => handleToggle(api._id, !api.isActive, e)}
                            disabled={togglingId === api._id}
                            className={`h-7 w-7 transition-all ${
                              api.isActive 
                                ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10' 
                                : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={api.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                          >
                            {api.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            id={`btn-delete-${api._id}`}
                            onClick={(e) => handleDelete(api._id, e)}
                            disabled={deletingId === api._id}
                            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete API"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
