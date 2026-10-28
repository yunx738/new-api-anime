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
// [anime] 精简钱包：移除在线支付/订阅/邀请返利，仅保留余额统计、兑换码与账单记录
import { useState, useEffect, useCallback } from 'react'
import { Gift, History, Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TitledCard } from '@/components/ui/titled-card'
import { getSelf } from '@/lib/api'
import { BillingHistoryDialog } from './components/dialogs/billing-history-dialog'
import { WalletStatsCard } from './components/wallet-stats-card'
import { useRedemption } from './hooks'
import type { UserWalletData } from './types'

interface WalletProps {
  initialShowHistory?: boolean
}

export function Wallet(props: WalletProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState('')
  const { redeeming, redeemCode } = useRedemption()

  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (props.initialShowHistory) {
      setBillingDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [props.initialShowHistory])

  const handleRedeem = async () => {
    if (!redemptionCode) return
    const success = await redeemCode(redemptionCode)
    if (success) {
      setRedemptionCode('')
      await fetchUser()
    }
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Wallet')}</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='anime-wallet mx-auto flex w-full max-w-4xl flex-col gap-5'>
            <WalletStatsCard user={user} loading={userLoading} />

            <div className='grid gap-5 md:grid-cols-2'>
              <TitledCard
                title={t('Have a Code?')}
                description={t('Enter your redemption code')}
                icon={<Gift />}
                iconTone='warning'
              >
                <div className='flex flex-col gap-3'>
                  <Input
                    id='redemption-code'
                    value={redemptionCode}
                    onChange={(e) => setRedemptionCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRedeem()
                    }}
                    placeholder={t('Enter your redemption code')}
                    className='h-11'
                  />
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming || !redemptionCode}
                    className='h-11 w-full'
                  >
                    {redeeming ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Sparkles className='mr-2 h-4 w-4' />
                    )}
                    {t('Redeem')}
                  </Button>
                </div>
              </TitledCard>

              <TitledCard
                title={t('Billing History')}
                description={t('View your recent quota changes')}
                icon={<History />}
                iconTone='info'
              >
                <Button
                  variant='outline'
                  className='h-11 w-full'
                  onClick={() => setBillingDialogOpen(true)}
                >
                  <History className='mr-2 h-4 w-4' />
                  {t('Billing History')}
                </Button>
              </TitledCard>
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <BillingHistoryDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />
    </>
  )
}
