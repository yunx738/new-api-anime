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
import type { CSSProperties } from 'react'

export type UserAvatarStyle = Pick<
  CSSProperties,
  'backgroundColor' | 'color' | 'backgroundImage' | 'backgroundSize' | 'backgroundPosition'
>

/** [anime] 二次元头像：8 张预设，按用户名散列分配；可在个人资料页手动指定 */
export const ANIME_AVATAR_COUNT = 8
const AVATAR_KEY = 'anime_avatar:'
export function getAnimeAvatarIndex(name: string): number {
  try {
    const v = Number(window.localStorage.getItem(AVATAR_KEY + name))
    if (v >= 1 && v <= ANIME_AVATAR_COUNT) return v
  } catch {
    /* empty */
  }
  return (hashString(name || '?') % ANIME_AVATAR_COUNT) + 1
}
export function setAnimeAvatarIndex(name: string, idx: number) {
  try {
    window.localStorage.setItem(AVATAR_KEY + name, String(idx))
    window.dispatchEvent(new Event('anime-avatar-changed'))
  } catch {
    /* empty */
  }
}
export function getUserAvatarUrl(name: string): string {
  return `/anime/avatars/av${getAnimeAvatarIndex(name)}.webp`
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getUserAvatarStyle(name: string): UserAvatarStyle {
  const hash = hashString(name)
  const hue = hash % 360
  const saturation = 54 + (hash % 8)
  const lightness = 52 + ((hash >> 4) % 8)

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: 'transparent',
    backgroundImage: `url('${getUserAvatarUrl(name)}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

export function getUserAvatarFallback(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
