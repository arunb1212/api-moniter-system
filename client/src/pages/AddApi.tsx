import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService, type NewApiPayload } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CheckCircle2, Globe, Loader2, Mail, ShieldCheck, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD']
const PING_INTERVALS = [
  { label: 'Every 1 minute', value: 1 },
  { label: 'Every 5 minutes', value: 5 },
  { label: 'Every 10 minutes', value: 10 },
  { label: 'Every 15 minutes', value: 15 },
  { label: 'Every 30 minutes', value: 30 },
  { label: 'Every 60 minutes', value: 60 },
]

export default function AddApi() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<NewApiPayload>({
    name: '',
    url: '',
    method: 'GET',
    expectedStatus: 200,
    alertEmail: '',
    pingInterval: 1,
  })

  const set = (k: keyof NewApiPayload, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.url) return setError('Name and URL are required.')
    setLoading(true)
    try {
      await apiService.create(form)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add API. Check the server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen  flex  items-start justify-center p-8">
      <div className="w-full ">
      {/* Back */}

      <Link
        to="/"
        className="inline-flex  items-start w-full gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add API Endpoint</h1>
        {/* <p className="text-sm text-slate-400 mt-1">Start monitoring a new endpoint in real-time</p> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <Globe className="h-4 w-4 text-cyan-400" />
            Endpoint Configuration
          </CardTitle>
          <CardDescription>
            The endpoint will be pinged based on the interval you set below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-lg">API Added!</p>
              <p className="text-slate-400 text-sm mt-1">Redirecting to dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="api-name">Display Name</Label>
                <Input
                  id="api-name"
                  placeholder="e.g. Production Auth API"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>

              {/* URL + Method */}
              <div className="space-y-2">
                <Label htmlFor="api-url">Endpoint URL</Label>
                <div className="flex gap-2">
                  <Select value={form.method} onValueChange={(v) => set('method', v)}>
                    <SelectTrigger className="w-28" id="api-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="api-url"
                    placeholder="https://api.example.com/health"
                    value={form.url}
                    onChange={(e) => set('url', e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Expected Status */}
              <div className="space-y-2">
                <Label htmlFor="api-status" className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  Expected HTTP Status
                </Label>
                <Input
                  id="api-status"
                  type="number"
                  min={100}
                  max={599}
                  value={form.expectedStatus}
                  onChange={(e) => set('expectedStatus', parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-slate-500">The API is marked DOWN if the response code doesn't match.</p>
              </div>

              {/* Ping Interval */}
              <div className="space-y-2">
                <Label htmlFor="api-interval" className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-slate-500" />
                  Ping Interval
                </Label>
                <Select
                  value={String(form.pingInterval)}
                  onValueChange={(v) => set('pingInterval', parseInt(v))}
                >
                  <SelectTrigger id="api-interval" className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PING_INTERVALS.map(({ label, value }) => (
                      <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">How frequently this endpoint is checked.</p>
              </div>

              {/* Alert Email */}
              <div className="space-y-2">
                <Label htmlFor="api-email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  Alert Email
                  <span className="text-slate-600 font-normal">(optional)</span>
                </Label>
                <Input
                  id="api-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.alertEmail}
                  onChange={(e) => set('alertEmail', e.target.value)}
                />
                <p className="text-xs text-slate-500">Get notified when this API goes down or recovers.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="glow" disabled={loading} id="btn-submit-api" className="flex-1">
                  {loading ? <Loader2 className="animate-spin" /> : null}
                  {loading ? 'Adding…' : 'Start Monitoring'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/">Cancel</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
