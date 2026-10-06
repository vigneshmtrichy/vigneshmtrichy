'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'

type Row = { code:string; manufacturer:string; address:string[]; fssai:string }
const EMPTY={code:'',manufacturer:'',address:'',fssai:''}

export default function AdminManufacturersPage(){
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [rows,setRows]=useState<Row[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const [editing,setEditing]=useState<string|null>(null)
  const [form,setForm]=useState(EMPTY)

  const load=useCallback(async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const ok=user.email==='info@tenoo.in'
    setAuthorized(ok)
    if(!ok){setLoading(false);return}
    const {data,error}=await supabase.from('manufacturer_verification')
      .select('code, manufacturer, address, fssai').order('code')
    if(error){console.error(error);setMessage('Unable to load manufacturer settings.')}
    else setRows((data||[]).map((r:any)=>({code:String(r.code),manufacturer:String(r.manufacturer),address:Array.isArray(r.address)?r.address.map(String):[],fssai:String(r.fssai)})))
    setLoading(false)
  },[])

  useEffect(()=>{void load()},[load])

  const reset=()=>{setEditing(null);setForm(EMPTY);setMessage('')}
  const edit=(r:Row)=>{setEditing(r.code);setForm({code:r.code,manufacturer:r.manufacturer,address:r.address.join('\n'),fssai:r.fssai});setMessage('');window.scrollTo({top:0,behavior:'smooth'})}

  const save=async()=>{
    const code=form.code.trim().toUpperCase().replace(/[^A-Z]/g,'')
    const manufacturer=form.manufacturer.trim()
    const address=form.address.split('\n').map(x=>x.trim()).filter(Boolean)
    const fssai=form.fssai.trim()
    if(code.length<2||code.length>3){setMessage('Batch code must be 2 or 3 letters.');return}
    if(!manufacturer||!address.length||!fssai){setMessage('Please fill all manufacturer details.');return}
    setSaving(true);setMessage('')
    try{
      if(editing&&editing!==code){
        const {error}=await supabase.from('manufacturer_verification').delete().eq('code',editing)
        if(error)throw error
      }
      const {error}=await supabase.from('manufacturer_verification').upsert({code,manufacturer,address,fssai,updated_at:new Date().toISOString()})
      if(error)throw error
      setMessage(editing?'Manufacturer code updated.':'Manufacturer code added.')
      reset();await load()
    }catch(error){console.error(error);setMessage('Unable to save manufacturer code.')}
    finally{setSaving(false)}
  }

  const remove=async(code:string)=>{
    if(!window.confirm('Delete batch code "'+code+'"?'))return
    const {error}=await supabase.from('manufacturer_verification').delete().eq('code',code)
    if(error){console.error(error);setMessage('Unable to delete this code.');return}
    setMessage('Batch code "'+code+'" deleted.')
    await load()
  }

  if(authorized===null||loading)return <><SiteHeader/><main className="min-h-screen p-10 text-sm text-muted-foreground">Loading…</main></>
  if(!authorized)return <><SiteHeader/><main className="min-h-screen p-10 text-center"><h1 className="text-2xl font-semibold">Admin access only</h1><Link href="/" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Back to store</Link></main></>

  return <>
    <SiteHeader/>
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">SETTINGS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Manufacturer Verification</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage batch-code prefixes and manufacturing details.</p>
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/>Add Code</button>
        </div>

        {message&&<div className="mt-5 rounded-xl border bg-background px-4 py-3 text-sm">{message}</div>}

        <section className="mt-6 rounded-2xl border bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editing?'Edit Batch Code':'Add Batch Code'}</h2><p className="mt-1 text-xs text-muted-foreground">Multiple codes can point to the same manufacturer.</p></div>{editing&&<button onClick={reset} className="text-sm font-semibold text-muted-foreground">Cancel</button>}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Batch Code<input value={form.code} disabled={!!editing} maxLength={3} onChange={e=>setForm(x=>({...x,code:e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3)}))} placeholder="VMK" className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"/></label>
            <label className="text-sm font-medium">Manufacturer Name<input value={form.manufacturer} onChange={e=>setForm(x=>({...x,manufacturer:e.target.value}))} placeholder="Veetoon Health Foods" className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"/></label>
            <label className="text-sm font-medium md:col-span-2">Address<textarea rows={4} value={form.address} onChange={e=>setForm(x=>({...x,address:e.target.value}))} placeholder={'Line 1\nLine 2\nTamil Nadu, India'} className="mt-2 w-full rounded-xl border bg-background px-3 py-3 outline-none focus:border-primary"/></label>
            <label className="text-sm font-medium">FSSAI Licence No.<input value={form.fssai} onChange={e=>setForm(x=>({...x,fssai:e.target.value}))} placeholder="12423027001124" className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"/></label>
          </div>
          <button type="button" onClick={()=>void save()} disabled={saving} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving?'Saving…':editing?'Save Changes':'Add Code'}</button>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="border-b px-5 py-4"><h2 className="font-semibold">Current Codes</h2></div>
          <div className="divide-y">
            {rows.map(row=><div key={row.code} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{row.code}</span><span className="font-semibold">{row.manufacturer}</span></div><p className="mt-1 text-sm text-muted-foreground">{row.address.join(' • ')}</p><p className="mt-1 text-xs text-muted-foreground">FSSAI: {row.fssai}</p></div>
              <div className="flex shrink-0 gap-2"><button onClick={()=>edit(row)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"><Pencil className="h-3.5 w-3.5"/>Edit</button><button onClick={()=>void remove(row.code)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5"/>Delete</button></div>
            </div>)}
            {!rows.length&&<p className="px-5 py-8 text-center text-sm text-muted-foreground">No manufacturer codes configured.</p>}
          </div>
        </section>
      </div>
    </main>
  </>
}
