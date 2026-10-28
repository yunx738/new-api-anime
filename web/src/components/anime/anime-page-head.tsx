/*
 * [anime v4] 所有功能页统一的新页头：按路由自动挑选插画
 */
import { useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const ART: [RegExp, string, string][] = [
  [/^\/keys/, 'pg-keys', 'pink'],
  [/^\/usage-logs\/(task|drawing)/, 'pg-task', 'lilac'],
  [/^\/usage-logs/, 'pg-logs', 'lilac'],
  [/^\/wallet/, 'pg-wallet', 'peach'],
  [/^\/channels/, 'pg-channel', 'sky'],
  [/^\/users/, 'pg-users', 'mint'],
  [/^\/system-(settings|info)/, 'pg-setting', 'sky'],
  [/^\/models/, 'pg-models', 'mint'],
  [/^\/redemption-codes/, 'pg-ticket', 'peach'],
  [/^\/subscriptions/, 'pg-ticket', 'peach'],
  [/^\/profile/, 'pg-profile', 'pink'],
  [/^\/(playground|chat)/, 'pg-play', 'sky'],
  [/^\/dashboard/, 'chibi-chart', 'lilac'],
]

export function AnimePageHead(props: { title: ReactNode; actions: ReactNode; breadcrumb: ReactNode }) {
  const path = useLocation({ select: (l) => l.pathname })
  const hit = ART.find(([re]) => re.test(path))
  const img = hit ? hit[1] : 'chibi-wave'
  const tone = hit ? hit[2] : 'pink'
  return (
    <div className='aph' data-tone={tone}>
      {props.breadcrumb != null && <div className='aph-crumb'>{props.breadcrumb}</div>}
      <div className='aph-row'>
        <img className='aph-art' src={`/anime/${img}.webp`} alt='' decoding='async' />
        <div className='aph-title'>
          <h2 className='truncate'>{props.title}</h2>
        </div>
        {props.actions != null && <div className='aph-actions'>{props.actions}</div>}
      </div>
    </div>
  )
}
