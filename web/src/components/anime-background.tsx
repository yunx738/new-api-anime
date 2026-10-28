/*
 * [anime] 自定义背景图：全局展示 + 主题抽屉中的上传面板（仅超级管理员）
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/api'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const EVENT = 'anime-bg-changed'
const DIM_KEY = 'anime_bg_veil'

type BgMeta = { exists: boolean; url?: string; version?: number }

async function fetchMeta(): Promise<BgMeta> {
  try {
    const res = await fetch('/api/anime/background/meta', { cache: 'no-store' })
    const json = await res.json()
    return (json?.data as BgMeta) ?? { exists: false }
  } catch {
    return { exists: false }
  }
}

function readVeil(): number {
  const v = Number(localStorage.getItem(DIM_KEY))
  return Number.isFinite(v) && v >= 0 && v <= 90 ? v : 45
}

function applyVeil(v: number) {
  document.documentElement.style.setProperty('--anime-bg-veil', `${v}%`)
}

/** 挂在根布局：有背景图时铺满整个视口 */
export function AnimeBackgroundLayer() {
  const [url, setUrl] = useState<string | null>(null)
  const load = useCallback(async () => {
    const meta = await fetchMeta()
    setUrl(meta.exists && meta.url ? meta.url : null)
  }, [])
  useEffect(() => {
    applyVeil(readVeil())
    document.documentElement.style.setProperty('--anime-chibi-sleep', "url('/anime/chibi-sleep.webp')")
    load()
    window.addEventListener(EVENT, load)
    return () => window.removeEventListener(EVENT, load)
  }, [load])
  useEffect(() => {
    if (url) document.body.setAttribute('data-anime-bg', 'on')
    else document.body.removeAttribute('data-anime-bg')
  }, [url])
  if (!url) return null
  return (
    <div
      aria-hidden='true'
      className='anime-bg-layer'
      style={{ backgroundImage: `url("${url}")` }}
    />
  )
}

/** 主题抽屉中的背景图设置 */
export function AnimeBackgroundConfig() {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.auth.user?.role ?? 0)
  const isRoot = role >= ROLE.SUPER_ADMIN
  const [meta, setMeta] = useState<BgMeta>({ exists: false })
  const [busy, setBusy] = useState(false)
  const [veil, setVeil] = useState(readVeil)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMeta().then(setMeta)
  }, [])

  const upload = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t('Image must be smaller than 15MB'))
      return
    }
    const form = new FormData()
    form.append('file', file)
    setBusy(true)
    try {
      const res = await api.post('/api/anime/background', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.success) {
        setMeta(res.data.data)
        window.dispatchEvent(new Event(EVENT))
        toast.success(t('Background updated'))
      } else {
        toast.error(res.data?.message || t('Upload failed'))
      }
    } catch {
      toast.error(t('Upload failed'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete('/api/anime/background')
      setMeta({ exists: false })
      window.dispatchEvent(new Event(EVENT))
      toast.success(t('Background removed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className='text-muted-foreground mb-2 text-sm font-semibold'>
        {t('Background Image')}
      </div>
      <div className='anime-bg-preview relative mb-3 h-24 overflow-hidden rounded-2xl border'>
        {meta.exists && meta.url ? (
          <img
            src={meta.url}
            alt=''
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='text-muted-foreground flex h-full items-center justify-center text-xs'>
            {t('No background image')} ✿
          </div>
        )}
      </div>
      {isRoot ? (
        <div className='grid grid-cols-2 gap-2'>
          <input
            ref={inputRef}
            type='file'
            accept='image/png,image/jpeg,image/webp,image/gif,image/avif'
            className='hidden'
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
            }}
          />
          <Button
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className='mr-1 size-4 animate-spin' />
            ) : (
              <ImagePlus className='mr-1 size-4' />
            )}
            {t('Upload')}
          </Button>
          <Button
            variant='outline'
            disabled={busy || !meta.exists}
            onClick={remove}
          >
            <Trash2 className='mr-1 size-4' />
            {t('Remove')}
          </Button>
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>
          {t('Only the site owner can change the background image')}
        </p>
      )}
      <div className='mt-4'>
        <div className='text-muted-foreground mb-2 flex justify-between text-xs'>
          <span>{t('Background veil')}</span>
          <span>{veil}%</span>
        </div>
        <Slider
          min={0}
          max={90}
          step={5}
          value={[veil]}
          onValueChange={(v) => {
            const n = Array.isArray(v) ? Number(v[0]) : Number(v)
            setVeil(n)
            applyVeil(n)
            localStorage.setItem(DIM_KEY, String(n))
          }}
        />
      </div>
    </div>
  )
}
