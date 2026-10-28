/*
 * [anime v3] 全新的控制台首页（替换原 OverviewDashboard）
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Boxes,
  ChevronRight,
  LayoutDashboard as Gift,
  KeyRound,
  MessageCircle,
  RadioTower,
  ScrollText,
  Settings,
  Sparkles,
  Store,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useAnnouncements } from '@/features/dashboard/hooks/use-status-data'
import { getApiKeys } from '@/features/keys/api'
import { formatQuota } from '@/lib/format'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const DAY = 86400

function greetingKey(h: number) {
  if (h < 5) return 'anime.welcome.night'
  if (h < 11) return 'anime.welcome.morning'
  if (h < 14) return 'anime.welcome.noon'
  if (h < 18) return 'anime.welcome.afternoon'
  return 'anime.welcome.evening'
}

function compact(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n))
}

type Stat = { img: string; label: string; value: string; tone: string }
type Door = {
  to: string
  icon: LucideIcon
  label: string
  img?: string
  tone: string
}

export function AnimeHome() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  const name = user?.display_name || user?.username || ''

  const range = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const today0 = Math.floor(d.getTime() / 1000)
    return { start: today0 - 6 * DAY, end: now }
  }, [])
  const usage = useQuery({
    queryKey: ['anime-home-usage', range.start],
    queryFn: () =>
      getUserQuotaDates(
        { start_timestamp: range.start, end_timestamp: range.end },
        false
      ),
    staleTime: 60_000,
  })
  const keys = useQuery({
    queryKey: ['anime-home-keys'],
    queryFn: () => getApiKeys({ p: 1, size: 5 }),
    staleTime: 60_000,
  })
  const { items: notices } = useAnnouncements()

  const days = useMemo(() => {
    const arr = Array.from({ length: 7 }, (_, i) => {
      const ts = range.start + i * DAY
      const d = new Date(ts * 1000)
      return { ts, label: `${d.getMonth() + 1}/${d.getDate()}`, quota: 0, count: 0 }
    })
    const models = new Map<string, number>()
    for (const it of usage.data?.data ?? []) {
      const idx = Math.floor((it.created_at - range.start) / DAY)
      if (idx >= 0 && idx < 7) {
        arr[idx].quota += it.quota ?? 0
        arr[idx].count += it.count ?? 0
      }
      const m = it.model_name || '?'
      models.set(m, (models.get(m) ?? 0) + (it.quota ?? 0))
    }
    const max = Math.max(1, ...arr.map((x) => x.quota))
    const top = [...models.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topMax = Math.max(1, ...top.map((x) => x[1]))
    const weekQuota = arr.reduce((a, x) => a + x.quota, 0)
    const weekCount = arr.reduce((a, x) => a + x.count, 0)
    return { arr, max, top, topMax, weekQuota, weekCount }
  }, [usage.data, range.start])

  const keyItems = keys.data?.data?.items ?? []
  const keyTotal = keys.data?.data?.total ?? 0

  const stats: Stat[] = [
    { img: '/anime/chibi-coin.webp', label: t('anime.home.balance'), value: formatQuota(Number(user?.quota ?? 0)), tone: 'peach' },
    { img: '/anime/chibi-chart.webp', label: t('anime.home.week'), value: formatQuota(days.weekQuota), tone: 'lilac' },
    { img: '/anime/chibi-chat.webp', label: t('anime.home.calls'), value: compact(Number(user?.request_count ?? 0)), tone: 'sky' },
    { img: '/anime/chibi-key.webp', label: t('anime.home.keys'), value: String(keyTotal), tone: 'mint' },
  ]

  const doors: Door[] = [
    { to: '/playground', icon: MessageCircle, label: t('Playground'), img: '/anime/chibi-chat.webp', tone: 'sky' },
    { to: '/keys', icon: KeyRound, label: t('API Keys'), img: '/anime/chibi-key.webp', tone: 'pink' },
    { to: '/dashboard/models', icon: Gift, label: t('Model Call Analytics'), img: '/anime/chibi-think.webp', tone: 'peach' },
    { to: '/pricing', icon: Store, label: t('Model Square'), img: '/anime/chibi-happy.webp', tone: 'mint' },
    { to: '/usage-logs/common', icon: ScrollText, label: t('Usage Logs'), img: '/anime/chibi-chart.webp', tone: 'lilac' },
    { to: '/profile', icon: UserRound, label: t('Profile'), img: '/anime/chibi-wave.webp', tone: 'pink' },
  ]
  const adminDoors: Door[] = [
    { to: '/channels', icon: RadioTower, label: t('Channels'), tone: 'sky' },
    { to: '/models/metadata', icon: Boxes, label: t('Models'), tone: 'mint' },
    { to: '/users', icon: Users, label: t('Users'), tone: 'lilac' },
    { to: '/redemption-codes', icon: Sparkles, label: t('Redemption Codes'), tone: 'peach' },
    { to: '/system-settings/site', icon: Settings, label: t('System Settings'), tone: 'pink' },
  ]

  return (
    <div className='ah'>
      <section className='ah-banner'>
        <img className='ah-banner-bg' src='/anime/banner-room.webp' alt='' decoding='async' />
        <div className='ah-banner-text'>
          <span className='ah-chip'>✿ {t('anime.home.chip')}</span>
          <h2 className='ah-hello'>
            {t(greetingKey(new Date().getHours()))}
            {name ? `，${name}` : ''}
          </h2>
          <p className='ah-sub'>{t('anime.home.sub', { count: days.weekCount })}</p>
          <div className='ah-banner-actions'>
            <Link to='/playground' className='anime-btn anime-btn-primary'>
              <MessageCircle className='size-5' aria-hidden='true' />
              {t('anime.home.chat')}
            </Link>
            <Link to='/keys' className='anime-btn anime-btn-ghost'>
              <KeyRound className='size-5' aria-hidden='true' />
              {t('anime.home.getkey')}
            </Link>
          </div>
        </div>
        <img className='ah-banner-chibi' src='/anime/chibi-wave.webp' alt='' decoding='async' />
      </section>

      <section className='ah-stats'>
        {stats.map((s) => (
          <div key={s.label} className='ah-stat' data-tone={s.tone}>
            <img src={s.img} alt='' loading='lazy' decoding='async' />
            <div>
              <div className='ah-stat-label'>{s.label}</div>
              <div className='ah-stat-value'>{s.value}</div>
            </div>
          </div>
        ))}
      </section>

      <div className='ah-grid'>
        <section className='ah-panel ah-chart'>
          <header className='ah-panel-head'>
            <h3>{t('anime.home.chart')}</h3>
            <Link to='/usage-logs/common' className='ah-more'>
              {t('anime.home.more')} <ChevronRight className='size-4' />
            </Link>
          </header>
          {days.weekQuota === 0 && !usage.isLoading ? (
            <div className='ah-empty'>
              <img src='/anime/chibi-sleep.webp' alt='' loading='lazy' />
              <span>{t('anime.home.nodata')}</span>
            </div>
          ) : (
            <div className='ah-bars'>
              {days.arr.map((d) => (
                <div key={d.ts} className='ah-bar-col' title={`${d.label} · ${formatQuota(d.quota)} · ${d.count}`}>
                  <span className='ah-bar-val'>{d.quota ? formatQuota(d.quota) : ''}</span>
                  <div className='ah-bar-track'>
                    <div className='ah-bar' style={{ height: `${Math.max(3, (d.quota / days.max) * 100)}%` }} />
                  </div>
                  <span className='ah-bar-label'>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className='ah-panel ah-notice'>
          <header className='ah-panel-head'>
            <h3>{t('anime.home.notice')}</h3>
          </header>
          <div className='ah-notice-body'>
            <img src='/anime/chibi-run.webp' alt='' loading='lazy' className='ah-notice-chibi' />
            <div className='ah-notice-list'>
              {notices.length === 0 ? (
                <div className='ah-say'>{t('anime.home.nonotice')}</div>
              ) : (
                notices.slice(0, 3).map((n, i) => (
                  <div key={n.id ?? i} className='ah-say'>
                    {n.content.replace(/[#*_`>]/g, '').slice(0, 120)}
                    {n.publishDate && <small>{n.publishDate.slice(0, 10)}</small>}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className='ah-panel'>
          <header className='ah-panel-head'>
            <h3>{t('anime.home.top')}</h3>
          </header>
          {days.top.length === 0 ? (
            <div className='ah-empty'>
              <img src='/anime/chibi-think.webp' alt='' loading='lazy' />
              <span>{t('anime.home.nodata')}</span>
            </div>
          ) : (
            <ol className='ah-rank'>
              {days.top.map(([m, q], i) => (
                <li key={m}>
                  <span className='ah-rank-no'>{i + 1}</span>
                  <span className='ah-rank-name' title={m}>{m}</span>
                  <span className='ah-rank-bar'><i style={{ width: `${(q / days.topMax) * 100}%` }} /></span>
                  <span className='ah-rank-q'>{formatQuota(q)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className='ah-panel'>
          <header className='ah-panel-head'>
            <h3>{t('anime.home.mykeys')}</h3>
            <Link to='/keys' className='ah-more'>
              {t('anime.home.more')} <ChevronRight className='size-4' />
            </Link>
          </header>
          {keyItems.length === 0 && !keys.isLoading ? (
            <div className='ah-empty'>
              <img src='/anime/chibi-key.webp' alt='' loading='lazy' />
              <span>{t('anime.home.nokey')}</span>
            </div>
          ) : (
            <ul className='ah-keys'>
              {keyItems.map((k) => (
                <li key={k.id}>
                  <span className='ah-dot' data-on={k.status === 1 ? '1' : '0'} />
                  <span className='ah-key-name'>{k.name || `#${k.id}`}</span>
                  <span className='ah-key-q'>{k.unlimited_quota ? '∞' : formatQuota(k.remain_quota)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className='ah-doors'>
        {doors.map((d) => {
          const Icon = d.icon
          return (
            <Link key={d.to} to={d.to as never} className='ah-door' data-tone={d.tone}>
              {d.img && <img src={d.img} alt='' loading='lazy' decoding='async' />}
              <span className='ah-door-label'>
                <Icon className='size-4' aria-hidden='true' />
                {d.label}
              </span>
            </Link>
          )
        })}
      </section>

      {isAdmin && (
        <section className='ah-admin'>
          <span className='ah-admin-title'>{t('anime.home.admin')}</span>
          {adminDoors.map((d) => {
            const Icon = d.icon
            return (
              <Link key={d.to} to={d.to as never} className='ah-pill' data-tone={d.tone}>
                <Icon className='size-4' aria-hidden='true' />
                {d.label}
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
