import { NextResponse } from "next/server"
import { collectAudioUrls, getKieConfig, parseKieResultJson } from "@/lib/kie-audio"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ taskId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { taskId } = await context.params
  if (!taskId || !/^[A-Za-z0-9_-]{12,128}$/.test(taskId)) {
    return NextResponse.json({ error: "Invalid KIE task id." }, { status: 400 })
  }

  const { apiKey, baseUrl } = getKieConfig()
  if (!apiKey) {
    return NextResponse.json({ error: "KIE API key is not configured on the server." }, { status: 500 })
  }

  const response = await fetch(`${baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.data) {
    return NextResponse.json(
      {
        error: data?.msg || "Unable to fetch KIE task status.",
        code: data?.code || response.status,
      },
      { status: response.ok ? 502 : response.status },
    )
  }

  const record = data.data
  const result = parseKieResultJson(record.resultJson)
  const audioUrls = collectAudioUrls(result)

  return NextResponse.json({
    taskId: record.taskId || taskId,
    model: record.model,
    state: record.state,
    progress: record.progress,
    failCode: record.failCode,
    failMsg: record.failMsg,
    creditsConsumed: record.creditsConsumed,
    createTime: record.createTime,
    updateTime: record.updateTime,
    completeTime: record.completeTime,
    result,
    audioUrls,
  })
}
