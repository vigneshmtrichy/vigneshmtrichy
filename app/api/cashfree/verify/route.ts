import { NextResponse } from 'next/server'
import { finalizeCashfreePayment } from '@/lib/cashfree-server'

export async function GET(request:Request){
  try{
    const orderId=new URL(request.url).searchParams.get('order_id')
    if(!orderId||orderId.length>100) return NextResponse.json({success:false,message:'Invalid payment order.'},{status:400})
    const result=await finalizeCashfreePayment(orderId)
    return NextResponse.json({success:true,status:result.status,order_id:result.orderId})
  }catch(error){
    console.error('Cashfree payment verification failed:',error)
    return NextResponse.json({success:false,message:'Unable to verify payment right now. Please try again.'},{status:500})
  }
}
