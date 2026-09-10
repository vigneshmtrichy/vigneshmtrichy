"use client"
import type { Metadata } from "next"
import { useState } from "react"
import {
  Mail,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const whatsappMessage = `Hi TENOO,

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}`

    const whatsappUrl = `https://wa.me/919585808590?text=${encodeURIComponent(
      whatsappMessage
    )}`

    window.open(whatsappUrl, "_blank")
  }

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <ScrollReveal>
          <section className="px-5 pb-10 pt-10 md:px-10 md:pb-14 md:pt-14">
            <div className="mx-auto max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Contact TENOO
              </p>

              <h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[0.95] text-primary md:text-6xl lg:text-7xl">
                Let&apos;s talk.
                <br />
                <span className="text-accent">We&apos;re here to help.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Have a question about our products, an order, or a business
                enquiry? Reach out to us. We&apos;d love to hear from you.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* Contact Options */}
        <ScrollReveal delay={80}>
          <section className="bg-muted/40 px-5 py-8 md:px-10 md:py-10">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-5 md:grid-cols-2">

                {/* WhatsApp */}
                <a
                  href="https://wa.me/919585808590"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl bg-primary p-7 text-primary-foreground transition-transform hover:-translate-y-1 md:p-8"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <MessageCircle className="h-6 w-6" />
                    </div>

                    <ArrowUpRight className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    WhatsApp
                  </p>

                  <h2 className="mt-2 font-serif text-3xl font-bold">
                    Chat with us
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
                    For product questions, orders and quick enquiries.
                  </p>

                  <p className="mt-5 font-medium">
                    +91 95858 08590
                  </p>
                </a>

                {/* Email */}
                <a
                  href="mailto:info@tenoo.in"
                  className="group rounded-2xl bg-white p-7 transition-transform hover:-translate-y-1 md:p-8"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <Mail className="h-6 w-6" />
                    </div>

                    <ArrowUpRight className="h-5 w-5 text-primary/40 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Email
                  </p>

                  <h2 className="mt-2 font-serif text-3xl font-bold text-primary">
                    Write to us
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    For general enquiries, feedback and business conversations.
                  </p>

                  <p className="mt-5 font-medium text-primary">
                    info@tenoo.in
                  </p>
                </a>

              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Enquiry Form */}
        <ScrollReveal delay={100}>
          <section className="px-5 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                    Send an Enquiry
                  </p>

                  <h2 className="mt-3 font-serif text-4xl font-bold leading-tight text-primary md:text-5xl">
                    Have a question?
                    <br />
                    Let&apos;s talk.
                  </h2>

                  <p className="mt-5 text-base leading-7 text-muted-foreground">
                    Fill in your details and message. We&apos;ll help you with
                    your enquiry through WhatsApp.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border bg-white p-6 md:p-8"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Name
                      </label>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type="text"
                        placeholder="Your name"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-primary">
                        Phone
                      </label>
                      <input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        placeholder="Your phone number"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-primary">
                      Email
                    </label>
                    <input
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-primary">
                      Message
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="How can we help you?"
                      className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Send Enquiry on WhatsApp
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>

              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Business / Bulk Orders */}
        <ScrollReveal delay={80}>
          <section className="bg-muted/40 px-5 py-8 md:px-10 md:py-10">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground md:px-10 md:py-12">
                <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                      Business Enquiries
                    </p>

                    <h2 className="mt-3 max-w-2xl font-serif text-3xl font-bold md:text-4xl">
                      Looking for bulk orders or business partnerships?
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/70 md:text-base">
                      For bulk purchases, retail enquiries, distribution or
                      business opportunities, get in touch with our team.
                    </p>
                  </div>

                  <a
                    href="https://wa.me/919585808590?text=Hi%20TENOO%2C%20I%27m%20interested%20in%20a%20business%20or%20bulk%20order%20enquiry."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
                  >
                    Business Enquiry
                    <ArrowUpRight className="h-4 w-4" />
                  </a>

                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Social */}
        <ScrollReveal delay={80}>
          <section className="px-5 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-5xl">

              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  Stay Connected
                </p>

                <h2 className="mt-3 font-serif text-4xl font-bold text-primary md:text-5xl">
                  Follow TENOO
                </h2>

                <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
                  Follow us for product updates, everyday food ideas and what&apos;s
                  happening at TENOO.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">

                {/* Instagram */}
                <ScrollReveal delay={0}>
                  <a
                    href="https://www.instagram.com/tenoo.ventures/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-5 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-9 w-9"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id="instagramGradient"
                            x1="0%"
                            y1="100%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#FFD600" />
                            <stop offset="45%" stopColor="#FF0069" />
                            <stop offset="100%" stopColor="#7638FA" />
                          </linearGradient>
                        </defs>
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="6"
                          fill="url(#instagramGradient)"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="4.2"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.8"
                        />
                        <circle cx="17.5" cy="6.7" r="1.2" fill="white" />
                      </svg>

                      <span className="text-base font-medium text-primary">
                        Instagram
                      </span>
                    </div>

                    <span className="text-xl text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                      ↗
                    </span>
                  </a>
                </ScrollReveal>

                {/* Facebook */}
                <ScrollReveal delay={120}>
                  <a
                    href="https://www.facebook.com/profile.php?id=61594267881063"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-5 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-9 w-9"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" fill="#1877F2" />
                        <path
                          d="M13.5 20v-7h2.4l.4-2.7h-2.8V8.6c0-.8.2-1.4 1.4-1.4h1.5V4.8c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H8.5V13h2.3v7h2.7Z"
                          fill="white"
                        />
                      </svg>

                      <span className="text-base font-medium text-primary">
                        Facebook
                      </span>
                    </div>

                    <span className="text-xl text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                      ↗
                    </span>
                  </a>
                </ScrollReveal>

                {/* YouTube */}
                <ScrollReveal delay={240}>
                  <a
                    href="https://www.youtube.com/@Tenoo.ventures"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-5 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-9 w-9"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="5"
                          width="20"
                          height="14"
                          rx="4"
                          fill="#FF0000"
                        />
                        <path
                          d="M10 8.5 16 12l-6 3.5v-7Z"
                          fill="white"
                        />
                      </svg>

                      <span className="text-base font-medium text-primary">
                        YouTube
                      </span>
                    </div>

                    <span className="text-xl text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                      ↗
                    </span>
                  </a>
                </ScrollReveal>

              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Closing CTA */}
        <ScrollReveal delay={100}>
          <section className="px-5 pb-8 md:px-10 md:pb-12">
            <div className="mx-auto max-w-5xl rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground md:px-10 md:py-14">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                We&apos;re Listening
              </p>

              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-bold md:text-4xl">
                Have a question? Let&apos;s talk.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70 md:text-base">
                Whether you&apos;re discovering TENOO for the first time or already
                part of our journey, feel free to reach out.
              </p>

              <a
                href="https://wa.me/919585808590"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
              >
                Chat on WhatsApp
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </>
  )
}