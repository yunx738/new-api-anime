import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()
  return (
    <div className='v6-auth'>
      <img className='v6-auth-bg' src='/anime/v6/login1.webp' alt='' decoding='async' />
      <div className='v6-auth-veil' aria-hidden='true' />
      <header className='v6-auth-head'>
        <Link to='/' className='v6-auth-brand'>
          {loading ? (
            <Skeleton className='size-8 rounded-full' />
          ) : (
            <img src={logo} alt={t('Logo')} className='size-8 rounded-full object-cover' />
          )}
          <span className='v6-auth-brand-text'>
            {loading ? <Skeleton className='h-5 w-24' /> : <b>{systemName}</b>}
            <small>{t('v6.auth.tagline', '春日的候车室')}</small>
          </span>
        </Link>
        <Link to='/' className='v6-auth-home'>
          ← {t('v6.auth.home', '主页')}
        </Link>
      </header>
      <main className='v6-auth-main'>
        <div className='v6-auth-card'>
          <div className='v6-auth-ticket'>
            <span className='v6-auth-no'>ST-01</span>
            <span>{t('v6.auth.platform', '● 候车登车处 ●')}</span>
            <span className='v6-auth-no'>SPRING</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
