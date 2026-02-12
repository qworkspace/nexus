/**
 * Outcomes API Integration Tests (OTF-001)
 *
 * Tests the outcomes API endpoints for valid responses.
 * Run with: npx jest tests/outcomes.test.ts
 */

const BASE_URL = process.env.NEXUS_URL || "http://localhost:3002";

describe("Outcomes API", () => {
  describe("GET /api/outcomes", () => {
    it("returns valid summary for today", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("period");
      expect(data).toHaveProperty("count");
      expect(typeof data.count).toBe("number");
      expect(data).toHaveProperty("time_saved_minutes");
      expect(data).toHaveProperty("by_category");
      expect(data).toHaveProperty("by_agent");
    });

    it("returns valid summary for week", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes?period=week`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("period");
      expect(data).toHaveProperty("count");
    });

    it("filters by category", async () => {
      const response = await fetch(
        `${BASE_URL}/api/outcomes?category=time_saved`
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      // If there are outcomes, they should all be time_saved
      if (data.count > 0) {
        expect(data.by_category).toHaveProperty("time_saved");
        expect(Object.keys(data.by_category)).toHaveLength(1);
      }
    });
  });

  describe("GET /api/outcomes/trends", () => {
    it("returns valid trends for 14 days", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes/trends?days=14`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("days");
      expect(data.days).toBe(14);
      expect(data).toHaveProperty("daily");
      expect(Array.isArray(data.daily)).toBe(true);
      expect(data.daily).toHaveLength(14);
      expect(data).toHaveProperty("weekly_average");
      expect(data).toHaveProperty("top_categories");
      expect(Array.isArray(data.top_categories)).toBe(true);
    });

    it("each daily entry has required fields", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes/trends?days=7`);
      const data = await response.json();

      for (const day of data.daily) {
        expect(day).toHaveProperty("date");
        expect(day).toHaveProperty("count");
        expect(day).toHaveProperty("time_saved_minutes");
        expect(day).toHaveProperty("by_category");
      }
    });
  });

  describe("GET /api/outcomes/recent", () => {
    it("returns valid recent outcomes", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes/recent`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("outcomes");
      expect(Array.isArray(data.outcomes)).toBe(true);
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("limit");
    });

    it("respects limit parameter", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes/recent?limit=5`);
      const data = await response.json();

      expect(data.outcomes.length).toBeLessThanOrEqual(5);
      expect(data.limit).toBe(5);
    });

    it("filters by category", async () => {
      const response = await fetch(
        `${BASE_URL}/api/outcomes/recent?category=task_completed`
      );
      const data = await response.json();

      for (const outcome of data.outcomes) {
        expect(outcome.category).toBe("task_completed");
      }
    });

    it("outcomes have required fields", async () => {
      const response = await fetch(`${BASE_URL}/api/outcomes/recent?limit=3`);
      const data = await response.json();

      for (const outcome of data.outcomes) {
        expect(outcome).toHaveProperty("ts");
        expect(outcome).toHaveProperty("datetime");
        expect(outcome).toHaveProperty("category");
        expect(outcome).toHaveProperty("description");
      }
    });
  });
});
