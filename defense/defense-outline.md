# FundiLink — Project Defense Deck Outline

## Slide 1 — Title
- **FundiLink**
- Connecting Ugandans to trusted local artisans (Fundis) through an AI-assisted, location-based mobile marketplace
- (Your Name) · Supervisor: (Name) · Course / Department
- Date

## Slide 2 — Agenda
1. Introduction & Problem
2. Objectives
3. Conceptual Framework
4. System Architecture
5. Core Algorithms
6. Implementation & Tech Stack
7. Demonstration
8. Testing
9. Limitations & Future Work
10. Conclusion

## Slide 3 — Introduction / Problem Statement
- Ugandans struggle to find reliable artisans (plumbers, electricians, carpenters, masons).
- Word-of-mouth is slow, unverifiable, and geographically limited to the neighbourhood.
- No way to compare reviews, quotes, proximity, or track a job once started.
- **Result:** wasted time, unpredictable costs, no accountability, no trust history.

## Slide 4 — Objectives
**Main objective:** Develop FundiLink, a mobile platform that connects customers to verified local fundis with transparent pricing and reviews.
**Specific objectives:**
1. Build a mobile app (React Native/Expo) for both customers and fundis.
2. Design a REST API backend (Node.js/Express) with secure auth (JWT + OTP).
3. Help customers **discover** nearby, highly-rated fundis through a ranked, map-based browser (customer keeps the final choice).
4. (Assist, not core) Use a lightweight AI/NLP assistant to guide customers to the right trade category when they are unsure what they need.
5. Support the full job lifecycle: quote → accept → work → complete → review.
6. Maintain a trust layer driven by reviews that feeds back into future discovery rankings.

## Slide 5a — Conceptual Framework: The Core Discovery Loop (primary)

**What the app ACTUALLY does:** browsing first, matching/ranking as an aid, AI as a helper — **not** an auto-matching AI engine.

### Actors
- **Customer** — sets a location, browses, picks a fundi, reviews.
- **Fundi** — turns online, appears in the ranked list, quotes, completes work, builds reputation.
- **System** — provides a ranked, map-based browse list + manages the job; AI only assists.

### Primary flow (the happy path users actually follow)
1. Customer sets their location → app counts nearby fundis.
2. Customer picks a **category** (Plumber, Electrician, Carpenter, Painter) from the home tiles, or searches/filters (available, verified, ≤5 km, ★4.5+).
3. System lists **nearby fundis, ranked** by `Score = 0.6 × Rating + 0.4 × Proximity` on a map + list.
4. Customer **compares profiles and picks a fundi** — the system never assigns one.
5. Job is created for the **chosen fundi** → quote/negotiate → accept → in-progress → completed.
6. Both parties **review**; ratings feed back into step 3.

### Position of AI (be honest about its role)
- AI is a **concierge, not a dispatcher**: the in-app support assistant identifies the trade from a description or photo and **points the customer to the right Browse category** — browsing takes over from there.
- It is NOT the main discovery mechanism; the primary path is browse/search/filter by location + category.

## Slide 5b — Conceptual Framework: Rank, Choose, Trust (supporting model)

### Three interlocking sub-models
| Sub-model | What it does | Primary inputs |
|---|---|---|
| **Discovery & Ranking** | Orders the browse list; ranking aid only, never assigns | Category, customer location, fundi rating |
| **Transaction** | Manages the job once the customer picks a fundi | Job state, quotes, acceptance, completion |
| **Trust** | Builds reputation history between jobs | Reviews, ratings, completed jobs |

### Closed feedback loop (key idea)
```
Rating/Review ──► Ranking Score ──► Better Position in Browse List ──► Chosen & Completed ──► New Review
```
The system self-improves: good fundis rise, unreliable ones fall.

### Key phrase for the defense
> "The engine ranks; the customer chooses. AI helps them find the right category — it never decides the fundi."

## Slide 6 — System Architecture (3 layers)

| Layer | Technology | What lives there |
|---|---|---|
| **Presentation** | React Native (Expo) mobile app | Customer & Fundi screens, maps, chat, reviews |
| **Application / API** | Node.js + Express (MVC) | Auth, jobs, bookings, wallets, geocoding, middlewares |
| **Data & Services** | MongoDB, Google Maps, EgoSMS, AI classifier | Users, jobs, reviews, wallets; location, SMS/OTP, NLP |

Monorepo structure: `backend/` (MVC), `mobile/` (app), `web/` (later).

## Slide 7 — Core Algorithms

### 1. Recommendation / Ranking Engine
`Score = 0.6 × Rating + 0.4 × Proximity`
- `Rating`: average fundi rating, 0–5
- `Proximity`: distance normalized to 0–5 (closer = higher)
- Ranks the browse list and returns the **Top 5**.
- The customer still browses the map/list and picks the fundi — the engine only orders the candidates.

### 2. AI/NLP Assistant (supporting role)
```
User describes a problem / uploads a photo
        │
        ▼
Bot identifies the trade category (sink/leak → plumbing; socket/wire → electrical)
        │
        ▼
Guides the user to Browse → that category  (browsing takes over from here)
```
Positioning: AI is a **concierge** — it helps a user who is unsure what they need, then hands off to the browse flow. It never selects a fundi and is not the main discovery path.

### 3. Geospatial Routing
Haversine distance + Google Geocoding (address ↔ coordinates, routes, ETA).

## Slide 8 — Implementation / Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo | Cross-platform, fast iteration, OTA updates |
| Backend | Node.js + Express (MVC) | Lightweight, async, large ecosystem |
| Database | MongoDB | Flexible schema for jobs/users/reviews |
| Auth | JWT + OTP (EgoSMS) | Secure sessions + local phone verification |
| Maps | react-native-maps + Google Geocoding | Nearby fundis, address ↔ coords |
| AI | Support assistant (keyword/LLM + photo analysis) | Helps unsure users find the right category; not the core path |
| Hosting | Render + EAS | Cheap deployment, Android build/updates |

Key implemented REST APIs: auth (register/login/OTP), maps (geocode/reverse/nearby/route), users, fundis, jobs, AI classify, reviews.

## Slide 9 — Demonstration (Live / Screen recording)
1. Register/login via OTP; set location.
2. Pick a category tile (e.g. **Plumber**) → map/list shows nearby plumbers ranked by score; search + filters available.
3. (Optional AI assist) Ask the assistant about a problem — e.g. **"my sink is leaking"** — it points the user to Browse → Plumber.
4. Customer browses profiles & picks a plumber → job/quote/negotiation → accepts.
5. Job progresses; on completion both parties review.
6. Fundi's rating updates → improves position next time.

## Slide 10 — Testing

| Level | Approach |
|---|---|
| Unit | Classifier accuracy, recommendation score ordering, OTP logic |
| API | Postman/scripted integration tests for all endpoints |
| Mobile | Manual device tests (Android), Expo Go |
| E2E | Register → find → quote → complete → review happy path |
| Edge cases | Low-confidence classification, no fundis in radius, expired OTP |

Seed data: customers & fundis (e.g., amina@example.com, peter@fundi.com).

## Slide 11 — Limitations & Future Work
**Limitations**
- Rule-based classifier may misclassify unusual phrasing.
- Prototype scope: single currency, limited categories, not yet in production for wallets.
- Trust relies on motivated users posting reviews.

**Future work**
- Fine-tuned/LLM-based classification; multi-language (Luganda, Swahili).
- In-app escrow payments with real mobile money integration (MTN MoMo, Airtel Money).
- More categories, fundi credential/background verification.
- Offline mode, admin analytics dashboard, ratings weightings by recency.

## Slide 12 — Conclusion
- FundiLink proves the concept end-to-end: an AI-assisted, location-based, trust-driven marketplace for artisan services.
- Validates the closed-loop framework: better reviews → better rankings → better outcomes.
- Solid foundation (architecture + APIs + app) for scaling into a production marketplace in Uganda.
- **Thanks — Questions?**