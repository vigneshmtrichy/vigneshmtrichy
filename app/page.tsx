import { IntroAnimation } from '@/components/home/intro-animation'
import { FallingLeaves } from '@/components/home/falling-leaves'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ScrollReveal } from '@/components/scroll-reveal'
import { Hero } from '@/components/home/hero'
import { FeatureStrip } from '@/components/home/feature-strip'
import { Generations } from '@/components/home/generations'
import { FamilyBanner } from '@/components/home/family-banner'
import { Story } from '@/components/home/story'
import { CtaBanner } from '@/components/home/cta-banner'
import { TrustBar } from '@/components/home/trust-bar'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <IntroAnimation />
      <FallingLeaves />

      <div className="flex min-h-screen flex-col">
        <SiteHeader />

        <main>
          <ScrollReveal duration={700} distance={20}>
            <div className="mx-auto w-full max-w-7xl overflow-hidden">
              <Hero />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <FeatureStrip />
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <Generations />
          </ScrollReveal>

          <ScrollReveal duration={750} distance={28}>
            <FamilyBanner />
          </ScrollReveal>

          <ScrollReveal>
            <Story />
          </ScrollReveal>

          <ScrollReveal delay={50} distance={20}>
            <CtaBanner />
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <TrustBar />
          </ScrollReveal>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
