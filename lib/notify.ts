/**
 * Email notification when a new comment is posted. Fire-and-forget in
 * spirit: a broken or unconfigured notification path must never fail the
 * comment itself, which has already been saved by the time this runs. Every
 * failure is caught and logged, never thrown.
 *
 * No notification mechanism existed in this repo before this (no Slack
 * webhook, no other email provider), so this uses Resend directly.
 */

import { Resend } from "resend"

const NOTIFY_TO = "finlay@thehourglass.ai"
// Resend's shared sandbox sender: works without a verified domain. Swap for
// a verified finlayekins.com address once one is set up in Resend.
const NOTIFY_FROM = "Finlay Ekins's site <onboarding@resend.dev>"

export type NewCommentNotification = {
  id: string
  slug: string
  name: string
  body: string
}

export async function notifyNewComment(input: NewCommentNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      JSON.stringify({ evt: "comment_notify_skipped", reason: "no_resend_key", slug: input.slug }),
    )
    return
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `New comment on ${input.slug} from ${input.name}`,
      text: `${input.body}\n\n - \nThis comment is live now. Hide it by calling PATCH /api/comments/${input.id} with your admin token if it needs moderating.`,
    })
    if (error) {
      console.error("[notifyNewComment] Resend returned an error", error)
    }
  } catch (err) {
    console.error("[notifyNewComment] failed", err)
  }
}
