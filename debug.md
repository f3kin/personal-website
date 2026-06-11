# Debug Context

Project-specific debugging patterns, anti-patterns, and operational knowledge.
Updated by both humans and Claude sessions.

## Patterns

### Beehiiv drafts leaked onto /writing (2026-06-11)

**Symptom:** an unpublished newsletter draft appeared on finlayekins.com/writing before it was scheduled or sent.
**Root cause:** Beehiiv's v2 posts API ignores the `status[]` query param: requesting only `status[]=confirmed` still returns posts with `status: "draft"`. The page trusted the API filter.
**Fix:** client-side filter in `lib/beehiiv.ts` (`listPublishedPosts`): exclude `status === "draft"` AND require a numeric `publish_date` in the past. The date guard also stops scheduled-but-unsent posts (status `confirmed`, future `publish_date`) appearing before send time. Commit `fadd8dd`.
**Lesson:** never trust Beehiiv list-endpoint query filters; re-filter everything client-side. Beehiiv also reports published posts as `confirmed` via the raw v2 API (the dashboard/MCP shows `published`), so don't match on `published` either.

## Environment notes

- `/writing` and post pages are ISR-cached (300s list / 3600s detail): after a deploy or a Beehiiv-side change, allow ~5 minutes before judging whether a fix worked.
- Beehiiv creds for local testing live in `.env.local` (`BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`).
