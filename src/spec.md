# Specification

## Summary
**Goal:** Ensure the evasive “No” button on the Valentine page never overlaps or visually collides with the static “Yes! 💕” button across all interactions and resizes.

**Planned changes:**
- Update the Valentine page logic/layout (frontend/src/pages/ValentinePage.tsx) to enforce a minimum visible gap between the “No” and “Yes! 💕” buttons on initial render and after every evasive move trigger (hover, touch start, pointer down, click).
- Recalculate and correct the “No” button position on viewport/container resize and mobile orientation changes to maintain non-overlap with the “Yes! 💕” button.

**User-visible outcome:** The “No” button still dodges interactions, but it consistently stays separated from the “Yes! 💕” button (never touching or overlapping), including after repeated moves and when the screen size/orientation changes.
