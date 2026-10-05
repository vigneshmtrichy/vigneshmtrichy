import { NextResponse } from 'next/server'
import { ALL_PRODUCTS } from '@/lib/site'
import { createCashfreeOrder, getSupabaseAdmin } from '@/lib/cashfree-server'

const SHIPPING=79
const FREE=699

const txt=(v:unknown,max:number)=>{
  if(typeof v!=='string') return null
  const s=v.trim()
  return s && s.length<=max ? s : null
}
const round=(v:number)=>Math.round((v+Number.EPSILON)*100)/100

async function pinState(pin:string){
  const r=await fetch('https://api.postalpincode.in/pincode/'+pin,{cache:'no-store'})
  if(!r.ok) return null
  const d=await r.json()
  return d?.[0]?.Status==='Success' ? d?.[0]?.PostOffice?.[0]?.State || null : null
}

export async function POST(request:Request){
  try{
    const db=getSupabaseAdmin()
    const auth=request.headers.get('authorization')
    const token=auth?.match(/^Bearer\s+(.+)$/i)?.[1]
    let user:any=null
    if(auth&&!token) return NextResponse.json({success:false,message:'Invalid authentication'},{status:401})
    if(token){
      const {data,error}=await db.auth.getUser(token)
      if(error||!data.user) return NextResponse.json({success:false,message:'Invalid authentication'},{status:401})
      user=data.user
    }

    const b=await request.json()
    const name=txt(b?.customer_name,120)
    const phone=txt(b?.phone,20)
    const address=txt(b?.address,500)
    const pin=txt(b?.pincode,6)
    const city=txt(b?.city,100)
    const state=txt(b?.state,100)
    const email=user?.email || txt(b?.customer_email,200) || ''

    if(!name||!phone||!/^[6-9]\d{9}$/.test(phone)||!address||!pin||!/^\d{6}$/.test(pin)||!city||!state)
      return NextResponse.json({success:false,message:'Please check your delivery details and try again.'},{status:400})

    const verified=await pinState(pin)
    if(!verified) return NextResponse.json({success:false,message:'Unable to verify pincode right now. Please try again.'},{status:503})
    if(verified!==state) return NextResponse.json({success:false,message:'State does not match the pincode.'},{status:400})

    if(!Array.isArray(b?.items)||b.items.length<1||b.items.length>20)
      return NextResponse.json({success:false,message:'Your cart is invalid. Please refresh and try again.'},{status:400})

    const seen=new Set<string>()
    const items:any[]=[]
    for(const submitted of b.items){
      const slug=txt(submitted?.product_slug,100)
      const quantity=submitted?.quantity
      if(!slug||!Number.isSafeInteger(quantity)||quantity<1||quantity>100||seen.has(slug))
        return NextResponse.json({success:false,message:'Your cart has an invalid product or quantity.'},{status:400})
      const product=ALL_PRODUCTS.find(p=>p.slug===slug)
      if(!product) return NextResponse.json({success:false,message:'Your cart contains a product we could not verify.'},{status:400})
      seen.add(slug)
      items.push({
        product_slug:product.slug,product_name:product.name,quantity,
        unit_price:Number(product.price),mrp:Number(product.mrp||product.price),
        gst_rate:Number(product.gstRate||0),image:product.image,shipping_weight_kg:null
      })
    }

    const {data:statuses,error}=await db.from('product_status')
      .select('product_slug,status,stock_quantity,mrp,price,gst_rate')
      .in('product_slug',[...seen])
    if(error) throw error

    const bySlug=new Map((statuses||[]).map((x:any)=>[x.product_slug,x]))
    for(const item of items){
      const p=bySlug.get(item.product_slug)
      if(!p) return NextResponse.json({success:false,message:'A product in your cart could not be verified. Please refresh and try again.'},{status:409})
      if(['hidden','coming-soon','out-of-stock'].includes(p.status))
        return NextResponse.json({success:false,message:'A product in your cart is no longer available. Please refresh your cart.'},{status:409})
      if(p.price!=null) item.unit_price=Number(p.price)
      if(p.mrp!=null) item.mrp=Number(p.mrp)
      if(p.gst_rate!=null) item.gst_rate=Number(p.gst_rate)
      if(p.stock_quantity!=null&&p.stock_quantity<item.quantity)
        return NextResponse.json({success:false,message:'There is not enough stock for one of the products in your cart.'},{status:409})
      if(!Number.isFinite(item.unit_price)||item.unit_price<=0||!Number.isFinite(item.mrp)||item.mrp<item.unit_price||!Number.isFinite(item.gst_rate)||item.gst_rate<0||item.gst_rate>100)
        return NextResponse.json({success:false,message:'A product in your cart has invalid pricing.'},{status:409})
    }

    const productTotal=round(items.reduce((s,i)=>s+i.unit_price*i.quantity,0))
    const mrpTotal=round(items.reduce((s,i)=>s+i.mrp*i.quantity,0))
    const taxableValue=round(items.reduce((s,i)=>s+(i.unit_price/(1+i.gst_rate/100))*i.quantity,0))
    const gstTotal=round(productTotal-taxableValue)
    const cgst=state==='Tamil Nadu'?round(gstTotal/2):0
    const sgst=state==='Tamil Nadu'?round(gstTotal/2):0
    const igst=state==='Tamil Nadu'?0:gstTotal
    const delivery=productTotal>=FREE?0:SHIPPING
    const total=round(productTotal+delivery)
    const cfOrderId='tenoo_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)

    const {data:intent,error:intentError}=await db.from('cashfree_payment_intents').insert({
      cashfree_order_id:cfOrderId,user_id:user?.id||null,customer_name:name,customer_email:email,
      phone,address,pincode:pin,city,state,items,mrp_total:mrpTotal,product_total:productTotal,
      taxable_value:taxableValue,gst_total:gstTotal,cgst,sgst,igst,delivery_charge:delivery,total
    }).select('id').single()
    if(intentError||!intent) throw intentError||new Error('Unable to create payment intent')

    try{
      const origin=new URL(request.url).origin
      const cfOrder=await createCashfreeOrder({
        orderId:cfOrderId,amount:total,customerId:user?.id||('guest_'+phone),
        customerName:name,customerEmail:email,customerPhone:phone,
        returnUrl:origin+'/checkout/payment?order_id={order_id}',
        notifyUrl:origin+'/api/cashfree/webhook'
      })
      return NextResponse.json({success:true,order_id:cfOrderId,payment_session_id:cfOrder?.payment_session_id,amount:total})
    }catch(error){
      await db.from('cashfree_payment_intents').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',intent.id)
      throw error
    }
  }catch(error){
    console.error('Cashfree order creation failed:',error)
    return NextResponse.json({success:false,message:'Unable to start payment. Please try again.'},{status:500})
  }
}
