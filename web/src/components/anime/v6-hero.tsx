import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'

const HERO_IMAGES = ['/anime/v6/hero1.webp', '/anime/v6/hero2.webp']

export function V6Hero(props: { isAuthenticated?: boolean }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const name = (status?.system_name as string | undefined) || 'New API'
  const [img] = useState(
    () => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]
  )
  const quote = t('v6.hero.quote', '愿每一次提问，都能收到温柔的回答')
  return (
    <section className='v6-hero' aria-label={quote}>
      <img className='v6-hero-image' src={img} alt='' decoding='async' />
      <div className='v6-hero-shade' aria-hidden='true' />
      <div className='v6-hero-layout'>
        <article className='v6-card'>
          <div className='v6-kicker'>
            <span className='v6-kicker-dot' aria-hidden='true' />
            <span>
              {name} · {t('v6.hero.kicker', '春日小站')}
            </span>
            <span className='v6-kicker-vol'>VOL. 01 / SPRING</span>
          </div>
          <h1 className='v6-quote'>{quote}</h1>
          <p className='v6-quote-en'>
            {t(
              'v6.hero.en',
              '“Every question deserves a gentle answer — under falling petals and a quiet spring sky.”'
            )}
          </p>
          <div className='v6-source'>
            <span className='v6-source-title'>
              {t('v6.hero.source', '《春の待合室》')}
            </span>
            <span className='v6-source-sub'>· original illustration</span>
          </div>
          <div className='v6-actions'>
            <Link
              to={props.isAuthenticated ? '/dashboard' : '/sign-in'}
              className='v6-btn v6-btn-primary'
            >
              {props.isAuthenticated
                ? t('v6.hero.enter', '进入控制台')
                : t('v6.hero.login', '登录')}
              <ArrowRight className='size-4' aria-hidden='true' />
            </Link>
            <Link to='/pricing' className='v6-btn v6-btn-ghost'>
              <BookOpen className='size-4' aria-hidden='true' />
              {t('v6.hero.models', '模型广场')}
            </Link>
          </div>
          <div className='v6-meta'>
            <span>STATION 01 · PERSONAL GATEWAY</span>
            <span>MEMORIAL SPRING EDITION</span>
          </div>
        </article>
      </div>
    </section>
  )
}
