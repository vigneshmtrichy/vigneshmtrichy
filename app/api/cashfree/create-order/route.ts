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

    const slugs = [...new Set<string>(b.items.map((item: any) => txt(item?.product_slug, 100)).filter((value: string | null): value is string => Boolean(value)))]
    if (slugs.length !== b.items.length) return NextResponse.json({success:false,message:'Your cart has an invalid product.'},{status:400})

    const [{data:statuses,error:statusError},{data:skuRows,error:skuError}] = await Promise.all([
      db.from('product_status').select('product_slug,status,stock_quantity,mrp,price,gst_rate').in('product_slug',slugs),
      db.from('product_skus').select('id,product_slug,sku_code,pack_size_value,pack_size_unit,mrp,online_price,gst_rate,shipping_weight_kg,status,sku_inventory(stock_quantity)').in('product_slug',slugs).eq('status','active')
    ])
    if(statusError) throw statusError
    if(skuError) throw skuError

    const bySlug=new Map((statuses||[]).map((x:any)=>[x.product_slug,x]))
    const bySku=new Map((skuRows||[]).map((x:any)=>[x.id,x]))
    const activeSkuSlugs=new Set((skuRows||[]).map((x:any)=>x.product_slug))
    const seen=new Set<string>()
    const items:any[]=[]

    for(const submitted of b.items){
      const slug=txt(submitted?.product_slug,100)
      const skuId=txt(submitted?.sku_id,64)
      const quantity=submitted?.quantity
      const key=slug+':'+(skuId||'legacy')
      if(!slug||!Number.isSafeInteger(quantity)||quantity<1||quantity>100||seen.has(key))
        return NextResponse.json({success:false,message:'Your cart has an invalid product or quantity.'},{status:400})
      const product=ALL_PRODUCTS.find(p=>p.slug===slug)
      const parent=bySlug.get(slug)
      if(!product||!parent) return NextResponse.json({success:false,message:'A product in your cart could not be verified.'},{status:409})
      if(['hidden','coming-soon','out-of-stock'].includes(parent.status))
        return NextResponse.json({success:false,message:'A product in your cart is no longer available.'},{status:409})

      let unitPrice=Number(parent.price ?? product.price)
      let mrp=Number(parent.mrp ?? product.mrp ?? product.price)
      let gstRate=Number(parent.gst_rate ?? product.gstRate ?? 0)
      let snapshot:any={
        product_slug:slug,product_name:product.name,quantity,unit_price:unitPrice,mrp,
        gst_rate:gstRate,image:product.image,shipping_weight_kg:null
      }

      if(skuId){
        const sku=bySku.get(skuId)
        if(!sku||sku.product_slug!==slug||sku.status!=='active')
          return NextResponse.json({success:false,message:'The selected pack is no longer available. Please refresh your cart.'},{status:409})
        unitPrice=Number(sku.online_price)
        mrp=Number(sku.mrp)
        gstRate=Number(sku.gst_rate)
        const inv=Array.isArray(sku.sku_inventory)?sku.sku_inventory[0]:sku.sku_inventory
        const available=inv?.stock_quantity
        if(available!=null&&available<quantity)
          return NextResponse.json({success:false,message:'There is not enough stock for the selected pack.'},{status:409})
        snapshot={
          ...snapshot,sku_id:sku.id,sku_code:sku.sku_code,
          pack_size_value:Number(sku.pack_size_value),pack_size_unit:sku.pack_size_unit,
          shipping_weight_kg:sku.shipping_weight_kg==null?null:Number(sku.shipping_weight_kg)
        }
      } else if(activeSkuSlugs.has(slug)){
        return NextResponse.json({success:false,message:'Please select a pack size for '+product.name+'. Refresh the product page and choose a pack.'},{status:409})
      } else if(parent.stock_quantity!=null&&Number(parent.stock_quantity)<quantity){
        return NextResponse.json({success:false,message:'There is not enough stock for one of the products in your cart.'},{status:409})
      }

      if(!Number.isFinite(unitPrice)||unitPrice<=0||!Number.isFinite(mrp)||mrp<unitPrice||!Number.isFinite(gstRate)||gstRate<0||gstRate>100)
        return NextResponse.json({success:false,message:'A product in your cart has invalid pricing.'},{status:409})
      snapshot.unit_price=unitPrice
      snapshot.mrp=mrp
      snapshot.gst_rate=gstRate
      items.push(snapshot)
      seen.add(key)
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
      return NextResponse.json({success:true,order_id:cfOrderId,payment_session_id:cfOrder?.payment_session_id,amount:total,mode:process.env.CASHFREE_ENV==='production'?'production':'sandbox'})
    }catch(error){
      await db.from('cashfree_payment_intents').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',intent.id)
      throw error
    }
  }catch(error){
    console.error('Cashfree order creation failed:',error)
    return NextResponse.json({success:false,message:'Unable to start payment. Please try again.'},{status:500})
  }
}
