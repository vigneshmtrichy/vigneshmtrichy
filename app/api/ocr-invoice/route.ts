import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'

export const runtime='nodejs'

const MAX_FILE_SIZE=10*1024*1024

export async function POST(request:Request){
  let parser:PDFParse|undefined
  try{
    const form=await request.formData()
    const file=form.get('file')

    if(!(file instanceof File))return NextResponse.json({error:'No invoice file was provided.'},{status:400})
    if(file.type!=='application/pdf')return NextResponse.json({error:'Only PDF files can use PDF text extraction.'},{status:400})
    if(file.size>MAX_FILE_SIZE)return NextResponse.json({error:'Invoice PDF must be 10 MB or smaller.'},{status:413})

    const buffer=Buffer.from(await file.arrayBuffer())
    parser=new PDFParse({data:buffer})
    const result=await parser.getText()
    const text=(result.text||'').trim()

    return NextResponse.json({text})
  }catch(error){
    const message=error instanceof Error?error.message:'Unable to read the invoice PDF.'
    return NextResponse.json({error:message},{status:500})
  }finally{
    if(parser)await parser.destroy().catch(()=>{})
  }
}
