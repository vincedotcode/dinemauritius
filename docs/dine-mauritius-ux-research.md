# Dine Mauritius — UX/UI Research for a Swipe-First MVP

## 1. Product Position

**Dine Mauritius** should feel like a warm island concierge, not a directory.

The problem with most restaurant products is not lack of information. It is decision fatigue. Mauritius already has listings on Google Maps, but the experience is noisy, utility-heavy, and full of tabs, ads, and repeated choices. A swipe-first product creates a simpler promise:

**"Show me the next place worth considering."**

That is the core shift from search engine to shortlist engine.

## 2. Brand Direction

### Brand idea
**Dine Mauritius** is the island dining shortlist.

### Brand personality
- Warm, editorial, and quietly premium
- Useful without sounding transactional
- Curated rather than exhaustive
- Calm enough for date night, quick enough for lunch decisions

### Voice
- Short, confident sentences
- No hype language
- No tourism brochure clichés
- Recommend like a trusted local friend with good taste

### Core promise
- Swipe to discover
- Save the spots worth a detour
- Open the full dossier only when interest is earned

## 3. Why Swipe Works Here

A swipe interaction is effective for restaurant discovery because the first decision is binary:

- **Not for tonight**
- **Worth saving**

Users do not want to compare 24 cards at once. They want a faster way to reduce a large set into a shortlist. Swipe mechanics turn "search and scan" into "decide and move."

This is especially effective on mobile:

- one thumb
- one image
- one recommendation at a time
- no page-level scrolling required to continue discovery

## 4. Primary Users

### Local planner
- Lives in Mauritius
- Decides quickly after work or on weekends
- Wants a shortlist, not a research project

### Visiting couple or group
- Not familiar with districts
- Uses photos and ratings as trust signals
- Needs to save a few options fast, then discuss

### Food-first explorer
- Already knows the island
- Wants to discover outside the usual routine
- Uses cuisine and district filters, then swipes through candidates

## 5. Jobs To Be Done

### Main job
"Help me narrow Mauritius down to a few restaurants I would actually go to."

### Supporting jobs
- Show me good photos immediately
- Make it obvious where the restaurant is
- Let me keep a shortlist without logging in
- Let me open details only when I care
- Preserve my saved list like an app, not a session

## 6. MVP Interaction Model

### Primary tab: Discover
The user lands directly in the swipe deck.

Each card should answer:
- What is it?
- Where is it?
- Is it well liked?
- Is it open?
- Why should I care?

### Secondary tab: Saved
Every right swipe adds the restaurant to a persistent shortlist stored locally.

This view is where comparison happens. The discover flow is for reduction. The saved flow is for evaluation.

### Filter sheet
Filters should stay available, but not dominate the first screen.

Best MVP filters:
- district
- cuisine
- open now
- sort
- search

These belong in a sheet or drawer, not permanently above the deck on mobile.

## 7. Information Hierarchy for the Swipe Card

### Must show on card front
- restaurant photo
- name
- district
- rating and review count
- open/closed
- price signal if present
- up to three cuisine tags
- one short "reason to care" sentence

### Must stay out of the front card
- full opening hours
- long reviews
- phone, website, plus codes, feature grids

That information belongs in the detail layer.

## 8. Detail Layer Recommendation

The detail layer should feel like a restaurant dossier.

Recommended sections:
- photo gallery
- rating summary
- address and district
- call and Google Maps actions
- opening hours
- features
- reviews

The detail layer should not interrupt the core deck flow more than necessary. It is secondary.

## 9. Visual System

This app should follow the warm editorial system in [`docs/design.md`](./design.md).

### Use
- parchment background `#f5f4ed`
- ivory surfaces `#faf9f5`
- terracotta `#c96442` for the highest-signal actions only
- warm darks `#141413`, `#30302e`
- serif for names and major headings
- sans for controls, metadata, and actions

### Avoid
- neon Tinder colors
- cold blue-grays
- dark gamer UI
- giant marketing hero sections before the product
- generic dashboard card grids as the main interaction

### Visual tension
The page background should stay warm and quiet. The drama comes from restaurant photography, not loud chrome.

That contrast creates the right product feeling:
- calm app shell
- vivid card imagery
- warm editorial type

## 10. PWA Strategy

This should behave like a lightweight installed app.

### PWA goals
- launch directly to the discover deck
- persist saved restaurants locally
- preserve filters between visits
- cache the app shell for repeat opens

### Installation value
The install pitch is simple:

**"Keep your Mauritius shortlist on the home screen."**

The PWA matters because this is a repeat-use product. People may install it before a trip or keep it for weekend planning.

## 11. Key UX Decisions

### 1. Make discovery immediate
No landing page. No explanatory hero. The first meaningful screen is the product.

### 2. Let filters support, not lead
Filters narrow the deck. They should not replace the deck.

### 3. Save is the primary positive action
Right swipe should feel warmer and more prominent than skip.

### 4. Keep saved items persistent
Shortlists are the product memory. Losing them breaks trust.

### 5. Use Google Maps as the action endpoint
Dine Mauritius helps users decide. Google Maps helps them navigate.

## 12. Accessibility Notes

- Swipe must have button fallbacks
- Keyboard left/right should mirror skip/save
- Controls need explicit labels
- The app should not disable zoom
- Visible focus styles matter because the interface is not only touch
- Reduced-motion users should still be able to use the deck without card tilt

## 13. Success Metrics for the MVP

### Discovery quality
- cards viewed per session
- save rate per session
- save-to-detail-open rate

### Product usefulness
- repeat visits within 7 days
- saved shortlist size
- Google Maps outbound clicks from saved items

### PWA value
- install rate
- return opens from installed app

## 14. MVP Scope Recommendation

### Ship now
- swipe deck
- saved list
- filter drawer
- restaurant detail modal/sheet
- PWA shell
- local persistence for saved and dismissed restaurants

### Next after launch
- open now as a quick toggle on the main screen
- share shortlist
- map mode for saved items
- distance-aware ranking once user location is introduced
- editorial collections such as "date night", "beach lunch", and "late dinner"

## 15. Product Summary

The best version of **Dine Mauritius** is not "Google Maps but prettier."

It is a faster decision product with a warmer personality:

- one restaurant at a time
- one clear decision at a time
- one saved shortlist that gets better with use

That is the right shape for an amazing MVP.
