import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { FeatureStrip } from '@/components/home/feature-strip'
import { Generations } from '@/components/home/generations'
import { FamilyBanner } from '@/components/home/family-banner'
import { Story } from '@/components/home/story'
import { CtaBanner } from '@/components/home/cta-banner'
import { TrustBar } from '@/components/home/trust-bar'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main>
        <Hero />
        <FeatureStrip />
        <Generations />
        <FamilyBanner />
        <Story />
        <CtaBanner />
        <TrustBar />
      </main>
      <SiteFooter />
    </div>
  )
}
