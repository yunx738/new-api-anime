/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import {
  Boxes,
  Gift,
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
import { formatQuota } from '@/lib/format'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

type Tile = {
  to: string
  icon: LucideIcon
  label: string
  tone: 'pink' | 'sky' | 'lilac' | 'mint' | 'peach'
  admin?: boolean
}

function greetingKey(hour: number) {
  if (hour < 5) return 'anime.welcome.night'
  if (hour < 11) return 'anime.welcome.morning'
  if (hour < 14) return 'anime.welcome.noon'
  if (hour < 18) return 'anime.welcome.afternoon'
  return 'anime.welcome.evening'
}

export function AnimeWelcome() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  const name = user?.display_name || user?.username || ''
  const quota = Number(user?.quota ?? 0)
  const count = Number(user?.request_count ?? 0)

  const tiles: Tile[] = [
    { to: '/keys', icon: KeyRound, label: t('API Keys'), tone: 'pink' },
    { to: '/wallet', icon: Gift, label: t('anime.tile.redeem'), tone: 'peach' },
    { to: '/playground', icon: MessageCircle, label: t('Playground'), tone: 'sky' },
    { to: '/usage-logs/common', icon: ScrollText, label: t('Usage Logs'), tone: 'lilac' },
    { to: '/pricing', icon: Store, label: t('Model Square'), tone: 'mint' },
    { to: '/profile', icon: UserRound, label: t('Profile'), tone: 'pink' },
    { to: '/channels', icon: RadioTower, label: t('Channels'), tone: 'sky', admin: true },
    { to: '/models/metadata', icon: Boxes, label: t('Models'), tone: 'mint', admin: true },
    { to: '/users', icon: Users, label: t('Users'), tone: 'lilac', admin: true },
    { to: '/redemption-codes', icon: Sparkles, label: t('Redemption Codes'), tone: 'peach', admin: true },
    { to: '/system-settings/site', icon: Settings, label: t('System Settings'), tone: 'pink', admin: true },
  ]
  const visible = tiles.filter((x) => !x.admin || isAdmin)

  return (
    <section className='anime-welcome'>
      <div className='anime-welcome-card'>
        <img
          src='/anime/mascot-cut.webp'
          alt=''
          className='anime-welcome-mascot'
          draggable={false}
        />
        <div className='anime-bubble anime-bubble-left'>
          <b>
            {t(greetingKey(new Date().getHours()))}
            {name ? `，${name}` : ''} ～
          </b>
          <span>
            {t('anime.welcome.quota', {
              quota: formatQuota(quota),
              count,
            })}
          </span>
        </div>
      </div>
      <nav className='anime-menu-grid' aria-label={t('anime.welcome.menu')}>
        {visible.map((tile) => {
          const Icon = tile.icon
          return (
            <Link
              key={tile.to}
              to={tile.to as never}
              className='anime-tile'
              data-tone={tile.tone}
            >
              <span className='anime-tile-icon'>
                <Icon className='size-6' aria-hidden='true' />
              </span>
              <span className='anime-tile-label'>{tile.label}</span>
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
