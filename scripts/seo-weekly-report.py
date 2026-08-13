#!/usr/bin/env python3
"""
seo-weekly-report.py — 4-site weekly SEO health report (GSC + Bing).

Runs in CI on a weekly cron. Prints a Markdown report to stdout, which the
workflow appends to GITHUB_STEP_SUMMARY. No commits, no deploys.

Tracks the recovery after the 2026-06-10 dedup/cn-removal overhaul:
wiki Bing InIndex (was 154/4,364) and crawl errors (was 494) are the key
numbers to watch.

Also inspects a handful of canary URLs to check that Googlebot can still FETCH
them. Clicks and impressions cannot see this: ahoxy.com started answering
Googlebot with 403 somewhere between 2026-07-11 and 2026-07-15, which made all
595 of its 301s unreadable, and nothing noticed for a month because the pages
had already stopped ranking for other reasons. Aggregate traffic is a lagging,
ambiguous signal; pageFetchState is a direct one.

Environment variables:
  GSC_SERVICE_ACCOUNT_JSON   Google service account JSON content
  BING_WEBMASTER_API_KEY     Bing Webmaster Tools API key
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone

import requests

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build as google_build
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False

SITES = [
    {"name": "oiyo.net",      "gsc": "sc-domain:oiyo.net",      "url": "https://oiyo.net"},
    {"name": "blog.oiyo.net", "gsc": "https://blog.oiyo.net/",  "url": "https://blog.oiyo.net"},
    {"name": "wiki.oiyo.net", "gsc": "sc-domain:wiki.oiyo.net", "url": "https://wiki.oiyo.net"},
    {"name": "game.oiyo.net", "gsc": "sc-domain:game.oiyo.net", "url": "https://game.oiyo.net"},
    {"name": "news.oiyo.net", "gsc": "sc-domain:news.oiyo.net", "url": "https://news.oiyo.net"},
    {"name": "ahoxy.com",     "gsc": "sc-domain:ahoxy.com",     "url": "https://ahoxy.com"},
]

BING_BASE = "https://ssl.bing.com/webmaster/api.svc/json"
APEX_PROP = "sc-domain:oiyo.net"
APEX_PAGE_REGEX = r"^https://(www\.)?oiyo\.net/"

# One canary URL per property, plus the two ahoxy sources that carried the most
# traffic. Kept deliberately short: URL Inspection costs ~5s per call, and the
# question it answers ("can Googlebot reach this host at all?") is answered by
# one URL per host. Extra entries buy nothing and slow the weekly job.
CANARIES = [
    ("sc-domain:oiyo.net",   "https://oiyo.net/en/saju/calculator/"),
    ("https://blog.oiyo.net/", "https://blog.oiyo.net/en/height-converter/"),
    ("sc-domain:wiki.oiyo.net", "https://wiki.oiyo.net/"),
    ("sc-domain:game.oiyo.net", "https://game.oiyo.net/"),
    ("sc-domain:news.oiyo.net", "https://news.oiyo.net/"),
    ("sc-domain:ahoxy.com",  "https://ahoxy.com/en/height-converter"),
    ("sc-domain:ahoxy.com",  "https://ahoxy.com/ko/kbd"),
]

# Fetch states that mean Googlebot could not read the URL. SUCCESSFUL is the
# only healthy value; the *_UNSPECIFIED placeholder just means Google has never
# tried this URL, which is not a regression, so it is not listed here.
BAD_FETCH_STATES = {
    "ACCESS_DENIED",
    "ACCESS_FORBIDDEN",
    "BLOCKED_4XX",
    "BLOCKED_ROBOTS_TXT",
    "INTERNAL_CRAWL_ERROR",
    "INVALID_ROBOTS_TXT",
    "NOT_FOUND",
    "PAGE_TIMEOUT",
    "REDIRECT_ERROR",
    "SERVER_ERROR",
    "SOFT_404",
}


def gsc_service():
    raw = os.environ.get("GSC_SERVICE_ACCOUNT_JSON")
    if not (HAS_GOOGLE and raw):
        return None
    info = json.loads(raw)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return google_build("webmasters", "v3", credentials=creds)


def gsc_body(prop, start, end):
    body = {"startDate": start, "endDate": end, "dimensions": ["date"], "rowLimit": 100}
    if prop == APEX_PROP:
        body["dimensionFilterGroups"] = [{
            "groupType": "and",
            "filters": [{
                "dimension": "page",
                "operator": "includingRegex",
                "expression": APEX_PAGE_REGEX,
            }],
        }]
    return body


def gsc_window(svc, prop, start, end):
    try:
        rows = svc.searchanalytics().query(
            siteUrl=prop,
            body=gsc_body(prop, start, end),
        ).execute().get("rows", [])
        return (
            int(sum(r.get("clicks", 0) for r in rows)),
            int(sum(r.get("impressions", 0) for r in rows)),
        )
    except Exception as exc:
        print(f"<!-- GSC error {prop}: {exc} -->", file=sys.stderr)
        return None


def gsc_sitemap_errors(svc, prop):
    try:
        maps = svc.sitemaps().list(siteUrl=prop).execute().get("sitemap", [])
        return sum(int(m.get("errors", 0)) for m in maps), len(maps)
    except Exception:
        return None


def inspection_service():
    """URL Inspection lives on a different discovery doc than Search Analytics."""
    raw = os.environ.get("GSC_SERVICE_ACCOUNT_JSON")
    if not (HAS_GOOGLE and raw):
        return None
    info = json.loads(raw)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return google_build("searchconsole", "v1", credentials=creds)


def canary_fetch_state(svc, prop, url):
    """Return (fetch_state, last_crawl_date) as Google last saw the URL."""
    try:
        result = svc.urlInspection().index().inspect(body={
            "inspectionUrl": url, "siteUrl": prop, "languageCode": "ko",
        }).execute()["inspectionResult"]["indexStatusResult"]
    except Exception as exc:
        print(f"<!-- inspect error {url}: {exc} -->", file=sys.stderr)
        return None, None
    return result.get("pageFetchState", "?"), (result.get("lastCrawlTime") or "-")[:10]


def bing_crawl_stats(url):
    key = os.environ.get("BING_WEBMASTER_API_KEY")
    if not key:
        return None
    try:
        r = requests.get(
            f"{BING_BASE}/GetCrawlStats", params={"apikey": key, "siteUrl": url}, timeout=30
        )
        if r.status_code != 200:
            return None
        rows = r.json().get("d") or []
        # GetCrawlStats returns a daily series — use the most recent entry
        return rows[-1] if isinstance(rows, list) and rows else (rows if isinstance(rows, dict) else None)
    except Exception:
        return None


def main() -> int:
    today = datetime.now(timezone.utc).date()
    end_date = today - timedelta(days=2)                 # GSC data lags ~2 days
    start_date = end_date - timedelta(days=6)            # inclusive 7-day window
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - timedelta(days=6)
    end = end_date.isoformat()
    start_7 = start_date.isoformat()
    prev_end = prev_end_date.isoformat()
    prev_start = prev_start_date.isoformat()

    svc = gsc_service()

    print(f"## 주간 SEO 리포트 — {today.isoformat()}")
    print()
    print("| 사이트 | 클릭(7d) | 전주 | 노출(7d) | 전주 | 사이트맵 오류 | Bing 색인 | Bing 크롤오류 |")
    print("|---|---|---|---|---|---|---|---|")

    for site in SITES:
        clicks = imps = pclicks = pimps = "—"
        sm_err = "—"
        if svc:
            cur = gsc_window(svc, site["gsc"], start_7, end)
            prev = gsc_window(svc, site["gsc"], prev_start, prev_end)
            if cur:
                clicks, imps = cur
            if prev:
                pclicks, pimps = prev
            sm = gsc_sitemap_errors(svc, site["gsc"])
            if sm is not None:
                sm_err = f"{sm[0]} ({sm[1]}개 등록)"

        in_index = crawl_err = "—"
        stats = bing_crawl_stats(site["url"])
        if stats:
            in_index = stats.get("InIndex", "—")
            crawl_err = stats.get("CrawlErrors", "—")

        print(
            f"| {site['name']} | {clicks} | {pclicks} | {imps} | {pimps} "
            f"| {sm_err} | {in_index} | {crawl_err} |"
        )

    print()
    print("> 기준점(2026-06-10 정비 직후): wiki Bing 색인 154 / 크롤오류 494 · "
          "blog 크롤오류 779 · GSC 90일 클릭 4 (oiyo 도메인 합산)")

    blocked = report_canaries()

    if blocked:
        print()
        print("🔴 **Googlebot이 아래 URL을 가져오지 못합니다.** 트래픽 지표로는 보이지 "
              "않는 고장이므로 호스트의 CDN/방화벽 설정을 먼저 확인하세요.")
        for url, state, crawl in blocked:
            print(f"> - `{url}` — {state} (마지막 크롤 {crawl})")
        return 1
    return 0


def report_canaries():
    """Print the crawl-reachability table; return the rows Google could not fetch."""
    print()
    print("### Googlebot 도달 확인 (canary)")
    print()
    print("| URL | fetch 상태 | 마지막 크롤 |")
    print("|---|---|---|")

    svc = inspection_service()
    if svc is None:
        print("| — | 자격 없음 (GSC_SERVICE_ACCOUNT_JSON 미설정) | — |")
        return []

    blocked = []
    for prop, url in CANARIES:
        state, crawl = canary_fetch_state(svc, prop, url)
        if state is None:
            print(f"| {url} | 조회 실패 | — |")
            continue
        mark = "🔴 " if state in BAD_FETCH_STATES else ""
        print(f"| {url} | {mark}{state} | {crawl} |")
        if state in BAD_FETCH_STATES:
            blocked.append((url, state, crawl))
    return blocked


if __name__ == "__main__":
    sys.exit(main())
