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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main>
        {/* Hero */}
        <ScrollReveal duration={700} distance={20}>
          <Hero />
        </ScrollReveal>

        {/* Brand Features */}
        <ScrollReveal delay={50}>
          <FeatureStrip />
        </ScrollReveal>

        {/* Products for Every Generation */}
        <ScrollReveal delay={50}>
          <Generations />
        </ScrollReveal>

        {/* Family Banner */}
        <ScrollReveal duration={750} distance={28}>
          <FamilyBanner />
        </ScrollReveal>

        {/* Our Story */}
        <ScrollReveal>
          <Story />
        </ScrollReveal>

        {/* WhatsApp CTA */}
        <ScrollReveal delay={50} distance={20}>
          <CtaBanner />
        </ScrollReveal>

        {/* Trust / Closing Section */}
        <ScrollReveal delay={50}>
          <TrustBar />
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  )
}