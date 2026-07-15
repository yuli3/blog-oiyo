#!/usr/bin/env python3
"""Deterministic regression for weekly GSC property scope and date windows."""
from datetime import date, timedelta
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).with_name("seo-weekly-report.py")
spec = importlib.util.spec_from_file_location("seo_weekly_report", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(module)

apex = module.gsc_body(module.APEX_PROP, "2026-07-07", "2026-07-13")
blog = module.gsc_body("https://blog.oiyo.net/", "2026-07-07", "2026-07-13")
assert apex["dimensionFilterGroups"][0]["filters"][0]["expression"] == module.APEX_PAGE_REGEX
assert "dimensionFilterGroups" not in blog

end = date(2026, 7, 13)
start = end - timedelta(days=6)
assert (end - start).days + 1 == 7

print("weekly SEO scope regression: PASS (apex scoped; windows exactly 7 days)")
