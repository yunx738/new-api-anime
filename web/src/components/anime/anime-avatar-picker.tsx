/*
 * [anime] 头像选择器：点击头像弹出 8 张预设二次元头像
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ANIME_AVATAR_COUNT,
  getAnimeAvatarIndex,
  setAnimeAvatarIndex,
} from '@/lib/avatar'

/** 头像变化后触发重渲染 */
export function useAnimeAvatarVersion() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const f = () => setV((x) => x + 1)
    window.addEventListener('anime-avatar-changed', f)
    return () => window.removeEventListener('anime-avatar-changed', f)
  }, [])
  return v
}

export function AnimeAvatarPicker({ name, size = 64 }: { name: string; size?: number }) {
  const { t } = useTranslation()
  useAnimeAvatarVersion()
  const [open, setOpen] = useState(false)
  const cur = getAnimeAvatarIndex(name)
  return (
    <div className='aap'>
      <button
        type='button'
        className='aap-current'
        style={{ width: size, height: size }}
        onClick={() => setOpen(!open)}
        title={t('anime.avatar.change')}
      >
        <img src={`/anime/avatars/av${cur}.webp`} alt='' />
        <span className='aap-edit'>✎</span>
      </button>
      {open && (
        <div className='aap-pop'>
          <div className='aap-pop-title'>{t('anime.avatar.pick')}</div>
          <div className='aap-grid'>
            {Array.from({ length: ANIME_AVATAR_COUNT }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                type='button'
                className='aap-opt'
                data-on={i === cur ? '1' : '0'}
                onClick={() => {
                  setAnimeAvatarIndex(name, i)
                  setOpen(false)
                }}
              >
                <img src={`/anime/avatars/av${i}.webp`} alt='' loading='lazy' />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
