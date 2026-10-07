'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { supabase } from '@/lib/supabase'

const BUCKET='business-bills', ADMIN='info@tenoo.in'
const categories=['Designing','Packaging','Raw Material','Courier','Software','Marketing','Other']
const itcStatuses=['Pending','Yes','No'], twoBStatuses=['Not checked','Matched','Not reflected','Mismatch']
const paymentStatuses=['Paid','Pending'], paymentModes=['UPI','Bank transfer','Cash','Card','Cheque','Other']
const money=(n:number)=>`₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const qOptions=()=>{const y=new Date().getFullYear(),a:{label:string;start:string;end:string}[]=[];for(let i=y-2;i<=y+1;i++){a.push({label:`Q1 FY ${i}-${String(i+1).slice(-2)}`,start:`${i}-04-01`,end:`${i}-06-30`},{label:`Q2 FY ${i}-${String(i+1).slice(-2)}`,start:`${i}-07-01`,end:`${i}-09-30`},{label:`Q3 FY ${i}-${String(i+1).slice(-2)}`,start:`${i}-10-01`,end:`${i}-12-31`},{label:`Q4 FY ${i}-${String(i+1).slice(-2)}`,start:`${i+1}-01-01`,end:`${i+1}-03-31`})}return a.reverse()}
const currentQ=()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;if(m>=4&&m<=6)return`${y}-04-01|${y}-06-30`;if(m>=7&&m<=9)return`${y}-07-01|${y}-09-30`;if(m>=10)return`${y}-10-01|${y}-12-31`;return`${y}-01-01|${y}-03-31`}
type Bill={id:number;invoice_number:string|null;invoice_date:string;supplier_name:string;supplier_gstin:string|null;category:string;taxable_amount:number;cgst:number;sgst:number;igst:number;total_amount:number;itc_status:string;gstr2b_status:string;payment_status:string;payment_date:string|null;payment_mode:string|null;invoice_file_path:string|null;invoice_file_name:string|null;notes:string|null}
type Form={invoice_number:string;invoice_date:string;supplier_name:string;supplier_gstin:string;category:string;taxable_amount:string;cgst:string;sgst:string;igst:string;itc_status:string;gstr2b_status:string;payment_status:string;payment_date:string;payment_mode:string;notes:string}
const fresh=():Form=>({invoice_number:'',invoice_date:new Date().toISOString().slice(0,10),supplier_name:'',supplier_gstin:'',category:'Other',taxable_amount:'',cgst:'',sgst:'',igst:'',itc_status:'Pending',gstr2b_status:'Not checked',payment_status:'Paid',payment_date:new Date().toISOString().slice(0,10),payment_mode:'UPI',notes:''})
const parseMoney=(value:string)=>{
  const cleaned=value.replace(/[^0-9.,-]/g,'').replace(/,(?=\d{3}(?:[.,]|$))/g,'').replace(/\.(?=\d{3}(?:[.,]|$))/g,'')
  const n=Number(cleaned.replace(/,/g,''))
  return Number.isFinite(n)?n:null
}
const parseInvoiceText=(text:string)=>{
  const normalized=text.replace(/[\u00a0\u2007\u202f]/g,' ').replace(/[￾]/g,' ')
  const lines=normalized.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean)
  const joined=lines.join('\n')
  const flat=lines.join(' | ')
  const pick=(re:RegExp)=>{const m=joined.match(re);return m?.[1]?.trim()||''}

  const gstin=(joined.replace(/\s+/g,'').match(/\b\d{2}[A-Z0-9]{5}\d{4}[A-Z0-9][A-Z0-9]\dZ[A-Z0-9]\b/i)?.[0]||'').toUpperCase()

  const parseDateValue=(value:string)=>{
    const s=value.replace(/,/g,' ').replace(/\s+/g,' ').trim()
    let m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)
    if(m)return `${m[3].length===2?'20'+m[3]:m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    m=s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/)
    if(m){const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],month=months.indexOf(m[2].slice(0,3).toLowerCase());if(month>=0)return `${m[3]}-${String(month+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`}
    return ''
  }

  const invoiceNumber=
    pick(/invoice\s*no\.?\s*#?\s*[:\-]?\s*([A-Z0-9][A-Z0-9./_-]{2,})/i) ||
    pick(/invoice\s*(?:number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9./_-]{2,})/i) ||
    pick(/order\s*id\s*#?\s*([A-Z0-9][A-Z0-9./_-]{2,})/i)

  let invoiceDate=''
  const explicitDate=pick(/(?:invoice\s*date|date\s*of\s*invoice|invoice\s*dt)\s*[:\-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s*,?\s+\d{4})/i)
  if(explicitDate)invoiceDate=parseDateValue(explicitDate)
  if(!invoiceDate){
    const dateHeaderIndex=lines.findIndex(x=>/date\s+print\s+date\s+ship\s+date\s+delivery\s+date/i.test(x))
    if(dateHeaderIndex>=0){
      const candidate=(lines[dateHeaderIndex+1]||'').match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s*,?\s+\d{4}\b|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/)
      if(candidate)invoiceDate=parseDateValue(candidate[0])
    }
  }
  if(!invoiceDate){
    const candidate=joined.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+(20\d{2})\b/i)
    if(candidate)invoiceDate=parseDateValue(candidate[0])
  }

  const moneyValues=(value:string)=>{
    const matches=value.match(/(?:₹|Rs\.?|INR)\s*[0-9][0-9,]*(?:\.\d{1,2})?|\b[0-9][0-9,]*\.\d{2}\b/g)||[]
    return matches.map(parseMoney).filter((n):n is number=>n!==null)
  }
  const findLineAfter=(label:RegExp)=>{
    for(let i=0;i<lines.length;i++){
      if(!label.test(lines[i]))continue
      const same=moneyValues(lines[i]).filter(n=>n>0)
      if(same.length)return same[same.length-1]
      for(let j=i+1;j<Math.min(i+4,lines.length);j++){
        const values=moneyValues(lines[j]).filter(n=>n>0)
        if(values.length)return values[values.length-1]
      }
    }
    return null
  }

  let taxable=findLineAfter(/(?:taxable\s*(?:value|amount)|taxable)/i)
  let cgst=findLineAfter(/(?:CGST|central\s*GST)/i)
  let sgst=findLineAfter(/(?:SGST|state\s*GST)/i)
  let igst=findLineAfter(/(?:IGST|integrated\s*GST)/i)

  // Many invoice OCR layouts put the GST rate on one line and the tax amounts
  // on the next line. Never treat a percentage such as "9 (%)" as the tax amount.
  if(cgst===9 || cgst===18 || cgst===5)cgst=null
  if(sgst===9 || sgst===18 || sgst===5)sgst=null
  if(igst===9 || igst===18 || igst===5)igst=null

  const finalPrice=findLineAfter(/(?:final\s*price|grand\s*total|amount\s*payable|net\s*amount)/i)
  let invoiceTotal=finalPrice!==null?String(finalPrice):''
  if(!invoiceTotal){
    const totalLineIndex=lines.findIndex(x=>/^total\s*:/i.test(x))
    if(totalLineIndex>=0){
      const values=moneyValues(lines[totalLineIndex])
      if(values.length)taxable=values[values.length-1]
    }
  }

  // Product table fallback: e.g. "... Quantity Rate Total / 6 ₹350.00 ₹2,100.00".
  // Use the last monetary value from a row containing quantity + rate + total.
  if(taxable===null){
    for(const line of lines){
      const values=moneyValues(line)
      if(values.length>=2 && /\b\d+\b/.test(line) && values[values.length-1]>values[0]){
        taxable=values[values.length-1]
        break
      }
    }
  }

  // If the invoice exposes GST percentages but OCR separated the tax amounts,
  // calculate the tax from the detected taxable value. This is safer than using
  // the percentage number itself as a currency amount.
  if(taxable!==null){
    const cgstRateMatch=joined.match(/(?:CGST|central\s*GST)[^\n]{0,30}?(\d+(?:\.\d+)?)\s*\(?\s*%/i)
    const sgstRateMatch=joined.match(/(?:SGST|state\s*GST)[^\n]{0,30}?(\d+(?:\.\d+)?)\s*\(?\s*%/i)
    const igstRateMatch=joined.match(/(?:IGST|integrated\s*GST)[^\n]{0,30}?(\d+(?:\.\d+)?)\s*\(?\s*%/i)
    if(cgst===null && cgstRateMatch)cgst=Math.round(taxable*Number(cgstRateMatch[1]))/100
    if(sgst===null && sgstRateMatch)sgst=Math.round(taxable*Number(sgstRateMatch[1]))/100
    if(igst===null && igstRateMatch)igst=Math.round(taxable*Number(igstRateMatch[1]))/100
  }

  // On invoices with a final price but no explicit taxable label, the total
  // before coupon/shipping is usually the taxable line in the cart section.
  if(taxable===null){
    const totalIndex=lines.findIndex(x=>/^total\s*:/i.test(x))
    if(totalIndex>=0){
      const values=moneyValues(lines[totalIndex])
      if(values.length)taxable=values[values.length-1]
    }
  }

  if(!invoiceTotal && taxable!==null){
    const calculated=taxable+(cgst||0)+(sgst||0)+(igst||0)
    if(calculated>0)invoiceTotal=String(calculated)
  }

  const supplierCandidates=lines.slice(0,Math.min(lines.length,20)).filter(x=>
    /\b(private|pvt|ltd|limited|llp|industries|enterprises|traders|company)\b/i.test(x) &&
    !/(invoice|total|gst|date|phone|email|address|customer|shipping|billing)/i.test(x)
  )
  const supplier=supplierCandidates[0] ||
    pick(/(?:supplier|vendor|seller|billed\s*by|from)\s*[:\-]?\s*([^\n]{2,80})/i) ||
    ''
  
  return {
    supplier_name:supplier.replace(/^(name|company)\s*[:\-]?\s*/i,''),
    supplier_gstin:gstin,
    invoice_number:invoiceNumber,
    invoice_date:invoiceDate,
    taxable_amount:taxable!==null?String(taxable):'',
    cgst:cgst!==null?String(cgst):'',
    sgst:sgst!==null?String(sgst):'',
    igst:igst!==null?String(igst):'',
    invoice_total:invoiceTotal
  }
}

export default function BusinessExpensesPage(){
 const [auth,setAuth]=useState<boolean|null>(null),[bills,setBills]=useState<Bill[]>([]),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const [quarter,setQuarter]=useState(currentQ()),[search,setSearch]=useState(''),[category,setCategory]=useState('all'),[itc,setItc]=useState('all'),[twoB,setTwoB]=useState('all')
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<Bill|null>(null),[form,setForm]=useState<Form>(fresh()),[file,setFile]=useState<File|null>(null),[ocrBusy,setOcrBusy]=useState(false),[ocrNote,setOcrNote]=useState(''),[ocrInvoiceTotal,setOcrInvoiceTotal]=useState<number|null>(null)
 const [start,end]=quarter.split('|')
 const load=async(manual=false)=>{if(manual)setRefresh(true);const {data:{user}}=await supabase.auth.getUser();if(!user){location.href='/login';return}if(user.email!==ADMIN){setAuth(false);setLoading(false);return}setAuth(true);const {data,error:e}=await supabase.from('business_expenses').select('*').gte('invoice_date',start).lte('invoice_date',end).order('invoice_date',{ascending:false}).order('id',{ascending:false});if(e)setError(e.message);else setBills((data||[]) as Bill[]);setLoading(false);setRefresh(false)}
 useEffect(()=>{void load()},[quarter])
 const visible=useMemo(()=>{const q=search.trim().toLowerCase();return bills.filter(b=>(!q||[b.invoice_number,b.supplier_name,b.supplier_gstin,b.category].filter(Boolean).join(' ').toLowerCase().includes(q))&&(category==='all'||b.category===category)&&(itc==='all'||b.itc_status===itc)&&(twoB==='all'||b.gstr2b_status===twoB))},[bills,search,category,itc,twoB])
 const totals=useMemo(()=>visible.reduce((a,b)=>{a.tax+=+b.taxable_amount||0;a.cgst+=+b.cgst||0;a.sgst+=+b.sgst||0;a.igst+=+b.igst||0;a.total+=+b.total_amount||0;if(b.itc_status==='Yes')a.itc+=(+b.cgst||0)+(+b.sgst||0)+(+b.igst||0);if(b.gstr2b_status==='Not checked')a.pending++;return a},{tax:0,cgst:0,sgst:0,igst:0,total:0,itc:0,pending:0}),[visible])
 const set=(k:keyof Form,v:string)=>setForm(x=>({...x,[k]:v}))
 const gst=(+form.cgst||0) + (+form.sgst||0) + (+form.igst||0), total=(+form.taxable_amount||0)+gst
 const create=()=>{setEditing(null);setForm(fresh());setFile(null);setOcrBusy(false);setOcrNote('');setOcrInvoiceTotal(null);setError('');setOpen(true)}
 const edit=(b:Bill)=>{setEditing(b);setFile(null);setOcrBusy(false);setOcrNote('');setOcrInvoiceTotal(null);setForm({invoice_number:b.invoice_number||'',invoice_date:b.invoice_date,supplier_name:b.supplier_name,supplier_gstin:b.supplier_gstin||'',category:b.category,taxable_amount:String(b.taxable_amount||''),cgst:String(b.cgst||''),sgst:String(b.sgst||''),igst:String(b.igst||''),itc_status:b.itc_status,gstr2b_status:b.gstr2b_status,payment_status:b.payment_status,payment_date:b.payment_date||'',payment_mode:b.payment_mode||'UPI',notes:b.notes||''});setError('');setOpen(true)}
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form.supplier_name.trim()){setError('Supplier name is required.');return}setSaving(true);setError('');try{let path=editing?.invoice_file_path||null,name=editing?.invoice_file_name||null;if(file){if(file.size>10485760)throw Error('Bill file must be 10 MB or smaller.');if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Only PDF, JPG, PNG or WEBP files are allowed.');const ext=file.name.split('.').pop()||'bin';path=`${form.invoice_date.slice(0,7)}/${Date.now()}-${form.supplier_name.replace(/[^a-zA-Z0-9]+/g,'-').slice(0,40)}.${ext}`;const {error:e}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type});if(e)throw e;name=file.name}const payload={invoice_number:form.invoice_number.trim()||null,invoice_date:form.invoice_date,supplier_name:form.supplier_name.trim(),supplier_gstin:form.supplier_gstin.trim().toUpperCase()||null,category:form.category,taxable_amount:+form.taxable_amount||0,cgst:+form.cgst||0,sgst:+form.sgst||0,igst:+form.igst||0,total_amount:total,itc_status:form.itc_status,gstr2b_status:form.gstr2b_status,payment_status:form.payment_status,payment_date:form.payment_status==='Paid'?form.payment_date||null:null,payment_mode:form.payment_status==='Paid'?form.payment_mode:null,invoice_file_path:path,invoice_file_name:name,notes:form.notes.trim()||null};const r=editing?await supabase.from('business_expenses').update(payload).eq('id',editing.id):await supabase.from('business_expenses').insert(payload);if(r.error)throw r.error;setOpen(false);setMessage(editing?'Business bill updated.':'Business bill saved.');await load();setTimeout(()=>setMessage(''),3000)}catch(e:any){setError(e.message||'Failed to save bill.')}finally{setSaving(false)}}
 const runInvoiceOcr=async(selected:File|null)=>{
  setFile(selected);setOcrNote('');setOcrInvoiceTotal(null);
  if(!selected)return;
  if(selected.size>1048576){setOcrNote('OCR skipped: files over 1 MB are saved normally, but automatic reading needs a smaller file. You can still fill the fields manually.');return}
  setOcrBusy(true);
  try{
    const fd=new FormData();fd.append('file',selected);fd.append('language','auto');fd.append('OCREngine','3');fd.append('isTable','true');fd.append('detectOrientation','true');fd.append('scale','true');
    const res=await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{apikey:'helloworld'},body:fd});
    const json=await res.json();
    const text=(json.ParsedResults||[]).map((x:{ParsedText?:string})=>x.ParsedText||'').join('\n');
    if(!text.trim())throw Error(json.ErrorMessage||'No readable text found in the invoice.');
    const parsed=parseInvoiceText(text);
    setForm(prev=>({...prev,supplier_name:parsed.supplier_name||prev.supplier_name,supplier_gstin:parsed.supplier_gstin||prev.supplier_gstin,invoice_number:parsed.invoice_number||prev.invoice_number,invoice_date:parsed.invoice_date||prev.invoice_date,taxable_amount:parsed.taxable_amount||prev.taxable_amount,cgst:parsed.cgst||prev.cgst,sgst:parsed.sgst||prev.sgst,igst:parsed.igst||prev.igst}));
    if(parsed.invoice_total)setOcrInvoiceTotal(Number(parsed.invoice_total));
    const count=[parsed.supplier_name,parsed.supplier_gstin,parsed.invoice_number,parsed.invoice_date,parsed.taxable_amount,parsed.cgst,parsed.sgst,parsed.igst,parsed.invoice_total].filter(Boolean).length;
    setOcrNote(count?'Auto-filled '+count+' invoice fields. Please verify them before saving.':'Invoice text found, but fields could not be identified. Please enter them manually.');
  }catch(e:any){setOcrNote(e.message||'Automatic invoice reading failed. You can continue with manual entry.')}
  finally{setOcrBusy(false)}
}
const openFile=async(b:Bill)=>{if(!b.invoice_file_path)return;const {data,error:e}=await supabase.storage.from(BUCKET).createSignedUrl(b.invoice_file_path,300);if(e||!data?.signedUrl){setError(e?.message||'Unable to open file.');return}window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 const remove=async(b:Bill)=>{if(!confirm(`Delete ${b.invoice_number||'this bill'}?`))return;if(b.invoice_file_path)await supabase.storage.from(BUCKET).remove([b.invoice_file_path]);const {error:e}=await supabase.from('business_expenses').delete().eq('id',b.id);if(e)setError(e.message);else{setBills(x=>x.filter(v=>v.id!==b.id));setMessage('Business bill deleted.');setTimeout(()=>setMessage(''),3000)}}
 if(auth===null||loading)return <><SiteHeader/><main className="p-10 text-center text-sm text-muted-foreground">Loading GST & expenses…</main></>
 if(!auth)return <><SiteHeader/><main className="p-10 text-center">Admin access only.</main></>
 return <><SiteHeader/><main className="min-h-screen bg-muted/20 px-4 py-7 sm:px-6"><div className="mx-auto max-w-7xl">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">GST / Tax</p><h1 className="mt-1 text-3xl font-semibold">Business Expenses & Purchase Bills</h1><p className="mt-1 text-sm text-muted-foreground">Track bills, GST, GSTR-2B and ITC together.</p></div><div className="flex gap-2"><button onClick={()=>void load(true)} className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold"><RefreshCw className={`h-4 w-4 ${refresh?'animate-spin':''}`}/>Refresh</button><button onClick={create} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/>Add Bill</button></div></div>
  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{[['Bills',visible.length],['Taxable',money(totals.tax)],['CGST',money(totals.cgst)],['SGST',money(totals.sgst)],['IGST',money(totals.igst)],['GST total',money(totals.cgst+totals.sgst+totals.igst)],['ITC marked Yes',money(totals.itc)]].map(([l,v])=><div key={String(l)} className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-lg font-bold">{v}</p></div>)}</div>
  <section className="mt-5 rounded-2xl border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-5">
   <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">GST quarter</span><select value={quarter} onChange={e=>setQuarter(e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{qOptions().map(q=><option key={q.start} value={q.start+'|'+q.end}>{q.label}</option>)}</select></label>
   <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Search</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Supplier / invoice / GSTIN" className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/></label>
   <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Category</span><select value={category} onChange={e=>setCategory(e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="all">All</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
   <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">ITC</span><select value={itc} onChange={e=>setItc(e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="all">All</option>{itcStatuses.map(x=><option key={x}>{x}</option>)}</select></label>
   <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">GSTR-2B</span><select value={twoB} onChange={e=>setTwoB(e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="all">All</option>{twoBStatuses.map(x=><option key={x}>{x}</option>)}</select></label>
  </div><p className="mt-3 text-xs text-muted-foreground">2B check pending: <b className="text-foreground">{totals.pending}</b> • Quarter GST: <b className="text-foreground">{money(totals.cgst+totals.sgst+totals.igst)}</b> • Total bills: <b className="text-foreground">{money(totals.total)}</b></p></section>
  {error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{message&&<div className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">{message}</div>}
  <section className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Taxable</th><th className="px-4 py-3 text-right">GST</th><th className="px-4 py-3">2B</th><th className="px-4 py-3">ITC</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Bill</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{visible.map(b=>{const g=(+b.cgst||0)+(+b.sgst||0)+(+b.igst||0);return <tr key={b.id} className="border-b last:border-0"><td className="px-4 py-3">{new Date(b.invoice_date+'T00:00:00').toLocaleDateString('en-IN')}</td><td className="px-4 py-3"><b>{b.supplier_name}</b><div className="text-xs text-muted-foreground">{b.supplier_gstin||'GSTIN not entered'}</div></td><td className="px-4 py-3">{b.invoice_number||'—'}</td><td className="px-4 py-3">{b.category}</td><td className="px-4 py-3 text-right">{money(b.taxable_amount)}</td><td className="px-4 py-3 text-right">{money(g)}</td><td className="px-4 py-3">{b.gstr2b_status}</td><td className="px-4 py-3">{b.itc_status}</td><td className="px-4 py-3">{b.payment_status}</td><td className="px-4 py-3">{b.invoice_file_path?<button onClick={()=>void openFile(b)} className="font-semibold text-primary"><FileText className="mr-1 inline h-4 w-4"/>Open</button>:'—'}</td><td className="px-4 py-3"><button onClick={()=>edit(b)} className="mr-1 rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4"/></button><button onClick={()=>void remove(b)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></td></tr>})}{!visible.length&&<tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-muted-foreground">No business bills for this quarter.</td></tr>}</tbody></table></div></section>
  <p className="mt-4 text-xs text-muted-foreground">Bill files use a private Supabase Storage bucket. Keep a separate quarterly backup outside the website too.</p>
 </div></main>
 {open&&<div className="fixed inset-0 z-[110] overflow-y-auto bg-black/40 p-4"><div className="mx-auto my-6 w-full max-w-3xl rounded-2xl border bg-background shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold">{editing?'Edit Business Bill':'Add Business Bill'}</h2><button onClick={()=>setOpen(false)}><X className="h-5 w-5"/></button></div><form onSubmit={save} className="p-5">
  <div className="grid gap-4 sm:grid-cols-2">{[['supplier_name','Supplier name *','text'],['supplier_gstin','Supplier GSTIN','text'],['invoice_number','Invoice number','text'],['invoice_date','Invoice date *','date']].map(([k,l,t])=><label key={k}><span className="mb-1 block text-xs font-semibold text-muted-foreground">{l}</span><input type={t} value={form[k as keyof Form]} onChange={e=>set(k as keyof Form,e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/></label>)}<label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Category</span><select value={form.category} onChange={e=>set('category',e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{categories.map(x=><option key={x}>{x}</option>)}</select></label></div>
  <div className="mt-5 rounded-xl border bg-muted/20 p-4"><b className="text-sm">GST amounts</b><div className="mt-3 grid gap-4 sm:grid-cols-4">{(['taxable_amount','cgst','sgst','igst'] as const).map(k=><label key={k}><span className="mb-1 block text-xs font-semibold text-muted-foreground">{k==='taxable_amount'?'Taxable amount':k.toUpperCase()}</span><input type="number" min="0" step="0.01" value={form[k]} onChange={e=>set(k,e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/></label>)}</div><div className="mt-3 flex justify-between border-t pt-3 text-sm"><b>GST: {money(gst)}</b><b>Total: {money(total)}</b></div></div>
  <div className="mt-4 grid gap-4 sm:grid-cols-3">{[['itc_status','GST ITC',itcStatuses],['gstr2b_status','GSTR-2B status',twoBStatuses],['payment_status','Payment status',paymentStatuses]].map(([k,l,opts])=><label key={String(k)}><span className="mb-1 block text-xs font-semibold text-muted-foreground">{l}</span><select value={form[k as keyof Form]} onChange={e=>set(k as keyof Form,e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{(opts as string[]).map(x=><option key={x}>{x}</option>)}</select></label>)}</div>
  {form.payment_status==='Paid'&&<div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Payment date</span><input type="date" value={form.payment_date} onChange={e=>set('payment_date',e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"/></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Payment mode</span><select value={form.payment_mode} onChange={e=>set('payment_mode',e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{paymentModes.map(x=><option key={x}>{x}</option>)}</select></label></div>}
  <div className="mt-4"><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Invoice PDF / image</span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>void runInvoiceOcr(e.target.files?.[0]||null)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/></label>{editing?.invoice_file_name&&!file&&<p className="mt-1 text-xs text-muted-foreground">Current: {editing.invoice_file_name}</p>}{ocrBusy&&<p className="mt-2 text-xs font-semibold text-primary">Reading invoice… please wait.</p>}{ocrNote&&<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">🟡 {ocrNote}</div>}{ocrInvoiceTotal!==null&&Math.abs(total-ocrInvoiceTotal)>0.01&&<div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">⚠️ Invoice total mismatch: OCR found {money(ocrInvoiceTotal)}, but the editable fields currently calculate {money(total)}. Please verify before saving.</div>}</div>
  <label className="mt-4 block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Notes</span><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/></label>
  {error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
  <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setOpen(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{saving?'Saving…':editing?'Save changes':'Save bill'}</button></div>
 </form></div></div>}
 </>}
