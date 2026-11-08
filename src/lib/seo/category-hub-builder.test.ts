import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCategoryHubData } from "./category-hub-builder.ts";
import { locales } from "../i18n.ts";

describe("buildCategoryHubData", () => {
  it("builds rich overview paragraphs and 3 FAQs for Economics in Korean", () => {
    const data = buildCategoryHubData({
      category: "Economics",
      displayName: "경제학",
      locale: "ko",
      track: "academy",
      itemCount: 42,
    });

    assert.ok(data.overviewParagraphs.length >= 2);
    assert.match(data.overviewParagraphs[0], /미시경제학/);
    assert.equal(data.faqs.length, 3);
    assert.match(data.faqs[0].q, /경제학/);
    assert.equal(data.faqJsonLd["@type"], "FAQPage");
    assert.equal(data.faqJsonLd.mainEntity.length, 3);
  });

  it("supports all 6 languages with valid FAQPage JSON-LD", () => {
    for (const locale of locales) {
      const data = buildCategoryHubData({
        category: "Law",
        displayName: locale === "ko" ? "법학" : "Law",
        locale,
        track: "academy",
        itemCount: 30,
      });

      assert.ok(data.overviewParagraphs.length >= 1);
      assert.equal(data.faqs.length, 3);
      assert.equal(data.faqJsonLd.mainEntity.length, 3);
    }
  });

  it("synthesizes clean fallbacks for unlisted categories", () => {
    const data = buildCategoryHubData({
      category: "CustomDiscipline",
      displayName: "신규학문",
      locale: "ko",
      track: "magazine",
      itemCount: 15,
    });

    assert.ok(data.overviewParagraphs.length >= 2);
    assert.match(data.overviewParagraphs[1], /총 15개의 엄선된 챕터/);
    assert.equal(data.faqs.length, 3);
  });
});
