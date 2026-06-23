import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const taskId = typeof payload?.taskId === "string" ? payload.taskId : payload?.data?.taskId

  console.info("KIE audio callback received", {
    taskId,
    state: payload?.state || payload?.data?.state,
  })

  return NextResponse.json({ ok: true })
}
