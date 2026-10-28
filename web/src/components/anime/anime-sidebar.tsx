/*
 * [anime v4] 全新侧边栏：头像卡 + 彩色胶囊导航 + 看板娘
 */
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/components/ui/sidebar'
import { checkIsActive } from '@/components/layout/lib/url-utils'
import type {
  NavChatPresets,
  NavCollapsible,
  NavGroup,
  NavLink,
} from '@/components/layout/types'
import { ChatPresetsItem } from '@/components/layout/components/chat-presets-item'
import { useAnimeAvatarVersion } from '@/components/anime/anime-avatar-picker'
import { getUserAvatarUrl } from '@/lib/avatar'
import { formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

const TONES = ['pink', 'sky', 'lilac', 'mint', 'peach']

export function AnimeSidebarProfile() {
  const { t } = useTranslation()
  const { state, isMobile } = useSidebar()
  const user = useAuthStore((s) => s.auth.user)
  useAnimeAvatarVersion()
  if (!user) return null
  const collapsed = state === 'collapsed' && !isMobile
  const name = user.display_name || user.username || ''
  return (
    <Link to='/profile' className='as-profile' data-collapsed={collapsed ? '1' : '0'}>
      <img src={getUserAvatarUrl(user.username || name)} alt='' className='as-avatar' />
      {!collapsed && (
        <div className='as-profile-text'>
          <b>{name}</b>
          <span>
            {t('anime.home.balance')} · {formatQuota(Number(user.quota ?? 0))}
          </span>
        </div>
      )}
    </Link>
  )
}

function Item({ item, href, tone, collapsed }: { item: NavLink; href: string; tone: string; collapsed: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const active = checkIsActive(href, item)
  const Icon = item.icon
  return (
    <Link
      to={item.url}
      preload={isMobile ? false : undefined}
      onClick={() => setOpenMobile(false)}
      className='as-item'
      data-active={active ? '1' : '0'}
      data-tone={tone}
      title={collapsed ? item.title : undefined}
    >
      <span className='as-ico'>{Icon && <Icon className='size-4' />}</span>
      {!collapsed && <span className='as-label'>{item.title}</span>}
      {!collapsed && item.badge && <span className='as-badge'>{item.badge}</span>}
    </Link>
  )
}

function Folder({ item, href, tone, collapsed }: { item: NavCollapsible; href: string; tone: string; collapsed: boolean }) {
  const active = checkIsActive(href, item)
  const [open, setOpen] = useState(active)
  const Icon = item.icon
  if (collapsed) {
    const first = item.items[0]
    return first ? <Item item={{ ...first, icon: item.icon } as NavLink} href={href} tone={tone} collapsed /> : null
  }
  return (
    <div className='as-folder' data-open={open ? '1' : '0'}>
      <button type='button' className='as-item' data-active={active ? '1' : '0'} data-tone={tone} onClick={() => setOpen(!open)}>
        <span className='as-ico'>{Icon && <Icon className='size-4' />}</span>
        <span className='as-label'>{item.title}</span>
        <ChevronDown className='as-chev size-4' />
      </button>
      {open && (
        <div className='as-sub'>
          {item.items.map((s) => (
            <Item key={String(s.url)} item={s as NavLink} href={href} tone={tone} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AnimeNav({ groups }: { groups: NavGroup[] }) {
  const { state, isMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const href = useLocation({ select: (l) => l.href })
  let n = 0
  return (
    <nav className='as-nav' data-collapsed={collapsed ? '1' : '0'}>
      {groups.map((g) => (
        <section key={g.id || g.title} className='as-group'>
          {!collapsed && <div className='as-group-title'>{g.title}</div>}
          <div className='as-group-items'>
            {g.items.map((item) => {
              const tone = TONES[n++ % TONES.length]
              const key = `${item.title}-${item.url || item.type}`
              if (item.type === 'chat-presets') {
                return (
                  <div key={key} className='as-presets'>
                    <ChatPresetsItem item={item as NavChatPresets} />
                  </div>
                )
              }
              if (item.items) return <Folder key={key} item={item as NavCollapsible} href={href} tone={tone} collapsed={collapsed} />
              return <Item key={key} item={item as NavLink} href={href} tone={tone} collapsed={collapsed} />
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}

export function AnimeSidebarMascot() {
  const { t } = useTranslation()
  const { state, isMobile } = useSidebar()
  if (state === 'collapsed' && !isMobile) return null
  return (
    <div className='as-mascot' aria-hidden='true'>
      <div className='as-mascot-bubble'>{t('anime.side.bubble')}</div>
      <img src='/anime/side-peek.webp' alt='' loading='lazy' />
    </div>
  )
}
