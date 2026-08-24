# FundiLink — Architecture Diagrams

Mermaid diagrams for the FundiLink system (Node.js/Express + MongoDB backend, React Native mobile app, React web admin).

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--|| FundiProfile : "has profile (userId)"
    User ||--o{ Job : "posts as customer (customerId)"
    User ||--o{ Job : "works as fundi (fundiId)"
    User ||--o{ Booking : "requests as client (clientId)"
    User ||--o{ Booking : "works as fundi (fundiId)"
    User ||--o{ Booking : "notified about (notifiedFundis)"
    User ||--o{ Review : "writes as customer (customerId)"
    User ||--o{ Review : "receives as fundi (fundiId)"
    User ||--|| Wallet : "owns (userId)"
    User ||--o{ AdminNotification : "receives (relatedId)"
    User ||--o{ Conversation : "participates in"
    User ||--o{ Message : "sends (senderId)"
    Wallet ||--o{ Transaction : "records (walletId)"
    Booking ||--o{ Transaction : "referenced by (relatedBooking)"
    Booking ||--o{ Conversation : "has chat (bookingId)"
    Conversation ||--o{ Message : "contains (conversationId)"
    Job ||--o{ Review : "reviewed via (jobId)"

    User {
        ObjectId _id PK
        string name
        string firstName
        string lastName
        string email UK
        string phone UK
        string password
        string role "customer | fundi | admin"
        boolean phoneVerified
        date dateOfBirth
        string profilePhoto
        string coverPhoto
        string googleId UK
        boolean onboardingComplete
        boolean isOnline
        string socketId
        object location "lat, lng"
        string locationLabel
        string address
        string district
        string country
        number searchRadiusKm
        date createdAt
        date updatedAt
    }

    FundiProfile {
        ObjectId _id PK
        ObjectId userId FK,UK
        string[] skills
        number experience
        number rating "0-5"
        boolean verified
        string verificationStatus "unverified | pending | verified | rejected"
        string[] verificationDocs
        string verificationNotes
        date requestedAt
        date reviewedAt
        string[] portfolioImages
        object currentLocation "lat, lng, updatedAt"
        boolean isAvailable
        date createdAt
        date updatedAt
    }

    Job {
        ObjectId _id PK
        ObjectId customerId FK
        ObjectId fundiId FK
        string description
        string category
        object location "lat, lng"
        string imageUrl
        number quoteAmount
        string status "open | quoted | accepted | in_progress | completed | cancelled"
        string address
        number amount
        date createdAt
        date updatedAt
    }

    Booking {
        ObjectId _id PK
        ObjectId clientId FK
        ObjectId fundiId FK
        string category
        string description
        string address
        object location "lat, lng"
        string status "PENDING | ACCEPTED | ON_THE_WAY | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED | DISPUTED"
        string cancelledBy "CLIENT | FUNDI | SYSTEM"
        string cancellationReason
        string disputeReason
        array notifiedFundis "fundiId, notifiedAt, channels"
        number currentFundiIndex
        date expiresAt
        date acceptedAt
        date onTheWayAt
        date arrivedAt
        date startedAt
        date completedAt
        date cancelledAt
        object fundiLocation "lat, lng, updatedAt"
        string[] images
        number estimatedDuration
        number actualDuration
        number proposedPrice
        string proposedBy "CLIENT | FUNDI"
        boolean clientPriceAgreed
        boolean fundiPriceAgreed
        number agreedPrice
        boolean priceAgreed
        string paymentStatus "unpaid | held | released | refunded"
        date escrowHeldAt
        date escrowReleasedAt
        number escrowAmount
        number clientFee
        date createdAt
        date updatedAt
    }

    Review {
        ObjectId _id PK
        ObjectId fundiId FK
        ObjectId customerId FK
        ObjectId jobId FK
        number rating "1-5"
        string comment
        string[] photoUrls
        string service
        number amount
        date createdAt
        date updatedAt
    }

    Otp {
        ObjectId _id PK
        string phone
        string purpose "register | login"
        string codeHash
        date expiresAt
        number attempts
        date lastSentAt
        date createdAt
        date updatedAt
    }

    Wallet {
        ObjectId _id PK
        ObjectId userId FK,UK
        number balance
        number heldBalance
        string currency
        string status "active | frozen"
        date createdAt
        date updatedAt
    }

    Transaction {
        ObjectId _id PK
        ObjectId walletId FK
        ObjectId userId FK
        string type "deposit | withdrawal | payment | payment_received | refund | transfer_in | transfer_out | escrow_hold | escrow_release | escrow_refund | platform_fee"
        number amount
        string currency
        string reference UK
        string description
        string status "pending | completed | failed | cancelled"
        ObjectId relatedBooking FK
        ObjectId relatedUser FK
        number balanceBefore
        number balanceAfter
        string paymentMethod
        object metadata
        date createdAt
        date updatedAt
    }

    Conversation {
        ObjectId _id PK
        ObjectId[] participants FK
        ObjectId bookingId FK
        string type "booking | support"
        string lastMessage
        ObjectId lastSenderId FK
        date lastMessageAt
        date createdAt
        date updatedAt
    }

    Message {
        ObjectId _id PK
        ObjectId conversationId FK
        ObjectId senderId FK
        string text
        string imageUrl
        boolean read
        date createdAt
    }

    AdminNotification {
        ObjectId _id PK
        string type "verification_approved | verification_rejected | info"
        string message
        ObjectId relatedId FK
        boolean read
        date createdAt
        date updatedAt
    }

    PlatformSettings {
        ObjectId _id PK
        string adminName
        string adminEmail
        string adminRole
        number commissionRate
        number clientFeeRate
        number minJobAmount
        number serviceRadius
        string autoApprovalFundis
        string disputeResolution
        array notifications
        array paymentIntegrations
        date createdAt
        date updatedAt
    }
```

## 2. Context Diagram (DFD Level 0)

```mermaid
le App + Web Admin + Backend API)"]
    end
flowchart LR
    subgraph SYSTEM["FundiLink System"]
        S["FundiLink Platform<br/>(Mobi
    C["Customer / Client<br/>(Mobile App)"]
    F["Fundi / Artisan<br/>(Mobile App)"]
    A["Admin<br/>(Web Dashboard)"]

    C -->|"register/login (email, OTP)"| S
    C -->|"request job / create booking, negotiate price"| S
    C -->|"upload problem photos, review & rate fundi"| S
    C -->|"make payment, chat, live location requests"| S
    S -->|"fundi matches, booking status, live tracking"| C
    S -->|"OTP SMS, booking alerts, price agreement"| C

    F -->|"login, accept/decline booking, submit quote"| S
    F -->|"update status, live location, price negotiation"| S
    F -->|"chat, withdraw wallet earnings"| S
    S -->|"new job request alerts, booking details"| F
    S -->|"SMS notifications, payment released to wallet"| F

    A -->|"manage users, verify fundis, resolve disputes"| S
    A -->|"configure pricing/settings, release escrow"| S
    S -->|"analytics, reports, admin notifications"| A

    GM["Google Maps Geocoding API"]
    S -->|"geocode / reverse-geocode / route"| GM
    GM -->|"coordinates, addresses, ETA"| S

    SMS["EgoSMS Gateway"]
    S -->|"send OTP & notifications"| SMS
    SMS -->|"SMS delivery status"| S

    GROQ["Groq AI API"]
    S -->|"generate SMS copy for events"| GROQ
    GROQ -->|"AI-generated message"| S

    GOOGLE["Google Sign-In (OAuth)"]
    S -->|"social login token"| GOOGLE
    GOOGLE -->|"identity verification"| S

    DB[("MongoDB Database")]
    S <-->|"persist & read data"| DB
```

## 3. Level 1 DFD

```mermaid
flowchart TB
    subgraph P0["FundiLink System"]
        P1["P1<br/>Authentication &<br/>OTP Verification"]
        P2["P2<br/>Booking & Job<br/>Management"]
        P3["P3<br/>Fundi Matching &<br/>Recommendation Engine"]
        P4["P4<br/>Payments, Wallet &<br/>Escrow"]
        P5["P5<br/>Chat & Real-time<br/>Notifications"]
        P6["P6<br/>Reviews &<br/>Ratings"]
        P7["P7<br/>AI Assistant<br/>(Problem Classifier)"]
        P8["P8<br/>Maps &<br/>Location Services"]
        P9["P9<br/>Admin<br/>Management"]
    end

    subgraph DSTORE["Data Stores"]
        D1[("D1 Users")]
        D2[("D2 FundiProfiles")]
        D3[("D3 Jobs")]
        D4[("D4 Bookings")]
        D5[("D5 Otps")]
        D6[("D6 Wallets")]
        D7[("D7 Transactions")]
        D8[("D8 Conversations / Messages")]
        D9[("D9 Reviews")]
        D10[("D10 AdminNotifications")]
        D11[("D11 PlatformSettings")]
    end

    C["Customer"]
    F["Fundi"]
    A["Admin"]

    C -->|"credentials / OTP"| P1
    P1 -->|"verify & issue JWT"| C
    P1 <--> D5
    P1 <--> D1

    C -->|"create job/booking, price, cancel, complete"| P2
    P2 -->|"booking status & details"| C
    F -->|"accept/decline, update status, quote"| P2
    P2 -->|"job request alerts"| F
    P2 <--> D3
    P2 <--> D4

    P2 -->|"new booking + location"| P3
    P3 -->|"ranked fundi shortlist"| P2
    P3 <--> D2
    P3 <--> D1

    C -->|"deposit, pay booking"| P4
    P4 -->|"payment confirmation"| C
    F -->|"withdraw earnings"| P4
    P4 -->|"balance & payouts"| F
    A -->|"release escrow / refund"| P4
    P4 <--> D6
    P4 <--> D7
    P4 <--> D4

    C -->|"send message"| P5
    F -->|"send message / live location"| P5
    P5 -->|"real-time messages, booking alerts, live tracking"| C
    P5 -->|"booking requests, alerts, live tracking"| F
    P5 <--> D8
    P5 <--> D4
    P5 <--> D1

    C -->|"submit rating & review"| P6
    P6 -->|"rating feedback"| C
    P6 <--> D9
    P6 <--> D3

    C -->|"describe problem in natural language"| P7
    P7 -->|"category + confidence"| C
    P7 <--> D1

    C -->|"address / coordinates"| P8
    F -->|"live coordinates"| P8
    P8 -->|"geocoded location, ETA, nearby fundis"| C
    P8 <--> D2
    P8 <--> D4

    A -->|"manage users, verify fundis, resolve disputes, settings"| P9
    P9 -->|"reports, analytics, notifications"| A
    P9 <--> D1
    P9 <--> D2
    P9 <--> D4
    P9 <--> D10
    P9 <--> D11
    P9 <--> D7
```

## 4. Level 2 DFD — Booking & Payment Lifecycle (expansion of P2 + P4)

```mermaid
flowchart TB
    subgraph P2["P2 Booking & Job Management"]
        P21["2.1<br/>Create Booking"]
        P22["2.2<br/>Match & Notify Fundis"]
        P23["2.3<br/>Accept / Decline (Fundi)"]
        P24["2.4<br/>Track Status & Live Location"]
        P25["2.5<br/>Price Negotiation"]
        P26["2.6<br/>Complete Booking"]
    end

    subgraph P4["P4 Payments, Wallet & Escrow"]
        P41["4.1<br/>Escrow Hold Payment"]
        P42["4.2<br/>Apply Platform Fees"]
        P43["4.3<br/>Release Escrow / Refund"]
        P44["4.4<br/>Wallet Credit / Withdrawal"]
    end

    subgraph DSTORE2["Data Stores"]
        D1[("D1 Users")]
        D2[("D2 FundiProfiles")]
        D4[("D4 Bookings")]
        D6[("D6 Wallets")]
        D7[("D7 Transactions")]
        D8[("D8 Conversations")]
    end

    C["Customer"]
    F["Fundi"]

    C -->|"job details, photos, location"| P21
    P21 -->|"new booking (PENDING)"| D4
    P21 --> P22

    P22 -->|"query nearby/category fundis"| D2
    P22 -->|"ranked shortlist (recommendation engine)"| D1
    P22 -->|"booking_request alert (socket + SMS)"| F
    P22 -->|"track notified fundis, expiry timer"| D4

    F -->|"accept_booking"| P23
    P23 -->|"claim booking, ACCEPTED, clear expiry"| D4
    P23 -->|"booking_accepted + conversation created"| C
    P23 -->|"booking_declined -> next fundi"| P22
    P23 --> D8

    F -->|"ON_THE_WAY / ARRIVED / IN_PROGRESS status"| P24
    P24 -->|"status updates"| D4
    P24 -->|"live fundi location push"| C
    P24 -->|"update fundi currentLocation"| D2

    C -->|"propose price"| P25
    F -->|"counter price / accept"| P25
    P25 -->|"price agreement state"| D4
    P25 -->|"price agreed event"| C
    P25 -->|"price agreed event"| F

    C -->|"confirm job complete"| P26
    P26 -->|"COMPLETED + actual duration"| D4
    P26 --> P41

    P41 -->|"hold agreed price in escrow"| D6
    P41 -->|"escrow_hold transaction"| D7
    P41 -->|"paymentStatus = held"| D4

    P41 --> P42
    P42 -->|"commissionRate / clientFeeRate"| D4
    P42 -->|"platform_fee + fundi payout transactions"| D7

    A["Admin"] -->|"resolve dispute / manual release"| P43
    P43 -->|"escrow_release / escrow_refund"| D7
    P43 -->|"paymentStatus = released / refunded"| D4

    P43 --> P44
    P44 -->|"credit fundi wallet (net of commission)"| D6
    P44 -->|"payment_received transaction"| D7
    F -->|"withdraw earnings"| P44
    P44 -->|"withdrawal transaction"| D7
    P44 -->|"update wallet balance"| D6
```

## 5. UML Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String firstName
        +String lastName
        +String email
        +String phone
        +String password
        +String role
        +Boolean phoneVerified
        +Date dateOfBirth
        +String profilePhoto
        +String coverPhoto
        +String googleId
        +Boolean onboardingComplete
        +Boolean isOnline
        +String socketId
        +Location location
        +String address
        +String district
        +String country
        +Number searchRadiusKm
        +Date createdAt
        +Date updatedAt
    }

    class FundiProfile {
        +ObjectId userId
        +String[] skills
        +Number experience
        +Number rating
        +Boolean verified
        +String verificationStatus
        +String[] verificationDocs
        +String verificationNotes
        +String[] portfolioImages
        +GeoPoint currentLocation
        +Boolean isAvailable
    }

    class Job {
        +ObjectId customerId
        +ObjectId fundiId
        +String description
        +String category
        +GeoPoint location
        +String imageUrl
        +Number quoteAmount
        +String status
        +String address
        +Number amount
        +Date createdAt
        +Date updatedAt
    }

    class Booking {
        +ObjectId clientId
        +ObjectId fundiId
        +String category
        +String description
        +String address
        +GeoPoint location
        +String status
        +String cancelledBy
        +String disputeReason
        +ObjectId[] notifiedFundis
        +Date expiresAt
        +Date acceptedAt
        +GeoPoint fundiLocation
        +String[] images
        +Number proposedPrice
        +String proposedBy
        +Boolean clientPriceAgreed
        +Boolean fundiPriceAgreed
        +Number agreedPrice
        +Boolean priceAgreed
        +String paymentStatus
        +Number escrowAmount
        +Number clientFee
    }

    class Review {
        +ObjectId fundiId
        +ObjectId customerId
        +ObjectId jobId
        +Number rating
        +String comment
        +String[] photoUrls
        +String service
        +Number amount
    }

    class Otp {
        +String phone
        +String purpose
        +String codeHash
        +Date expiresAt
        +Number attempts
    }

    class Wallet {
        +ObjectId userId
        +Number balance
        +Number heldBalance
        +String currency
        +String status
    }

    class Transaction {
        +ObjectId walletId
        +ObjectId userId
        +String type
        +Number amount
        +String currency
        +String reference
        +String status
        +ObjectId relatedBooking
        +Number balanceBefore
        +Number balanceAfter
        +String paymentMethod
    }

    class Conversation {
        +ObjectId[] participants
        +ObjectId bookingId
        +String type
        +String lastMessage
        +ObjectId lastSenderId
        +Date lastMessageAt
    }

    class Message {
        +ObjectId conversationId
        +ObjectId senderId
        +String text
        +String imageUrl
        +Boolean read
        +Date createdAt
    }

    class AdminNotification {
        +String type
        +String message
        +ObjectId relatedId
        +Boolean read
    }

    class PlatformSettings {
        +Number commissionRate
        +Number clientFeeRate
        +Number minJobAmount
        +Number serviceRadius
        +String disputeResolution
    }

    class RecommendationEngine {
        +Float score
        +calculateScore(rating, distance)
        +rankFundis(fundis, coords)
    }

    class AIClassifier {
        +String classify(text)
        +Float confidence
    }

    User "1" --> "0..1" FundiProfile : has
    User "1" --> "0..*" Job : posts (customer)
    User "1" --> "0..*" Job : works on (fundi)
    User "1" --> "0..*" Booking : requests (client)
    User "1" --> "0..*" Booking : serves (fundi)
    User "1" --> "0..*" Review : writes
    User "1" --> "1" Wallet : owns
    User "1" --> "0..*" Conversation : participates in
    User "1" --> "0..*" Message : sends
    Booking "1" --> "0..*" Transaction : references
    Wallet "1" --> "0..*" Transaction : records
    Booking "1" --> "0..*" Conversation : has chat
    Conversation "1" --> "0..*" Message : contains
    Job "1" --> "0..*" Review : reviewed in
    User "1" --> "0..*" AdminNotification : receives
    RecommendationEngine ..> FundiProfile : ranks
    RecommendationEngine ..> Booking : uses location
    AIClassifier ..> Job : suggests category
    Transaction ..> Booking : escrow lifecycle
    Booking --> PlatformSettings : uses fees
    Wallet ..> Transaction : generates
```
