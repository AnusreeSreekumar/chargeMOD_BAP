'use client'

import React, { useMemo, useState } from 'react'
import {
  BatteryCharging,
  Bolt,
  Building2,
  CalendarClock,
  Info,
  MapPin,
  ShieldCheck,
  Wallet,
  ClipboardCopy,
  Check,
  AlertTriangle,
  Search,
  User,
  X
} from 'lucide-react'

/**
 * NOTE: This page uses Tailwind utility classes like bg-background, text-foreground, bg-muted, ring-primary, etc.
 * If you haven't mapped these in Tailwind v4 yet, either:
 *   1) Define CSS vars in globals.css (recommended), or
 *   2) Replace them with palette classes (e.g. bg-white, text-slate-900, bg-gray-100, ring-blue-500).
 */

// ------------------------------
// Minimal UI primitives (no shadcn)
// ------------------------------
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div
    className={`rounded-2xl border bg-background text-foreground shadow-sm ${className}`}
    {...props}
  />
)
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div
    className={`p-5 ${className}`}
    {...props}
  />
)
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
  <h2
    className={`text-lg font-semibold ${className}`}
    {...props}
  />
)
const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...props }) => (
  <p
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
)
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div
    className={`p-5 pt-0 ${className}`}
    {...props}
  />
)

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => (
  <label
    className={`text-sm font-medium ${className}`}
    {...props}
  />
)

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full rounded-xl border bg-background p-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`}
    {...props}
  />
)

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted transition disabled:opacity-50 ${className}`}
    {...props}
  />
)

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    className={`h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`}
    {...props}
  >
    {children}
  </select>
)

const Slider: React.FC<{
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}> = ({ value, onChange, min = 0, max = 100, step = 1, disabled }) => (
  <input
    type="range"
    className="w-full"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={e => onChange(Number(e.target.value))}
    disabled={disabled}
  />
)

const Switch: React.FC<
  { checked: boolean; onChange: (v: boolean) => void } & React.HTMLAttributes<HTMLButtonElement>
> = ({ checked, onChange, className = '', ...props }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'} ${className}`}
    {...props}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${checked ? 'left-6' : 'left-0.5'}`}
    />
  </button>
)

// Tabs
function Tabs<T extends string>({
  value,
  onValueChange,
  options,
  className = ''
}: {
  value: T
  onValueChange: (v: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <div className={`grid grid-cols-2 rounded-xl border p-1 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onValueChange(opt.value)}
          className={`rounded-lg px-3 py-2 text-sm transition ${value === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Tooltip: we just use the native title attribute for a lightweight impl
const Tip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
  <span
    title={content}
    className="inline-flex items-center"
  >
    {children}
  </span>
)

// --- Helpers ---
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const GST_RATE = 0.18 // 18%

// Pure function for totals – easier to test
function computeTotals(energyKwh: number, pricePerKwh: number, feeRate = 0.03, gstRate = GST_RATE) {
  const base = energyKwh * pricePerKwh
  const networkFee = Math.max(10, Math.round(feeRate * base))
  const subtotal = base + networkFee
  const gst = subtotal * gstRate
  const total = subtotal + gst
  return { base, networkFee, subtotal, gst, total }
}

// Build mock 24h price series and suggest cheapest hour
function buildPriceSeries(pricePerKwh: number) {
  const hours = Array.from({ length: 24 }).map((_, h) => h)
  const series = hours.map(h => {
    const adj = h >= 18 && h <= 22 ? 2.2 : h >= 6 && h <= 9 ? 1.2 : -0.6
    const price = Math.round((pricePerKwh + adj + Math.sin(h / 3) * 0.4) * 10) / 10
    return { h, label: `${h.toString().padStart(2, '0')}:00`, price }
  })
  const min = series.reduce((p, c) => (c.price < p.price ? c : p), series[0])
  return { series, cheapest: min }
}

// Build BAP payloads
function buildBAPIntentPayload(ctx: any) {
  return {
    context: ctx,
    message: {
      intent: {
        descriptor: { name: 'Charge EV' },
        fulfillment: { type: 'ON_FULFILLMENT' }
      }
    }
  }
}

function buildBAPOrderSchema(org: any, service: any, tx: any) {
  return {
    organisation_details: org,
    service_schema: service,
    transaction_details: tx
  }
}

// --- Runtime tests (kept light) ---
;(function tests() {
  if (typeof window === 'undefined') return
  try {
    const totals = computeTotals(100, 10)
    console.assert(Math.abs(totals.base - 1000) < 1e-9, 'base ok')
    console.assert(totals.networkFee >= 10, 'network fee min')

    const { series, cheapest } = buildPriceSeries(12)
    console.assert(series.length === 24, '24 points')
    console.assert(
      series.every(p => typeof p.price === 'number'),
      'numeric prices'
    )
    console.assert(cheapest && typeof cheapest.h === 'number', 'cheapest hour found')

    const intent = buildBAPIntentPayload({ domain: 'energy', country: 'IN' })
    console.assert(intent.message.intent.fulfillment.type === 'ON_FULFILLMENT', 'fulfillment fixed')
  } catch (e) {
    console.warn('Sanity tests failed:', e)
  }
})()

// ------------------------------
// Data
// ------------------------------
type SellerComponent = 'VPP' | 'Micro-grid' | 'AC Charger' | 'DC Charger' | 'Battery Storage'

type BPP = {
  id: string
  name: string
  pricePerKwh: number
  rating: number // 0-5
  available: boolean
  minKwh: number
  maxKwh: number
  components: SellerComponent[]
  location: string
  tags?: string[]
}

const BPP_LIST: BPP[] = [
  {
    id: 'cm-bpp-01',
    name: 'chargeMOD Energy Grid',
    pricePerKwh: 14.5,
    rating: 4.7,
    available: true,
    minKwh: 5,
    maxKwh: 150,
    components: ['VPP', 'DC Charger', 'Battery Storage'],
    location: 'Bengaluru',
    tags: ['Low network fee', 'Best for DC']
  },
  {
    id: 'sun-bpp-22',
    name: 'SunSpark Power Pvt Ltd',
    pricePerKwh: 13.2,
    rating: 4.4,
    available: true,
    minKwh: 10,
    maxKwh: 120,
    components: ['Micro-grid', 'AC Charger'],
    location: 'Mysuru',
    tags: ['Solar mix', 'Green']
  },
  {
    id: 'hydro-bpp-07',
    name: 'HydroFlow Trading Co',
    pricePerKwh: 12.8,
    rating: 4.2,
    available: false,
    minKwh: 20,
    maxKwh: 200,
    components: ['VPP', 'AC Charger'],
    location: 'Kochi',
    tags: ['Budget']
  }
]

function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5 text-yellow-500">
      {Array.from({ length: full }).map((_, i) => (
        <span key={i}>★</span>
      ))}
      {half && <span className="opacity-50">★</span>}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <span
          key={i}
          className="text-muted-foreground opacity-50"
        >
          ★
        </span>
      ))}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-muted">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground leading-tight">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ---------------------------------
   Lightweight UI helpers for actions
---------------------------------- */
// Spinner
const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`animate-spin h-4 w-4 ${className}`}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
    ></path>
  </svg>
)

// Toast
function Toast({
  open,
  title,
  description,
  onClose,
  action
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  action?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] rounded-2xl border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{title}</div>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
          </div>
          <button
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------
// Main Page
// ------------------------------
export default function BuyEnergyPage() {
  // UI State
  const [sidebarOpen] = useState(true)

  // Purchase Controls
  const [bppId, setBppId] = useState<string>(BPP_LIST[0].id)
  const [connector, setConnector] = useState<string>('CCS2')
  const [kwh, setKwh] = useState<number>(25)
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [startTime, setStartTime] = useState<string>('')
  const [capBudget, setCapBudget] = useState<boolean>(false)
  const [budget, setBudget] = useState<number>(500)
  const [site, setSite] = useState<string>('')
  const [chargerId, setChargerId] = useState<string>('')

  // Search / Filters
  const [query, setQuery] = useState('')
  const [compFilter, setCompFilter] = useState<SellerComponent | 'All'>('All')

  // EXTRA: Search button UX state
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [lastSearchTerm, setLastSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // BAP Intent Context (pre-filled as requested)
  const [context, setContext] = useState({
    domain: 'energy',
    country: 'IN',
    city: 'Bengaluru',
    action: 'search',
    participant_id: 'buyer-ev-app.yourdomain.com',
    transaction_id: 'txn-123456'
  })

  // Organisation / Service / Transaction schema (simplified inputs)
  const [organisation, setOrganisation] = useState<any>({
    organisation_name: '',
    short_name: '',
    type_of_organisation: '',
    registration_number: '',
    PAN: '',
    location_details: {
      head_office_address: '',
      branch_or_regional_office: '',
      country: 'India',
      state_or_province: 'Karnataka',
      city_or_district: 'Bengaluru',
      pin_code: ''
    },
    contact_information: { official_email: '', official_phone_number: '', website_url: '' }
  })

  const [service, setService] = useState<any>({
    descriptor: {
      name: 'EV Energy Charging or Selling Service',
      short_desc: 'Provision to buy or sell electrical energy for EV stations',
      long_desc:
        'Platform for trading electrical energy between EV charging stations, buyers, and sellers using Beckn Protocol.'
    },
    category_id: 'EV_ENERGY',
    price: { currency: 'INR', value: 0 },
    fulfillment: { type: 'ON_FULFILLMENT' },
    electrical_parameters: {
      voltage: { unit: 'Volts', value: 415 },
      current: { unit: 'Amperes', value: 32 },
      power_factor: { value: 0.95, description: 'Ratio of real power to apparent power' },
      active_power: { unit: 'kW', value: 20, description: 'The actual power consumed or generated' },
      reactive_power: { unit: 'kVAR', value: 5, description: 'Reactive power component' },
      apparent_power: { unit: 'kVA', value: 21, description: 'Combined effect of active and reactive power' },
      frequency: { unit: 'Hz', value: 50 },
      energy_transferred: { unit: 'kWh', value: 0, description: 'The amount of electrical energy delivered/sold' },
      meter_reading: { unit: 'kWh', value: 0, description: 'Meter measurement used for billing' },
      transaction_timestamp: new Date().toISOString()
    }
  })

  const [tx, setTx] = useState<any>({
    buyer: { participant_id: '', organisation_name: '' },
    seller: { participant_id: '', organisation_name: '' },
    transaction_id: context.transaction_id,
    order_status: 'INIT',
    payment: { amount: 0, currency: 'INR', payment_status: 'PENDING', payment_method: 'UPI' }
  })

  // Derived
  const bpp = useMemo(() => BPP_LIST.find(b => b.id === bppId)!, [bppId])
  const pricePerKwh = bpp.pricePerKwh
  const energyKwh = capBudget ? Math.max(5, Math.min(200, Math.floor(budget / pricePerKwh))) : kwh
  const energyClamped = Math.max(bpp.minKwh, Math.min(bpp.maxKwh, energyKwh))
  const energyWarning = energyKwh !== energyClamped
  const totals = computeTotals(energyClamped, pricePerKwh)

  // price outlook
  const { series: priceSeries, cheapest } = useMemo(() => buildPriceSeries(pricePerKwh), [pricePerKwh])

  const canSubmit = Boolean(site && chargerId && bpp.available && (schedule === 'now' ? true : Boolean(startTime)))

  const [copied, setCopied] = useState(false)

  const intentPayload = useMemo(() => buildBAPIntentPayload(context), [context])
  const orderSchema = useMemo(() => buildBAPOrderSchema(organisation, service, tx), [organisation, service, tx])

  // EXTRA: Buy button UX state + toast
  const [isBuying, setIsBuying] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  function handleCopy(json: any) {
    navigator.clipboard?.writeText(JSON.stringify(json, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  // ------------------------------
  // IMPLEMENTED: Search Button
  // ------------------------------
  async function handleSellerSearch() {
    setIsSearching(true)
    // Simulate a tiny delay to show feedback; replace with actual API call if needed.
    await new Promise(r => setTimeout(r, 350))
    setSearchTriggered(true)
    setLastSearchTerm(query.trim())
    setIsSearching(false)
    // Scroll to results for a nicer UX
    document.getElementById('seller-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearSearch() {
    setQuery('')
    setCompFilter('All')
    setSearchTriggered(false)
    setLastSearchTerm('')
  }

  // ------------------------------
  // IMPLEMENTED: Buy Energy Button
  // ------------------------------
  async function handlePurchase() {
    if (!canSubmit) return

    // Optional extra validation for scheduled time in the future
    if (schedule === 'later' && startTime) {
      const start = new Date(startTime)
      if (isNaN(start.getTime()) || start.getTime() < Date.now()) {
        alert('Please choose a valid future start time.')
        return
      }
    }

    setIsBuying(true)

    // Simulate processing + payment handshake
    await new Promise(r => setTimeout(r, 900))

    // You can forward "intentPayload" and "orderSchema" to your APIs here.
    // For now, show a friendly toast confirmation.
    setToastOpen(true)
    setIsBuying(false)
  }

  // Filtered sellers
  const sellers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BPP_LIST.filter(s => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.components.some(c => c.toLowerCase().includes(q))
      const matchesComp = compFilter === 'All' || s.components.includes(compFilter as SellerComponent)
      return matchesQuery && matchesComp
    })
  }, [query, compFilter])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10">
              <Bolt className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">chargeMOD</div>
              <div className="text-xs text-muted-foreground">BAP Energy Marketplace</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <ShieldCheck className="h-4 w-4" />
            BIS compliant • GST invoice ready
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar / Dashboard */}
        {sidebarOpen && (
          <aside className="md:sticky md:top-20 h-fit space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Buyer Profile</div>
                    <div className="text-xs text-muted-foreground">buyer-ev-app.yourdomain.com</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>Bengaluru</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Default connector</span>
                  <span>CCS2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span>18%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Search sellers</CardTitle>
                <CardDescription>Filter by tech stack & region.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search name, city, component…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSellerSearch()
                    }}
                  />
                </div>
                <Select
                  value={compFilter}
                  onChange={e => setCompFilter(e.target.value as any)}
                >
                  <option value="All">All components</option>
                  <option value="VPP">Virtual Power Plant</option>
                  <option value="Micro-grid">Micro power plant</option>
                  <option value="AC Charger">EV Charger (AC)</option>
                  <option value="DC Charger">EV Charger (DC)</option>
                  <option value="Battery Storage">Battery storage</option>
                </Select>

                {/* Actions for SEARCH */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleSellerSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Spinner /> Searching…
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" /> Search
                      </>
                    )}
                  </Button>
                  <GhostButton
                    type="button"
                    onClick={clearSearch}
                    disabled={isSearching || (!query && compFilter === 'All')}
                  >
                    <X className="h-4 w-4" /> Clear
                  </GhostButton>
                </div>

                {/* Result meta */}
                {searchTriggered && (
                  <div className="rounded-xl border bg-muted/40 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>
                        Found <strong>{sellers.length}</strong> {sellers.length === 1 ? 'result' : 'results'}
                        {lastSearchTerm ? (
                          <>
                            {' '}
                            for "<span className="font-medium">{lastSearchTerm}</span>"
                          </>
                        ) : null}
                        {compFilter !== 'All' ? (
                          <>
                            {' '}
                            in <span className="font-medium">{compFilter}</span>
                          </>
                        ) : null}
                        .
                      </span>
                      <span className="text-muted-foreground">Tap a card to select.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Main Column */}
        <main className="space-y-6">
          {/* Seller list & picker */}
          <Card
            id="seller-list"
            className="border-dashed"
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Choose a BAP Seller</CardTitle>
              <CardDescription>Select a power provider to source energy for your session.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sellers.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBppId(opt.id)}
                  className={`group relative rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${bppId === opt.id ? 'border-transparent ring-2 ring-primary' : 'border-muted'} ${!opt.available ? 'opacity-60' : ''}`}
                  disabled={!opt.available}
                  aria-pressed={bppId === opt.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium leading-tight">{opt.name}</div>
                    <div className="text-sm text-muted-foreground">{INR.format(opt.pricePerKwh)}/kWh</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Stars value={opt.rating} />
                    <div className="text-xs text-muted-foreground">
                      {opt.location} • Min {opt.minKwh} • Max {opt.maxKwh} kWh
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {opt.components.map(c => (
                      <span
                        key={c}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                    {opt.tags?.map(t => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {!opt.available && (
                    <div className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                      Unavailable
                    </div>
                  )}
                </button>
              ))}
              {sellers.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No sellers match your filters. Try clearing search or selecting a different component.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Session details</CardTitle>
              <CardDescription>Tell us where and what to power.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site">Site / Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="site"
                    placeholder="Eg. Bengaluru – MG Road"
                    className="pl-9"
                    value={site}
                    onChange={e => setSite(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="charger">Charger ID</Label>
                <div className="relative">
                  <BatteryCharging className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="charger"
                    placeholder="Eg. CM-DC-1024"
                    className="pl-9"
                    value={chargerId}
                    onChange={e => setChargerId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Connector</Label>
                <Select
                  value={connector}
                  onChange={e => setConnector(e.target.value)}
                >
                  <option value="CCS2">CCS2 (DC)</option>
                  <option value="CHAdeMO">CHAdeMO (DC)</option>
                  <option value="Type2">Type-2 (AC)</option>
                  <option value="GBT">GB/T</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Tabs
                  value={schedule}
                  onValueChange={v => setSchedule(v)}
                  options={[
                    { value: 'now', label: 'Start now' },
                    { value: 'later', label: 'Schedule' }
                  ]}
                />
                {schedule === 'now' ? (
                  <div className="pt-1 text-sm text-muted-foreground">
                    We’ll initiate immediately and optimise for best current price.
                  </div>
                ) : (
                  <div className="pt-1 space-y-2">
                    <Label htmlFor="start">Start time</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How much energy */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">How much energy?</CardTitle>
              <CardDescription>Choose by kWh or cap by budget.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <SectionTitle
                  icon={Bolt}
                  title="Energy (kWh)"
                  subtitle={`From ${bpp.name}`}
                />
                <div className="text-sm text-muted-foreground">{INR.format(pricePerKwh)}/kWh</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="px-1">
                  <Slider
                    value={kwh}
                    onChange={setKwh}
                    min={bpp.minKwh}
                    max={bpp.maxKwh}
                    step={1}
                    disabled={capBudget}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Range: {bpp.minKwh}–{bpp.maxKwh} kWh
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={kwh}
                    onChange={e => setKwh(Number(e.target.value))}
                    className="w-28 text-right"
                    disabled={capBudget}
                  />
                  <span className="text-sm text-muted-foreground">kWh</span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SectionTitle
                    icon={Wallet}
                    title="Cap by budget"
                    subtitle="Set a max spend instead"
                  />
                  <Tip content="Uses current BPP rate to estimate kWh. Final energy is clamped to BPP limits.">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Tip>
                </div>
                <Switch
                  checked={capBudget}
                  onChange={setCapBudget}
                />
              </div>
              {capBudget && (
                <>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="px-1">
                      <Slider
                        value={budget}
                        onChange={setBudget}
                        min={200}
                        max={5000}
                        step={50}
                      />
                      <div className="mt-2 text-xs text-muted-foreground">Range: ₹200 – ₹5,000</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={budget}
                        onChange={e => setBudget(Number(e.target.value))}
                        className="w-32 text-right"
                      />
                      <span className="text-sm text-muted-foreground">INR</span>
                    </div>
                  </div>
                  <div className={`text-sm ${energyWarning ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    Estimated energy: <strong>{energyKwh} kWh</strong> → Clamped to <strong>{energyClamped} kWh</strong>
                  </div>
                </>
              )}

              {/* 24h price outlook (SVG, no deps) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">24-hour price outlook</h4>
                  {cheapest ? (
                    <span className="text-xs text-muted-foreground">
                      Cheapest around <strong>{cheapest.label}</strong> ≈ {INR.format(cheapest.price)}/kWh
                    </span>
                  ) : null}
                </div>
                <svg
                  viewBox="0 0 600 160"
                  className="w-full h-40"
                >
                  <defs>
                    <linearGradient
                      id="g"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.05"
                      />
                    </linearGradient>
                  </defs>
                  {/* grid */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <line
                      key={i}
                      x1="0"
                      x2="600"
                      y1={20 + i * 30}
                      y2={20 + i * 30}
                      stroke="currentColor"
                      opacity="0.1"
                    />
                  ))}
                  {/* area */}
                  {(() => {
                    const max = Math.max(...priceSeries.map(p => p.price))
                    const min = Math.min(...priceSeries.map(p => p.price))
                    const scaleX = (i: number) => (i / 23) * 600
                    const scaleY = (v: number) => 140 - ((v - min) / Math.max(0.001, max - min)) * 120
                    const path = priceSeries
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.price)}`)
                      .join(' ')
                    const area = `${path} L 600 160 L 0 160 Z`
                    return (
                      <g>
                        <path
                          d={area}
                          fill="url(#g)"
                        />
                        <path
                          d={path}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </g>
                    )
                  })()}
                  {/* x ticks */}
                  {priceSeries
                    .filter((_, i) => i % 3 === 0)
                    .map((p, i) => (
                      <text
                        key={i}
                        x={((i * 3) / 23) * 600}
                        y={155}
                        fontSize="10"
                        textAnchor="middle"
                        fill="currentColor"
                        opacity="0.7"
                      >
                        {p.label.slice(0, 2)}
                      </text>
                    ))}
                </svg>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Schedule away from 18:00–22:00 to reduce cost.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payload builders */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">BAP Intent (search)</CardTitle>
                <CardDescription>Prepares `/search` payload for Beckn-compatible BAP.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Domain</Label>
                    <Input
                      value={context.domain}
                      onChange={e => setContext({ ...context, domain: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Action</Label>
                    <Input
                      value={context.action}
                      onChange={e => setContext({ ...context, action: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={context.country}
                      onChange={e => setContext({ ...context, country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={context.city}
                      onChange={e => setContext({ ...context, city: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Participant ID</Label>
                    <Input
                      value={context.participant_id}
                      onChange={e => setContext({ ...context, participant_id: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Transaction ID</Label>
                    <Input
                      value={context.transaction_id}
                      onChange={e => setContext({ ...context, transaction_id: e.target.value })}
                    />
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Preview</div>
                    <Button
                      type="button"
                      onClick={() => handleCopy(intentPayload)}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(intentPayload, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Order Schema (org/service/tx)</CardTitle>
                <CardDescription>Prepare payload for onboarding and transaction record.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <details
                  className="rounded-xl border p-3"
                  open
                >
                  <summary className="cursor-pointer text-sm font-medium">Organisation details</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Organisation name</Label>
                      <Input
                        value={organisation.organisation_name}
                        onChange={e => setOrganisation({ ...organisation, organisation_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Short name</Label>
                      <Input
                        value={organisation.short_name}
                        onChange={e => setOrganisation({ ...organisation, short_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Input
                        value={organisation.type_of_organisation}
                        onChange={e => setOrganisation({ ...organisation, type_of_organisation: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Registration #</Label>
                      <Input
                        value={organisation.registration_number}
                        onChange={e => setOrganisation({ ...organisation, registration_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>PAN</Label>
                      <Input
                        value={organisation.PAN}
                        onChange={e => setOrganisation({ ...organisation, PAN: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Head office address</Label>
                      <Textarea
                        rows={2}
                        value={organisation.location_details.head_office_address}
                        onChange={e =>
                          setOrganisation({
                            ...organisation,
                            location_details: { ...organisation.location_details, head_office_address: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </details>

                <details
                  className="rounded-xl border p-3"
                  open
                >
                  <summary className="cursor-pointer text-sm font-medium">Service schema</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Price (INR)</Label>
                      <Input
                        type="number"
                        value={service.price.value}
                        onChange={e =>
                          setService({ ...service, price: { ...service.price, value: Number(e.target.value) } })
                        }
                      />
                    </div>
                    <div>
                      <Label>Fulfillment</Label>
                      <Select
                        value={service.fulfillment.type}
                        onChange={e => setService({ ...service, fulfillment: { type: e.target.value } })}
                      >
                        <option value="ON_FULFILLMENT">ON_FULFILLMENT</option>
                        <option value="ON_DELIVERY">ON_DELIVERY</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Voltage (V)</Label>
                      <Input
                        type="number"
                        value={service.electrical_parameters.voltage.value}
                        onChange={e =>
                          setService({
                            ...service,
                            electrical_parameters: {
                              ...service.electrical_parameters,
                              voltage: { ...service.electrical_parameters.voltage, value: Number(e.target.value) }
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Current (A)</Label>
                      <Input
                        type="number"
                        value={service.electrical_parameters.current.value}
                        onChange={e =>
                          setService({
                            ...service,
                            electrical_parameters: {
                              ...service.electrical_parameters,
                              current: { ...service.electrical_parameters.current, value: Number(e.target.value) }
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Active power (kW)</Label>
                      <Input
                        type="number"
                        value={service.electrical_parameters.active_power.value}
                        onChange={e =>
                          setService({
                            ...service,
                            electrical_parameters: {
                              ...service.electrical_parameters,
                              active_power: {
                                ...service.electrical_parameters.active_power,
                                value: Number(e.target.value)
                              }
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Energy transferred (kWh)</Label>
                      <Input
                        type="number"
                        value={service.electrical_parameters.energy_transferred.value}
                        onChange={e =>
                          setService({
                            ...service,
                            electrical_parameters: {
                              ...service.electrical_parameters,
                              energy_transferred: {
                                ...service.electrical_parameters.energy_transferred,
                                value: Number(e.target.value)
                              }
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </details>

                <details
                  className="rounded-xl border p-3"
                  open
                >
                  <summary className="cursor-pointer text-sm font-medium">Transaction details</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Buyer PID</Label>
                      <Input
                        value={tx.buyer.participant_id}
                        onChange={e => setTx({ ...tx, buyer: { ...tx.buyer, participant_id: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Buyer Org</Label>
                      <Input
                        value={tx.buyer.organisation_name}
                        onChange={e => setTx({ ...tx, buyer: { ...tx.buyer, organisation_name: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Seller PID</Label>
                      <Input
                        value={tx.seller.participant_id}
                        onChange={e => setTx({ ...tx, seller: { ...tx.seller, participant_id: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label>Seller Org</Label>
                      <Input
                        value={tx.seller.organisation_name}
                        onChange={e => setTx({ ...tx, seller: { ...tx.seller, organisation_name: e.target.value } })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Transaction ID</Label>
                      <Input
                        value={tx.transaction_id}
                        onChange={e => setTx({ ...tx, transaction_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Order status</Label>
                      <Input
                        value={tx.order_status}
                        onChange={e => setTx({ ...tx, order_status: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Payment amount</Label>
                      <Input
                        type="number"
                        value={tx.payment.amount}
                        onChange={e => setTx({ ...tx, payment: { ...tx.payment, amount: Number(e.target.value) } })}
                      />
                    </div>
                  </div>
                </details>

                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Preview</div>
                    <Button
                      type="button"
                      onClick={() => handleCopy(orderSchema)}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(orderSchema, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order summary */}
          <Card className="sticky top-20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Order summary</CardTitle>
              <CardDescription>Review before you buy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">BAP Seller</span>
                  <span className="font-medium">{bpp.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Connector</span>
                  <span className="font-medium">{connector}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Energy</span>
                  <span className="font-medium">{energyClamped} kWh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{INR.format(pricePerKwh)}/kWh</span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Energy Cost</span>
                  <span>{INR.format(totals.base)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    Network fee
                    <Tip content="Includes grid & platform costs">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Tip>
                  </span>
                  <span>{INR.format(totals.networkFee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{INR.format(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST (18%)</span>
                  <span>{INR.format(totals.gst)}</span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{INR.format(totals.total)}</span>
              </div>
              <Button
                className="h-11 w-full rounded-2xl"
                disabled={!canSubmit || isBuying}
                onClick={handlePurchase}
              >
                {isBuying ? (
                  <>
                    <Spinner /> Processing…
                  </>
                ) : (
                  <>Buy energy</>
                )}
              </Button>
              {!canSubmit && (
                <p className="text-center text-xs text-muted-foreground">
                  Please enter a Site and Charger ID to proceed.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} chargeMOD. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a
              className="hover:underline"
              href="#"
            >
              Terms
            </a>
            <a
              className="hover:underline"
              href="#"
            >
              Privacy
            </a>
            <a
              className="hover:underline"
              href="#"
            >
              Support
            </a>
          </div>
        </div>
      </footer>

      {/* Purchase success toast */}
      <Toast
        open={toastOpen}
        title="Purchase created!"
        description={`BPP: ${bpp.name} • ${energyClamped} kWh • ${schedule === 'now' ? 'Start now' : `Schedule: ${new Date(startTime).toLocaleString()}`} • Total: ${INR.format(totals.total)}`}
        onClose={() => setToastOpen(false)}
        action={
          <div className="flex items-center gap-2">
            <GhostButton
              onClick={() => {
                setToastOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <Building2 className="h-4 w-4" /> Go to top
            </GhostButton>
            <Button
              onClick={() => {
                // quick copy summary for records
                const summary = {
                  seller: bpp,
                  connector,
                  energy_kwh: energyClamped,
                  schedule,
                  startTime: schedule === 'later' ? startTime : 'now',
                  totals,
                  intentPayload,
                  orderSchema
                }
                navigator.clipboard?.writeText(JSON.stringify(summary, null, 2))
              }}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy summary
            </Button>
          </div>
        }
      />
    </div>
  )
}

// 'use client';

// import React, { useMemo, useState } from 'react';
// import {
//   BatteryCharging,
//   Bolt,
//   Building2,
//   CalendarClock,
//   Info,
//   MapPin,
//   ShieldCheck,
//   Wallet,
//   ClipboardCopy,
//   Check,
//   AlertTriangle,
//   Search,
//   User,
// } from 'lucide-react';

// /**
//  * NOTE: This page uses Tailwind utility classes like bg-background, text-foreground, bg-muted, ring-primary, etc.
//  * If you haven't mapped these in Tailwind v4 yet, either:
//  *   1) Define CSS vars in globals.css (recommended), or
//  *   2) Replace them with palette classes (e.g. bg-white, text-slate-900, bg-gray-100, ring-blue-500).
//  */

// // ------------------------------
// // Minimal UI primitives (no shadcn)
// // ------------------------------
// const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
//   <div className={`rounded-2xl border bg-background text-foreground shadow-sm ${className}`} {...props} />
// );
// const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
//   <div className={`p-5 ${className}`} {...props} />
// );
// const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
//   <h2 className={`text-lg font-semibold ${className}`} {...props} />
// );
// const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...props }) => (
//   <p className={`text-sm text-muted-foreground ${className}`} {...props} />
// );
// const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
//   <div className={`p-5 pt-0 ${className}`} {...props} />
// );

// const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => (
//   <label className={`text-sm font-medium ${className}`} {...props} />
// );

// const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
//   ({ className = '', ...props }, ref) => (
//     <input
//       ref={ref}
//       className={`h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`}
//       {...props}
//     />
//   )
// );
// Input.displayName = 'Input';

// const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
//   <textarea className={`w-full rounded-xl border bg-background p-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`} {...props} />
// );

// const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
//   <button
//     className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
//     {...props}
//   />
// );

// const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
//   <select
//     className={`h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary ${className}`}
//     {...props}
//   >
//     {children}
//   </select>
// );

// const Slider: React.FC<{
//   value: number;
//   onChange: (n: number) => void;
//   min?: number;
//   max?: number;
//   step?: number;
//   disabled?: boolean;
// }> = ({ value, onChange, min = 0, max = 100, step = 1, disabled }) => (
//   <input
//     type="range"
//     className="w-full"
//     value={value}
//     min={min}
//     max={max}
//     step={step}
//     onChange={(e) => onChange(Number(e.target.value))}
//     disabled={disabled}
//   />
// );

// const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void } & React.HTMLAttributes<HTMLButtonElement>> = ({ checked, onChange, className = '', ...props }) => (
//   <button
//     role="switch"
//     aria-checked={checked}
//     onClick={() => onChange(!checked)}
//     className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'} ${className}`}
//     {...props}
//   >
//     <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${checked ? 'left-6' : 'left-0.5'}`} />
//   </button>
// );

// // Tabs
// function Tabs<T extends string>({ value, onValueChange, options, className = '' }: {
//   value: T;
//   onValueChange: (v: T) => void;
//   options: { value: T; label: string }[];
//   className?: string;
// }) {
//   return (
//     <div className={`grid grid-cols-2 rounded-xl border p-1 ${className}`}>
//       {options.map((opt) => (
//         <button
//           key={opt.value}
//           onClick={() => onValueChange(opt.value)}
//           className={`rounded-lg px-3 py-2 text-sm transition ${value === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// // Tooltip: we just use the native title attribute for a lightweight impl
// const Tip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
//   <span title={content} className="inline-flex items-center">{children}</span>
// );

// // --- Helpers ---
// const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
// const GST_RATE = 0.18; // 18%

// // Pure function for totals – easier to test
// function computeTotals(energyKwh: number, pricePerKwh: number, feeRate = 0.03, gstRate = GST_RATE) {
//   const base = energyKwh * pricePerKwh;
//   const networkFee = Math.max(10, Math.round(feeRate * base));
//   const subtotal = base + networkFee;
//   const gst = subtotal * gstRate;
//   const total = subtotal + gst;
//   return { base, networkFee, subtotal, gst, total };
// }

// // Build mock 24h price series and suggest cheapest hour
// function buildPriceSeries(pricePerKwh: number) {
//   const hours = Array.from({ length: 24 }).map((_, h) => h);
//   const series = hours.map((h) => {
//     const adj = h >= 18 && h <= 22 ? 2.2 : h >= 6 && h <= 9 ? 1.2 : -0.6;
//     const price = Math.round((pricePerKwh + adj + Math.sin(h / 3) * 0.4) * 10) / 10;
//     return { h, label: `${h.toString().padStart(2, '0')}:00`, price };
//   });
//   const min = series.reduce((p, c) => (c.price < p.price ? c : p), series[0]);
//   return { series, cheapest: min };
// }

// // Build BAP payloads
// function buildBAPIntentPayload(ctx: any) {
//   return {
//     context: ctx,
//     message: {
//       intent: {
//         descriptor: { name: 'Charge EV' },
//         fulfillment: { type: 'ON_FULFILLMENT' },
//       },
//     },
//   };
// }

// function buildBAPOrderSchema(org: any, service: any, tx: any) {
//   return {
//     organisation_details: org,
//     service_schema: service,
//     transaction_details: tx,
//   };
// }

// // --- Runtime tests (kept light) ---
// (function tests() {
//   if (typeof window === 'undefined') return;
//   try {
//     const totals = computeTotals(100, 10);
//     console.assert(Math.abs(totals.base - 1000) < 1e-9, 'base ok');
//     console.assert(totals.networkFee >= 10, 'network fee min');

//     const { series, cheapest } = buildPriceSeries(12);
//     console.assert(series.length === 24, '24 points');
//     console.assert(series.every((p) => typeof p.price === 'number'), 'numeric prices');
//     console.assert(cheapest && typeof cheapest.h === 'number', 'cheapest hour found');

//     const intent = buildBAPIntentPayload({ domain: 'energy', country: 'IN' });
//     console.assert(intent.message.intent.fulfillment.type === 'ON_FULFILLMENT', 'fulfillment fixed');
//   } catch (e) {
//     console.warn('Sanity tests failed:', e);
//   }
// })();

// // ------------------------------
// // Data
// // ------------------------------
// type SellerComponent = 'VPP' | 'Micro-grid' | 'AC Charger' | 'DC Charger' | 'Battery Storage';

// type BPP = {
//   id: string;
//   name: string;
//   pricePerKwh: number;
//   rating: number; // 0-5
//   available: boolean;
//   minKwh: number;
//   maxKwh: number;
//   components: SellerComponent[];
//   location: string;
//   tags?: string[];
// };

// const BPP_LIST: BPP[] = [
//   { id: 'cm-bpp-01', name: 'chargeMOD Energy Grid', pricePerKwh: 14.5, rating: 4.7, available: true, minKwh: 5, maxKwh: 150, components: ['VPP', 'DC Charger', 'Battery Storage'], location: 'Bengaluru', tags: ['Low network fee', 'Best for DC'] },
//   { id: 'sun-bpp-22', name: 'SunSpark Power Pvt Ltd', pricePerKwh: 13.2, rating: 4.4, available: true, minKwh: 10, maxKwh: 120, components: ['Micro-grid', 'AC Charger'], location: 'Mysuru', tags: ['Solar mix', 'Green'] },
//   { id: 'hydro-bpp-07', name: 'HydroFlow Trading Co', pricePerKwh: 12.8, rating: 4.2, available: false, minKwh: 20, maxKwh: 200, components: ['VPP', 'AC Charger'], location: 'Kochi', tags: ['Budget'] },
// ];

// function Stars({ value }: { value: number }) {
//   const full = Math.floor(value);
//   const half = value - full >= 0.5;
//   return (
//     <div className="flex items-center gap-0.5 text-yellow-500">
//       {Array.from({ length: full }).map((_, i) => (<span key={i}>★</span>))}
//       {half && <span className="opacity-50">★</span>}
//       {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (<span key={i} className="text-muted-foreground opacity-50">★</span>))}
//     </div>
//   );
// }

// function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
//   return (
//     <div className="flex items-center gap-3">
//       <div className="p-2 rounded-xl bg-muted"><Icon className="w-5 h-5" /></div>
//       <div>
//         <h3 className="text-base font-semibold leading-tight">{title}</h3>
//         {subtitle && <p className="text-sm text-muted-foreground leading-tight">{subtitle}</p>}
//       </div>
//     </div>
//   );
// }

// // ------------------------------
// // Main Page
// // ------------------------------
// export default function BuyEnergyPage() {
//   // UI State
//   const [sidebarOpen] = useState(true);

//   // Purchase Controls
//   const [bppId, setBppId] = useState<string>(BPP_LIST[0].id);
//   const [connector, setConnector] = useState<string>('CCS2');
//   const [kwh, setKwh] = useState<number>(25);
//   const [schedule, setSchedule] = useState<'now' | 'later'>('now');
//   const [startTime, setStartTime] = useState<string>('');
//   const [capBudget, setCapBudget] = useState<boolean>(false);
//   const [budget, setBudget] = useState<number>(500);
//   const [site, setSite] = useState<string>('');
//   const [chargerId, setChargerId] = useState<string>('');

//   // Search / Filters
//   const [query, setQuery] = useState('');
//   const [compFilter, setCompFilter] = useState<SellerComponent | 'All'>('All');

//   // BAP Intent Context (pre-filled as requested)
//   const [context, setContext] = useState({
//     domain: 'energy',
//     country: 'IN',
//     city: 'Bengaluru',
//     action: 'search',
//     participant_id: 'buyer-ev-app.yourdomain.com',
//     transaction_id: 'txn-123456',
//   });

//   // Organisation / Service / Transaction schema (simplified inputs)
//   const [organisation, setOrganisation] = useState<any>({
//     organisation_name: '',
//     short_name: '',
//     type_of_organisation: '',
//     registration_number: '',
//     PAN: '',
//     location_details: { head_office_address: '', branch_or_regional_office: '', country: 'India', state_or_province: 'Karnataka', city_or_district: 'Bengaluru', pin_code: '' },
//     contact_information: { official_email: '', official_phone_number: '', website_url: '' },
//   });

//   const [service, setService] = useState<any>({
//     descriptor: { name: 'EV Energy Charging or Selling Service', short_desc: 'Provision to buy or sell electrical energy for EV stations', long_desc: 'Platform for trading electrical energy between EV charging stations, buyers, and sellers using Beckn Protocol.' },
//     category_id: 'EV_ENERGY',
//     price: { currency: 'INR', value: 0 },
//     fulfillment: { type: 'ON_FULFILLMENT' },
//     electrical_parameters: {
//       voltage: { unit: 'Volts', value: 415 },
//       current: { unit: 'Amperes', value: 32 },
//       power_factor: { value: 0.95, description: 'Ratio of real power to apparent power' },
//       active_power: { unit: 'kW', value: 20, description: 'The actual power consumed or generated' },
//       reactive_power: { unit: 'kVAR', value: 5, description: 'Reactive power component' },
//       apparent_power: { unit: 'kVA', value: 21, description: 'Combined effect of active and reactive power' },
//       frequency: { unit: 'Hz', value: 50 },
//       energy_transferred: { unit: 'kWh', value: 0, description: 'The amount of electrical energy delivered/sold' },
//       meter_reading: { unit: 'kWh', value: 0, description: 'Meter measurement used for billing' },
//       transaction_timestamp: new Date().toISOString(),
//     },
//   });

//   const [tx, setTx] = useState<any>({
//     buyer: { participant_id: '', organisation_name: '' },
//     seller: { participant_id: '', organisation_name: '' },
//     transaction_id: context.transaction_id,
//     order_status: 'INIT',
//     payment: { amount: 0, currency: 'INR', payment_status: 'PENDING', payment_method: 'UPI' },
//   });

//   // Derived
//   const bpp = useMemo(() => BPP_LIST.find((b) => b.id === bppId)!, [bppId]);
//   const pricePerKwh = bpp.pricePerKwh;
//   const energyKwh = capBudget ? Math.max(5, Math.min(200, Math.floor(budget / pricePerKwh))) : kwh;
//   const energyClamped = Math.max(bpp.minKwh, Math.min(bpp.maxKwh, energyKwh));
//   const energyWarning = energyKwh !== energyClamped;
//   const totals = computeTotals(energyClamped, pricePerKwh);

//   // price outlook
//   const { series: priceSeries, cheapest } = useMemo(() => buildPriceSeries(pricePerKwh), [pricePerKwh]);

//   const canSubmit = Boolean(site && chargerId && bpp.available && (schedule === 'now' ? true : Boolean(startTime)));

//   const [copied, setCopied] = useState(false);

//   const intentPayload = useMemo(() => buildBAPIntentPayload(context), [context]);
//   const orderSchema = useMemo(() => buildBAPOrderSchema(organisation, service, tx), [organisation, service, tx]);

//   function handleCopy(json: any) {
//     navigator.clipboard?.writeText(JSON.stringify(json, null, 2)).then(() => {
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1200);
//     });
//   }

//   function handlePurchase() {
//     alert(
//       `Purchase created!\n\nBPP: ${bpp.name}\nConnector: ${connector}\nEnergy: ${energyClamped} kWh\nWhen: ${schedule === 'now' ? 'Start now' : new Date(startTime).toLocaleString()}\n\nTotal: ${INR.format(totals.total)} (incl. GST)`
//     );
//   }

//   // Filtered sellers
//   const sellers = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return BPP_LIST.filter((s) => {
//       const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.components.some((c) => c.toLowerCase().includes(q));
//       const matchesComp = compFilter === 'All' || s.components.includes(compFilter as SellerComponent);
//       return matchesQuery && matchesComp;
//     });
//   }, [query, compFilter]);

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/30">
//       {/* Top Bar */}
//       <header className="sticky top-0 z-20 border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
//         <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center gap-3">
//             <div className="grid size-9 place-items-center rounded-xl bg-primary/10"><Bolt className="h-5 w-5" /></div>
//             <div className="leading-tight">
//               <div className="font-semibold">chargeMOD</div>
//               <div className="text-xs text-muted-foreground">BAP Energy Marketplace</div>
//             </div>
//           </div>
//           <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"><ShieldCheck className="h-4 w-4" />BIS compliant • GST invoice ready</div>
//         </div>
//       </header>

//       <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr] gap-6 px-4 py-6 sm:px-6 lg:px-8">
//         {/* Sidebar / Dashboard */}
//         {sidebarOpen && (
//           <aside className="md:sticky md:top-20 h-fit space-y-4">
//             <Card>
//               <CardHeader>
//                 <div className="flex items-center gap-3">
//                   <div className="grid size-10 place-items-center rounded-xl bg-muted"><User className="h-5 w-5" /></div>
//                   <div>
//                     <div className="font-semibold leading-tight">Buyer Profile</div>
//                     <div className="text-xs text-muted-foreground">buyer-ev-app.yourdomain.com</div>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="grid gap-2 text-sm">
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">Location</span><span>Bengaluru</span></div>
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">Default connector</span><span>CCS2</span></div>
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">GST</span><span>18%</span></div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-base">Search sellers</CardTitle>
//                 <CardDescription>Filter by tech stack & region.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input className="pl-9" placeholder="Search name, city, component…" value={query} onChange={(e) => setQuery(e.target.value)} />
//                 </div>
//                 <Select value={compFilter} onChange={(e) => setCompFilter(e.target.value as any)}>
//                   <option value="All">All components</option>
//                   <option value="VPP">Virtual Power Plant</option>
//                   <option value="Micro-grid">Micro power plant</option>
//                   <option value="AC Charger">EV Charger (AC)</option>
//                   <option value="DC Charger">EV Charger (DC)</option>
//                   <option value="Battery Storage">Battery storage</option>
//                 </Select>
//               </CardContent>
//             </Card>
//           </aside>
//         )}

//         {/* Main Column */}
//         <main className="space-y-6">
//           {/* Seller list & picker */}
//           <Card className="border-dashed">
//             <CardHeader className="pb-4">
//               <CardTitle className="text-xl">Choose a BAP Seller</CardTitle>
//               <CardDescription>Select a power provider to source energy for your session.</CardDescription>
//             </CardHeader>
//             <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               {sellers.map((opt) => (
//                 <button
//                   key={opt.id}
//                   onClick={() => setBppId(opt.id)}
//                   className={`group relative rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${bppId === opt.id ? 'border-transparent ring-2 ring-primary' : 'border-muted'} ${!opt.available ? 'opacity-60' : ''}`}
//                   disabled={!opt.available}
//                   aria-pressed={bppId === opt.id}
//                 >
//                   <div className="flex items-start justify-between gap-2">
//                     <div className="font-medium leading-tight">{opt.name}</div>
//                     <div className="text-sm text-muted-foreground">{INR.format(opt.pricePerKwh)}/kWh</div>
//                   </div>
//                   <div className="mt-1 flex items-center justify-between">
//                     <Stars value={opt.rating} />
//                     <div className="text-xs text-muted-foreground">{opt.location} • Min {opt.minKwh} • Max {opt.maxKwh} kWh</div>
//                   </div>
//                   <div className="mt-3 flex flex-wrap gap-1.5">
//                     {opt.components.map((c) => (
//                       <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{c}</span>
//                     ))}
//                     {opt.tags?.map((t) => (
//                       <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
//                     ))}
//                   </div>
//                   {!opt.available && (
//                     <div className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[11px]">Unavailable</div>
//                   )}
//                 </button>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Session details */}
//           <Card>
//             <CardHeader className="pb-4">
//               <CardTitle className="text-xl">Session details</CardTitle>
//               <CardDescription>Tell us where and what to power.</CardDescription>
//             </CardHeader>
//             <CardContent className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-2">
//                 <Label htmlFor="site">Site / Location</Label>
//                 <div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input id="site" placeholder="Eg. Bengaluru – MG Road" className="pl-9" value={site} onChange={(e) => setSite(e.target.value)} />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="charger">Charger ID</Label>
//                 <div className="relative"><BatteryCharging className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input id="charger" placeholder="Eg. CM-DC-1024" className="pl-9" value={chargerId} onChange={(e) => setChargerId(e.target.value)} />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label>Connector</Label>
//                 <Select value={connector} onChange={(e) => setConnector(e.target.value)}>
//                   <option value="CCS2">CCS2 (DC)</option>
//                   <option value="CHAdeMO">CHAdeMO (DC)</option>
//                   <option value="Type2">Type-2 (AC)</option>
//                   <option value="GBT">GB/T</option>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label>Schedule</Label>
//                 <Tabs value={schedule} onValueChange={(v) => setSchedule(v)} options={[{ value: 'now', label: 'Start now' }, { value: 'later', label: 'Schedule' }]} />
//                 {schedule === 'now' ? (
//                   <div className="pt-1 text-sm text-muted-foreground">We’ll initiate immediately and optimise for best current price.</div>
//                 ) : (
//                   <div className="pt-1 space-y-2">
//                     <Label htmlFor="start">Start time</Label>
//                     <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* How much energy */}
//           <Card>
//             <CardHeader className="pb-4">
//               <CardTitle className="text-xl">How much energy?</CardTitle>
//               <CardDescription>Choose by kWh or cap by budget.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-5">
//               <div className="flex items-center justify-between"><SectionTitle icon={Bolt} title="Energy (kWh)" subtitle={`From ${bpp.name}`} /><div className="text-sm text-muted-foreground">{INR.format(pricePerKwh)}/kWh</div></div>
//               <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
//                 <div className="px-1"><Slider value={kwh} onChange={setKwh} min={bpp.minKwh} max={bpp.maxKwh} step={1} disabled={capBudget} /><div className="mt-2 text-xs text-muted-foreground">Range: {bpp.minKwh}–{bpp.maxKwh} kWh</div></div>
//                 <div className="flex items-center gap-2"><Input type="number" value={kwh} onChange={(e) => setKwh(Number(e.target.value))} className="w-28 text-right" disabled={capBudget} /><span className="text-sm text-muted-foreground">kWh</span></div>
//               </div>
//               <div className="h-px bg-border" />
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3"><SectionTitle icon={Wallet} title="Cap by budget" subtitle="Set a max spend instead" /><Tip content="Uses current BPP rate to estimate kWh. Final energy is clamped to BPP limits."><Info className="h-4 w-4 text-muted-foreground" /></Tip></div>
//                 <Switch checked={capBudget} onChange={setCapBudget} />
//               </div>
//               {capBudget && (<>
//                 <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
//                   <div className="px-1"><Slider value={budget} onChange={setBudget} min={200} max={5000} step={50} /><div className="mt-2 text-xs text-muted-foreground">Range: ₹200 – ₹5,000</div></div>
//                   <div className="flex items-center gap-2"><Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-32 text-right" /><span className="text-sm text-muted-foreground">INR</span></div>
//                 </div>
//                 <div className={`text-sm ${energyWarning ? 'text-amber-600' : 'text-muted-foreground'}`}>Estimated energy: <strong>{energyKwh} kWh</strong> → Clamped to <strong>{energyClamped} kWh</strong></div>
//               </>)}

//               {/* 24h price outlook (SVG, no deps) */}
//               <div className="mt-4">
//                 <div className="flex items-center justify-between mb-2"><h4 className="font-medium">24‑hour price outlook</h4>{cheapest ? (<span className="text-xs text-muted-foreground">Cheapest around <strong>{cheapest.label}</strong> ≈ {INR.format(cheapest.price)}/kWh</span>) : null}</div>
//                 <svg viewBox="0 0 600 160" className="w-full h-40">
//                   <defs>
//                     <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
//                       <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
//                     </linearGradient>
//                   </defs>
//                   {/* grid */}
//                   {Array.from({ length: 5 }).map((_, i) => (
//                     <line key={i} x1="0" x2="600" y1={20 + i * 30} y2={20 + i * 30} stroke="currentColor" opacity="0.1" />
//                   ))}
//                   {/* area */}
//                   {(() => {
//                     const max = Math.max(...priceSeries.map((p) => p.price));
//                     const min = Math.min(...priceSeries.map((p) => p.price));
//                     const scaleX = (i: number) => (i / 23) * 600;
//                     const scaleY = (v: number) => 140 - ((v - min) / Math.max(0.001, max - min)) * 120;
//                     const path = priceSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.price)}`).join(' ');
//                     const area = `${path} L 600 160 L 0 160 Z`;
//                     return (
//                       <g>
//                         <path d={area} fill="url(#g)" />
//                         <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
//                       </g>
//                     );
//                   })()}
//                   {/* x ticks */}
//                   {priceSeries.filter((_, i) => i % 3 === 0).map((p, i) => (
//                     <text key={i} x={(i * 3 / 23) * 600} y={155} fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.7">{p.label.slice(0,2)}</text>
//                   ))}
//                 </svg>
//                 <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Schedule away from 18:00–22:00 to reduce cost.</p>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Payload builders */}
//           <div className="grid gap-6 lg:grid-cols-2">
//             <Card>
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-xl">BAP Intent (search)</CardTitle>
//                 <CardDescription>Prepares `/search` payload for Beckn-compatible BAP.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="grid gap-3 sm:grid-cols-2">
//                   <div><Label>Domain</Label><Input value={context.domain} onChange={(e) => setContext({ ...context, domain: e.target.value })} /></div>
//                   <div><Label>Action</Label><Input value={context.action} onChange={(e) => setContext({ ...context, action: e.target.value })} /></div>
//                   <div><Label>Country</Label><Input value={context.country} onChange={(e) => setContext({ ...context, country: e.target.value })} /></div>
//                   <div><Label>City</Label><Input value={context.city} onChange={(e) => setContext({ ...context, city: e.target.value })} /></div>
//                   <div className="sm:col-span-2"><Label>Participant ID</Label><Input value={context.participant_id} onChange={(e) => setContext({ ...context, participant_id: e.target.value })} /></div>
//                   <div className="sm:col-span-2"><Label>Transaction ID</Label><Input value={context.transaction_id} onChange={(e) => setContext({ ...context, transaction_id: e.target.value })} /></div>
//                 </div>
//                 <div className="rounded-xl border bg-muted/40 p-3">
//                   <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium">Preview</div><Button type="button" onClick={() => handleCopy(intentPayload)}>{copied ? (<><Check className="h-4 w-4" />Copied</>) : (<><ClipboardCopy className="h-4 w-4" />Copy</>)}</Button></div>
//                   <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(intentPayload, null, 2)}</pre>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-xl">Order Schema (org/service/tx)</CardTitle>
//                 <CardDescription>Prepare payload for onboarding and transaction record.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <details className="rounded-xl border p-3" open>
//                   <summary className="cursor-pointer text-sm font-medium">Organisation details</summary>
//                   <div className="mt-3 grid gap-3 sm:grid-cols-2">
//                     <div><Label>Organisation name</Label><Input value={organisation.organisation_name} onChange={(e) => setOrganisation({ ...organisation, organisation_name: e.target.value })} /></div>
//                     <div><Label>Short name</Label><Input value={organisation.short_name} onChange={(e) => setOrganisation({ ...organisation, short_name: e.target.value })} /></div>
//                     <div><Label>Type</Label><Input value={organisation.type_of_organisation} onChange={(e) => setOrganisation({ ...organisation, type_of_organisation: e.target.value })} /></div>
//                     <div><Label>Registration #</Label><Input value={organisation.registration_number} onChange={(e) => setOrganisation({ ...organisation, registration_number: e.target.value })} /></div>
//                     <div><Label>PAN</Label><Input value={organisation.PAN} onChange={(e) => setOrganisation({ ...organisation, PAN: e.target.value })} /></div>
//                     <div className="sm:col-span-2"><Label>Head office address</Label><Textarea rows={2} value={organisation.location_details.head_office_address} onChange={(e) => setOrganisation({ ...organisation, location_details: { ...organisation.location_details, head_office_address: e.target.value } })} /></div>
//                   </div>
//                 </details>

//                 <details className="rounded-xl border p-3" open>
//                   <summary className="cursor-pointer text-sm font-medium">Service schema</summary>
//                   <div className="mt-3 grid gap-3 sm:grid-cols-2">
//                     <div><Label>Price (INR)</Label><Input type="number" value={service.price.value} onChange={(e) => setService({ ...service, price: { ...service.price, value: Number(e.target.value) } })} /></div>
//                     <div><Label>Fulfillment</Label>
//                       <Select value={service.fulfillment.type} onChange={(e) => setService({ ...service, fulfillment: { type: e.target.value } })}>
//                         <option value="ON_FULFILLMENT">ON_FULFILLMENT</option>
//                         <option value="ON_DELIVERY">ON_DELIVERY</option>
//                       </Select>
//                     </div>
//                     <div><Label>Voltage (V)</Label><Input type="number" value={service.electrical_parameters.voltage.value} onChange={(e) => setService({ ...service, electrical_parameters: { ...service.electrical_parameters, voltage: { ...service.electrical_parameters.voltage, value: Number(e.target.value) } } })} /></div>
//                     <div><Label>Current (A)</Label><Input type="number" value={service.electrical_parameters.current.value} onChange={(e) => setService({ ...service, electrical_parameters: { ...service.electrical_parameters, current: { ...service.electrical_parameters.current, value: Number(e.target.value) } } })} /></div>
//                     <div><Label>Active power (kW)</Label><Input type="number" value={service.electrical_parameters.active_power.value} onChange={(e) => setService({ ...service, electrical_parameters: { ...service.electrical_parameters, active_power: { ...service.electrical_parameters.active_power, value: Number(e.target.value) } } })} /></div>
//                     <div><Label>Energy transferred (kWh)</Label><Input type="number" value={service.electrical_parameters.energy_transferred.value} onChange={(e) => setService({ ...service, electrical_parameters: { ...service.electrical_parameters, energy_transferred: { ...service.electrical_parameters.energy_transferred, value: Number(e.target.value) } } })} /></div>
//                   </div>
//                 </details>

//                 <details className="rounded-xl border p-3" open>
//                   <summary className="cursor-pointer text-sm font-medium">Transaction details</summary>
//                   <div className="mt-3 grid gap-3 sm:grid-cols-2">
//                     <div><Label>Buyer PID</Label><Input value={tx.buyer.participant_id} onChange={(e) => setTx({ ...tx, buyer: { ...tx.buyer, participant_id: e.target.value } })} /></div>
//                     <div><Label>Buyer Org</Label><Input value={tx.buyer.organisation_name} onChange={(e) => setTx({ ...tx, buyer: { ...tx.buyer, organisation_name: e.target.value } })} /></div>
//                     <div><Label>Seller PID</Label><Input value={tx.seller.participant_id} onChange={(e) => setTx({ ...tx, seller: { ...tx.seller, participant_id: e.target.value } })} /></div>
//                     <div><Label>Seller Org</Label><Input value={tx.seller.organisation_name} onChange={(e) => setTx({ ...tx, seller: { ...tx.seller, organisation_name: e.target.value } })} /></div>
//                     <div className="sm:col-span-2"><Label>Transaction ID</Label><Input value={tx.transaction_id} onChange={(e) => setTx({ ...tx, transaction_id: e.target.value })} /></div>
//                     <div><Label>Order status</Label><Input value={tx.order_status} onChange={(e) => setTx({ ...tx, order_status: e.target.value })} /></div>
//                     <div><Label>Payment amount</Label><Input type="number" value={tx.payment.amount} onChange={(e) => setTx({ ...tx, payment: { ...tx.payment, amount: Number(e.target.value) } })} /></div>
//                   </div>
//                 </details>

//                 <div className="rounded-xl border bg-muted/40 p-3">
//                   <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium">Preview</div><Button type="button" onClick={() => handleCopy(orderSchema)}>{copied ? (<><Check className="h-4 w-4" />Copied</>) : (<><ClipboardCopy className="h-4 w-4" />Copy</>)}</Button></div>
//                   <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(orderSchema, null, 2)}</pre>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Order summary */}
//           <Card className="sticky top-20">
//             <CardHeader className="pb-4">
//               <CardTitle className="text-xl">Order summary</CardTitle>
//               <CardDescription>Review before you buy.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid gap-3 text-sm">
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">BAP Seller</span><span className="font-medium">{bpp.name}</span></div>
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">Connector</span><span className="font-medium">{connector}</span></div>
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">Energy</span><span className="font-medium">{energyClamped} kWh</span></div>
//                 <div className="flex items-center justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">{INR.format(pricePerKwh)}/kWh</span></div>
//               </div>
//               <div className="h-px bg-border" />
//               <div className="grid gap-2 text-sm">
//                 <div className="flex items-center justify-between"><span>Energy Cost</span><span>{INR.format(totals.base)}</span></div>
//                 <div className="flex items-center justify-between"><span className="flex items-center gap-1.5">Network fee<Tip content="Includes grid & platform costs"><Info className="h-3.5 w-3.5 text-muted-foreground" /></Tip></span><span>{INR.format(totals.networkFee)}</span></div>
//                 <div className="flex items-center justify-between"><span>Subtotal</span><span>{INR.format(totals.subtotal)}</span></div>
//                 <div className="flex items-center justify-between"><span>GST (18%)</span><span>{INR.format(totals.gst)}</span></div>
//               </div>
//               <div className="h-px bg-border" />
//               <div className="flex items-center justify-between text-base font-semibold"><span>Total</span><span>{INR.format(totals.total)}</span></div>
//               <Button className="h-11 w-full rounded-2xl" disabled={!canSubmit} onClick={handlePurchase}>Buy energy</Button>
//               {!canSubmit && (<p className="text-center text-xs text-muted-foreground">Please enter a Site and Charger ID to proceed.</p>)}
//             </CardContent>
//           </Card>
//         </main>
//       </div>

//       {/* Footer */}
//       <footer className="border-t py-10">
//         <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
//           <div>© {new Date().getFullYear()} chargeMOD. All rights reserved.</div>
//           <div className="flex items-center gap-4">
//             <a className="hover:underline" href="#">Terms</a>
//             <a className="hover:underline" href="#">Privacy</a>
//             <a className="hover:underline" href="#">Support</a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
