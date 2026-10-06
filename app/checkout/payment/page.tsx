'use client'

import { useEffect,useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/components/cart/cart-context'

export default function CashfreePaymentPage(){
  const [state,setState]=useState<'loading'|'paid'|'pending'|'failed'>('loading')
  const [orderId,setOrderId]=useState<number|null>(null)
  const { clearCart } = useCart()

  useEffect(()=>{
    const cfId=new URLSearchParams(window.location.search).get('order_id')
    if(!cfId){setState('failed');return}
    let attempts=0
    let timer:ReturnType<typeof setTimeout>|null=null
    const verify=async()=>{
      attempts++
      try{
        const r=await fetch('/api/cashfree/verify?order_id='+encodeURIComponent(cfId),{cache:'no-store'})
        const data=await r.json()
        if(data?.status==='paid'){clearCart();setOrderId(Number(data.order_id));setState('paid');return}
        if(data?.status==='failed'){setState('failed');return}
      }catch{}
      // Cashfree may take a few seconds to publish the transaction result
      // after the customer exits checkout. Keep checking before showing pending.
      if(attempts<15) timer=setTimeout(verify,2000)
      else setState('pending')
    }
    verify()
    return()=>{if(timer)clearTimeout(timer)}
  },[])

  return <div className="min-h-screen bg-background">
    <SiteHeader/>
    <main className="mx-auto flex max-w-2xl justify-center px-4 py-12 sm:px-5 md:py-20">
      <section className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
        {state==='loading'&&<><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAYMENT</p><h1 className="mt-2 font-serif text-3xl font-bold text-primary">Verifying your payment…</h1><p className="mt-3 text-sm text-muted-foreground">Please wait while we confirm your payment securely.</p></>}
        {state==='paid'&&<><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-primary">✓</div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAYMENT SUCCESSFUL</p><h1 className="mt-2 font-serif text-3xl font-bold text-primary">Order confirmed</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your payment was verified and your Tenoo order has been confirmed.</p>{orderId&&<p className="mt-3 text-sm font-semibold text-primary">Order #{orderId}</p>}<Link href="/products" className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground">Continue Shopping</Link></>}
        {state==='pending'&&<><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAYMENT</p><h1 className="mt-2 font-serif text-3xl font-bold text-primary">Payment is being confirmed</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">We received your payment response, but confirmation is taking a little longer. Please do not pay again.</p><Link href="/" className="mt-7 inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold text-primary">Go to Home</Link></>}
        {state==='failed'&&<><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAYMENT</p><h1 className="mt-2 font-serif text-3xl font-bold text-primary">Payment was not completed</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">No paid order was created. You can return to your cart and try again.</p><Link href="/cart" className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground">Return to Cart</Link></>}
      </section>
    </main>
    <SiteFooter/>
  </div>
}
