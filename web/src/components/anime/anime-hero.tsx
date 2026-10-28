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
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LayoutDashboard, LogIn, Sparkles, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'

const BUBBLE_KEYS = [
  'anime.hero.bubble1',
  'anime.hero.bubble2',
  'anime.hero.bubble3',
  'anime.hero.bubble4',
]

export function AnimeHero(props: { isAuthenticated?: boolean }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const name = (status?.system_name as string | undefined) || 'New API'
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setIdx((i) => (i + 1) % BUBBLE_KEYS.length),
      4800
    )
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className='anime-hero'>
      <div className='anime-hero-stickers' aria-hidden='true'>
        <img className='s1' src='/anime/chibi-happy.webp' alt='' loading='lazy' />
        <img className='s2' src='/anime/chibi-coin.webp' alt='' loading='lazy' />
        <img className='s3' src='/anime/chibi-chat.webp' alt='' loading='lazy' />
      </div>
      <div className='anime-hero-inner'>
        <div className='anime-hero-text'>
          <span className='anime-chip'>
            <Sparkles className='size-3.5' aria-hidden='true' />
            {t('anime.hero.chip')}
          </span>
          <h1 className='anime-hero-title'>{name}</h1>
          <p className='anime-hero-sub'>{t('anime.hero.sub')}</p>
          <div className='anime-hero-actions'>
            {props.isAuthenticated ? (
              <Link to='/dashboard' className='anime-btn anime-btn-primary'>
                <LayoutDashboard className='size-5' aria-hidden='true' />
                {t('anime.hero.enter')}
              </Link>
            ) : (
              <Link to='/sign-in' className='anime-btn anime-btn-primary'>
                <LogIn className='size-5' aria-hidden='true' />
                {t('anime.hero.login')}
              </Link>
            )}
            <Link to='/pricing' className='anime-btn anime-btn-ghost'>
              <Store className='size-5' aria-hidden='true' />
              {t('anime.hero.models')}
            </Link>
          </div>
          <div className='anime-hero-tags'>
            <span>✿ {t('anime.hero.tag1')}</span>
            <span>✦ {t('anime.hero.tag2')}</span>
          </div>
        </div>
        <div className='anime-hero-figure'>
          <div className='anime-bubble anime-bubble-hero' key={idx}>
            {t(BUBBLE_KEYS[idx])}
          </div>
          <img
            src='/anime/tachie.webp'
            alt=''
            className='anime-tachie'
            draggable={false}
          />
        </div>
      </div>
    </section>
  )
}
