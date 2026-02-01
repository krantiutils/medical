# PRD: Swasthya - Nepal Healthcare Platform

> Comprehensive healthcare directory, clinic/hospital management, pharmacy POS, and telemedicine platform for Nepal.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Platform Overview](#platform-overview)
3. [Design System & UI/UX](#design-system--uiux)
4. [Phase 1: Healthcare Directory (MVP)](#phase-1-healthcare-directory-mvp)
5. [Phase 2: Clinic Management System](#phase-2-clinic-management-system)
6. [Phase 3: Pharmacy Management System](#phase-3-pharmacy-management-system)
7. [Phase 4: Hospital & Advanced Features](#phase-4-hospital--advanced-features)
8. [Phase 5: Telemedicine](#phase-5-telemedicine)
9. [Technical Architecture](#technical-architecture)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Offline-First Architecture](#offline-first-architecture)
12. [Mobile Apps Strategy](#mobile-apps-strategy)
13. [SEO Strategy](#seo-strategy)
14. [Data Sources & Integration](#data-sources--integration)
15. [Testing & CI/CD Strategy](#testing--cicd-strategy)
16. [Open Questions](#open-questions)

---

## Vision & Goals

### Vision
Build Nepal's most comprehensive healthcare platform that:
- Has a searchable profile page for **every** healthcare professional (doctors, dentists, pharmacists)
- Provides clinic/hospital/pharmacy management software as SaaS
- Enables telemedicine for remote consultations
- Prioritizes SEO so Google indexes all 40,000+ practitioner pages

### Primary Goals
1. **Data Completeness**: All NMC doctors (38k+), NDA dentists (1k+), NPC pharmacists (500+) with auto-generated SEO pages
2. **Verification Flow**: Professionals claim profiles, verify with NMC/NDA/NPC + Govt ID
3. **Clinic SaaS**: Patient flow, scheduling, billing, inventory for clinics
4. **Pharmacy SaaS**: POS, inventory, expiry management, supplier tracking
5. **Monetization**: Free for patients, sell software subscriptions to clinics/pharmacies

### Success Metrics
- 40,000+ indexed pages on Google within 3 months
- 100+ claimed/verified professional profiles in month 1
- 10+ clinic/pharmacy software subscriptions in month 3
- <2s page load time for all public pages

---

## Platform Overview

### User Types

| User Type | Description | Pricing |
|-----------|-------------|---------|
| **Patient/Public** | Search doctors, book appointments, reviews | Free |
| **Doctor/Dentist/Pharmacist** | Claim profile, manage presence, respond to reviews | Free |
| **Clinic (Small)** | 1-5 doctors, basic scheduling, billing | Subscription |
| **Clinic (Medium)** | 5-15 doctors, lab integration, inventory | Subscription |
| **Hospital** | Full HMS, wards, OT, inpatient | Enterprise |
| **Pharmacy** | POS, inventory, supplier management | Subscription |

### Core Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                    SWASTHYA PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│  PUBLIC LAYER (SEO-Optimized)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Doctor   │ │ Dentist  │ │Pharmacist│ │ Clinic   │           │
│  │ Pages    │ │ Pages    │ │ Pages    │ │ Pages    │           │
│  │ (38k+)   │ │ (1k+)    │ │ (500+)   │ │ (TBD)    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  PROFESSIONAL LAYER                                             │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Profile Management │ Verification │ Analytics    │          │
│  │ Reviews Response   │ Appointments │ Affiliations │          │
│  └──────────────────────────────────────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  CLINIC/HOSPITAL MANAGEMENT                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Patient │ │Schedule│ │Billing │ │  EMR   │ │  Lab   │       │
│  │ Flow   │ │        │ │        │ │        │ │        │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  PHARMACY MANAGEMENT                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  POS   │ │Inventory│ │ Expiry │ │Supplier│ │ Credit │       │
│  │        │ │         │ │Tracking│ │  Mgmt  │ │ (Khata)│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  TELEMEDICINE                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │Video Consult │ │E-Prescription│ │ Instant Chat │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design System & UI/UX

> **Reference**: See `tasks/design-system.md` for complete specifications.

### Design Philosophy: Bauhaus Modernism

**NOT another generic Bootstrap/Tailwind UI.** Every element is deliberately composed with geometric precision.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Geometric Purity** | Circles, squares, triangles only |
| **Hard Shadows** | 4px/8px offset, never blurred |
| **Color Blocking** | Sections use solid primary colors |
| **Thick Borders** | 2px/4px black borders |
| **Typography Hierarchy** | Clear visual distinction between levels |
| **Functional Honesty** | No gradients, no subtle effects |

### Color Palette

```
Background:     #F0F0F0 (Off-white)
Foreground:     #121212 (Stark black)
Primary Red:    #D02020 (CTAs, Dentists)
Primary Blue:   #1040C0 (Secondary, Doctors)
Primary Yellow: #F0C020 (Accents, Pharmacists)
Verified:       #2E7D32 (Success, badges)
```

### Typography (Outfit Font)

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 6xl-8xl | 900 | Hero headlines |
| H1 | 4xl | 700 | Section titles |
| H2 | 2xl | 700 | Card titles |
| Body | base | 500 | Content |
| Label | xs | 700 | Categories, meta |

### UI/UX Requirements (Mandatory)

**Every page/component MUST address:**

1. **Typography Hierarchy**
   - Clear visual distinction between title, subtitle, body
   - Different sizes AND weights, not just size

2. **Icon Treatment**
   - Icons in colored containers OR different color than text
   - Never same color as adjacent text

3. **Button Hierarchy**
   - Primary (Red): Main action
   - Secondary (Blue): Important secondary
   - Outline (White): Clearly clickable tertiary
   - Ghost: Minimal actions

4. **White Space & Dividers**
   - Thick dividers between sections
   - Lighter dividers within cards
   - "Show More" for long content

5. **Contrast & Accessibility**
   - Solid backgrounds for badges on images
   - ≥4.5:1 contrast ratio
   - Focus states visible

6. **Background**
   - Off-white (#F0F0F0) not pure white
   - Cards stand out with white + shadow

### Component Checklist

Before shipping any component:

- [ ] Typography hierarchy is clear (not "wall of text")
- [ ] Icons have distinct color/container
- [ ] Buttons have clear clickability
- [ ] Sections have dividers
- [ ] Badges have sufficient contrast
- [ ] Shadows are hard offset (not blurred)
- [ ] Borders are 2-4px black
- [ ] No intermediate border-radius
- [ ] Responsive across breakpoints
- [ ] Focus states work

---

## Phase 1: Healthcare Directory (MVP)

**Goal**: SEO-optimized directory with auto-populated profiles from scraped data

**Timeline**: 4-6 weeks

### 1.1 Data Models

#### Professional (Base)
```
Professional
├── id (UUID)
├── type (doctor | dentist | pharmacist)
├── registration_number (NMC/NDA/NPC number)
├── full_name
├── photo_url
├── gender
├── address
├── degree / qualifications
├── specialties[]
├── registration_date
├── remarks (license status, disciplinary)
├── verified (boolean)
├── claimed_by (User FK, nullable)
├── slug (URL-friendly: dr-ram-sharma-12345)
├── created_at
├── updated_at
├── last_synced_at (from scraper)
└── meta (JSON: extra scraped fields)
```

#### Doctor (extends Professional)
```
Doctor
├── nmc_number
├── degree
├── specialties[]
├── hospital_affiliations[]
└── consultation_fee (if claimed)
```

#### Dentist (extends Professional)
```
Dentist
├── nmc_number
├── nda_id
├── location
└── specialties[]
```

#### Pharmacist (extends Professional)
```
Pharmacist
├── reg_no (G1234 / A1234)
├── category (Graduate | Assistant)
├── reg_date
└── pharmacy_affiliations[]
```

#### Clinic/Hospital
```
Clinic
├── id (UUID)
├── name
├── slug
├── type (clinic | polyclinic | hospital | pharmacy)
├── address
├── location (lat, lng) - from Google Maps/OSM
├── phone
├── email
├── website
├── logo_url
├── photos[]
├── services[]
├── timings (JSON)
├── doctors[] (many-to-many)
├── verified (boolean)
├── claimed_by (User FK)
├── google_place_id
├── osm_id
└── meta (JSON)
```

### 1.2 User Stories - Phase 1

#### US-1.1: Auto-populate professionals from scraped data
**Description**: As the system, I need to import all scraped data into the database so professionals have profiles without manual entry.

**Acceptance Criteria**:
- [ ] Import script reads CSV files (nmc_doctors.csv, nda_dentists.csv, npc_pharmacists.csv)
- [ ] Creates Professional records with appropriate type
- [ ] Generates URL-friendly slugs (dr-name-nmcnumber)
- [ ] Handles duplicates (upsert on registration_number)
- [ ] Imports photos to object storage (S3/Cloudflare R2)
- [ ] Logs import statistics
- [ ] Typecheck passes

#### US-1.2: Generate individual SEO pages for each professional
**Description**: As a patient, I want to find doctors by Googling their name so I can see their verified information.

**Acceptance Criteria**:
- [ ] Each professional has a unique URL: /doctor/dr-ram-sharma-12345
- [ ] Page includes: name, photo, qualifications, registration number, verification status
- [ ] Meta tags: title, description, OpenGraph, Twitter cards
- [ ] Structured data (JSON-LD): Person schema with medical credentials
- [ ] Page loads in <2s
- [ ] Mobile responsive
- [ ] Typecheck passes

#### US-1.3: Generate sitemap for all professionals
**Description**: As the system, I need to generate sitemaps so Google can discover all 40,000+ pages.

**Acceptance Criteria**:
- [ ] Generate sitemap index at /sitemap.xml
- [ ] Split into multiple sitemaps (max 50,000 URLs each)
- [ ] Sitemaps for: /sitemap-doctors.xml, /sitemap-dentists.xml, /sitemap-pharmacists.xml
- [ ] Include lastmod, changefreq, priority
- [ ] Auto-regenerate daily via cron/scheduled job
- [ ] Submit to Google Search Console
- [ ] Typecheck passes

#### US-1.4: Search professionals
**Description**: As a patient, I want to search for doctors by name, specialty, or location.

**Acceptance Criteria**:
- [ ] Search endpoint: GET /api/search?q=cardiologist+kathmandu
- [ ] Full-text search on name, degree, specialties, address
- [ ] Filters: type (doctor/dentist/pharmacist), specialty, location, verified
- [ ] Pagination with cursor
- [ ] Results include relevance score
- [ ] Search suggestions/autocomplete
- [ ] Typecheck passes

#### US-1.5: Professional claims their profile
**Description**: As a doctor, I want to claim my auto-generated profile so I can manage it.

**Acceptance Criteria**:
- [ ] "Claim this profile" button on unclaimed profiles
- [ ] User must register/login
- [ ] Search by NMC/NDA/NPC number (fastest match)
- [ ] Verification request created (pending admin review)
- [ ] User can upload: Government ID, NMC certificate
- [ ] Admin dashboard to approve/reject claims
- [ ] Email notifications on status change
- [ ] Typecheck passes

#### US-1.6: Professional edits their profile (after verification)
**Description**: As a verified doctor, I want to add more details to my profile.

**Acceptance Criteria**:
- [ ] Edit: bio, consultation fee, languages, education details
- [ ] Add: clinic affiliations, available timings
- [ ] Upload: additional photos, certificates
- [ ] Changes reflected immediately (no re-verification needed for non-critical fields)
- [ ] Audit log of all changes
- [ ] Typecheck passes

#### US-1.7: Browse by specialty/location
**Description**: As a patient, I want to browse doctors by specialty and city.

**Acceptance Criteria**:
- [ ] Category pages: /doctors/cardiologist, /doctors/kathmandu
- [ ] Combination: /doctors/cardiologist/kathmandu
- [ ] Each category page is SEO optimized with unique content
- [ ] Pagination
- [ ] Filters and sorting (rating, distance, fee)
- [ ] Typecheck passes

#### US-1.8: Health content/blog (Compass equivalent)
**Description**: As a patient, I want to read health articles to learn about conditions.

**Acceptance Criteria**:
- [ ] Blog/article system with categories
- [ ] SEO optimized article pages
- [ ] Related doctors shown on articles
- [ ] Admin CMS to create/edit articles
- [ ] Typecheck passes

### 1.3 Functional Requirements - Phase 1

| ID | Requirement |
|----|-------------|
| FR-1.1 | System shall import professionals from CSV with upsert logic |
| FR-1.2 | Each professional shall have a unique, SEO-friendly URL |
| FR-1.3 | Professional pages shall include JSON-LD structured data |
| FR-1.4 | System shall generate XML sitemaps split by entity type |
| FR-1.5 | Search shall support full-text queries with filters |
| FR-1.6 | Users shall register with email/phone + password or OAuth |
| FR-1.7 | Professionals shall claim profiles via registration number lookup |
| FR-1.8 | Admin shall approve/reject profile claims |
| FR-1.9 | Verified professionals shall edit non-critical profile fields |
| FR-1.10 | System shall track all profile changes in audit log |

### 1.4 Non-Goals - Phase 1
- Online booking (Phase 2)
- Reviews and ratings (Phase 2)
- Clinic management features (Phase 2)
- Telemedicine (Phase 5)
- Native mobile apps (Phase 2+, PWA in Phase 1)
- Payment integration (Phase 2+)

---

## Phase 2: Clinic Management System

**Goal**: Patient flow, scheduling, and basic clinic operations

**Timeline**: 6-8 weeks after Phase 1

### 2.1 Data Models

#### Patient
```
Patient
├── id (UUID)
├── clinic_id (FK) - patients belong to clinics
├── patient_number (clinic-specific: PT-0001)
├── full_name
├── phone (primary identifier)
├── email
├── date_of_birth
├── gender
├── blood_group
├── address
├── emergency_contact
├── allergies[]
├── medical_history (JSON)
├── insurance_info (JSON)
├── photo_url
├── created_at
└── updated_at
```

#### Appointment
```
Appointment
├── id (UUID)
├── clinic_id (FK)
├── patient_id (FK)
├── doctor_id (FK)
├── appointment_date
├── time_slot_start
├── time_slot_end
├── status (scheduled | checked_in | in_progress | completed | cancelled | no_show)
├── type (new | follow_up | emergency)
├── chief_complaint
├── token_number (for queue)
├── source (online | walk_in | phone)
├── notes
├── created_at
└── updated_at
```

#### Schedule
```
DoctorSchedule
├── id (UUID)
├── clinic_id (FK)
├── doctor_id (FK)
├── day_of_week (0-6)
├── start_time
├── end_time
├── slot_duration_minutes (15, 20, 30)
├── max_patients_per_slot
├── is_active
└── effective_from / effective_to
```

#### Leave/Unavailability
```
DoctorLeave
├── id (UUID)
├── doctor_id (FK)
├── clinic_id (FK)
├── leave_date
├── start_time (nullable for full day)
├── end_time
├── reason
└── created_at
```

### 2.2 User Stories - Phase 2

#### US-2.1: Clinic registers on platform
**Description**: As a clinic owner, I want to register my clinic so I can manage appointments.

**Acceptance Criteria**:
- [ ] Clinic registration form: name, address, type, phone, email
- [ ] Upload logo and photos
- [ ] Add doctors (link existing verified doctors or invite)
- [ ] Set operating hours
- [ ] Verification process (business registration docs)
- [ ] Typecheck passes

#### US-2.2: Configure doctor schedules
**Description**: As a clinic admin, I want to set up doctor schedules so patients can book.

**Acceptance Criteria**:
- [ ] Weekly schedule grid for each doctor
- [ ] Set: available days, times, slot duration
- [ ] Override for specific dates (holidays, special hours)
- [ ] Bulk schedule management
- [ ] Typecheck passes

#### US-2.3: Patient books appointment online
**Description**: As a patient, I want to book an appointment online.

**Acceptance Criteria**:
- [ ] Select clinic -> doctor -> date -> available slot
- [ ] Enter: name, phone, reason for visit
- [ ] SMS/email confirmation
- [ ] Add to calendar (ICS download)
- [ ] Cancel/reschedule option
- [ ] Typecheck passes

#### US-2.4: Walk-in patient registration
**Description**: As a receptionist, I want to register walk-in patients quickly.

**Acceptance Criteria**:
- [ ] Quick registration: name, phone, reason
- [ ] Auto-assign token number
- [ ] Search existing patients by phone
- [ ] Print token slip
- [ ] Typecheck passes

#### US-2.5: Patient queue management
**Description**: As a receptionist, I want to manage the patient queue.

**Acceptance Criteria**:
- [ ] Live queue view per doctor
- [ ] Check-in patient (scheduled or walk-in)
- [ ] Call next patient
- [ ] Mark as: in consultation, completed, no-show
- [ ] Estimated wait time display
- [ ] Queue display screen (for waiting room TV)
- [ ] Typecheck passes

#### US-2.6: Patient reviews clinic/doctor
**Description**: As a patient, I want to leave a review after my visit.

**Acceptance Criteria**:
- [ ] Review prompt after appointment completed
- [ ] Rating: 1-5 stars
- [ ] Written review (optional)
- [ ] Categories: wait time, doctor behavior, cleanliness, value
- [ ] Moderation queue for inappropriate content
- [ ] Doctor can respond to reviews
- [ ] Typecheck passes

#### US-2.7: Manage doctor leaves/unavailability
**Description**: As a clinic admin, I want to mark when doctors are unavailable.

**Acceptance Criteria**:
- [ ] Mark full day or partial day leave
- [ ] Auto-disable booking for those slots
- [ ] Notify patients with existing bookings
- [ ] Reschedule affected appointments
- [ ] Typecheck passes

#### US-2.8: Basic billing
**Description**: As a receptionist, I want to generate bills for patients.

**Acceptance Criteria**:
- [ ] Add services/procedures with prices
- [ ] Generate invoice
- [ ] Payment modes: cash, card, eSewa, Khalti
- [ ] Print receipt
- [ ] Daily/monthly billing reports
- [ ] Typecheck passes

### 2.3 Functional Requirements - Phase 2

| ID | Requirement |
|----|-------------|
| FR-2.1 | Clinics shall register with business details and verification |
| FR-2.2 | Doctors shall be linked to clinics with schedules |
| FR-2.3 | Patients shall book appointments via web |
| FR-2.4 | System shall prevent double-booking |
| FR-2.5 | Walk-in patients shall get token numbers |
| FR-2.6 | Queue shall update in real-time |
| FR-2.7 | Bills shall be generated with itemized services |
| FR-2.8 | Reviews shall require completed appointments |
| FR-2.9 | Leave management shall auto-block affected slots |

---

## Phase 3: Pharmacy Management System

**Goal**: POS, inventory, expiry tracking, supplier management for pharmacies

**Timeline**: 6-8 weeks after Phase 2

### 3.1 Data Models

#### Product (Medicine/Item)
```
Product
├── id (UUID)
├── pharmacy_id (FK)
├── name
├── generic_name
├── manufacturer
├── category (tablet | capsule | syrup | injection | etc)
├── schedule (OTC | H | H1 | X)
├── unit (strip | bottle | vial | piece)
├── units_per_pack
├── hsn_code
├── gst_rate
├── is_active
└── created_at
```

#### Inventory Batch
```
InventoryBatch
├── id (UUID)
├── pharmacy_id (FK)
├── product_id (FK)
├── batch_number
├── expiry_date
├── manufacturing_date
├── quantity
├── purchase_price
├── selling_price (MRP)
├── supplier_id (FK)
├── purchase_invoice_id (FK)
├── location (shelf/rack)
├── created_at
└── updated_at
```

#### Sale
```
Sale
├── id (UUID)
├── pharmacy_id (FK)
├── invoice_number
├── customer_name
├── customer_phone
├── prescription_id (FK, nullable)
├── items[] (SaleItem)
├── subtotal
├── discount
├── tax
├── total
├── payment_mode (cash | card | credit | esewa | khalti)
├── is_credit (boolean)
├── credit_balance (if credit sale)
├── created_by (User FK)
├── created_at
└── voided_at (nullable, for returns)
```

#### Supplier
```
Supplier
├── id (UUID)
├── pharmacy_id (FK)
├── name
├── contact_person
├── phone
├── email
├── address
├── pan_number
├── payment_terms (days)
├── credit_limit
├── current_balance
└── is_active
```

#### Credit Account (Khata)
```
CreditAccount
├── id (UUID)
├── pharmacy_id (FK)
├── customer_name
├── customer_phone
├── credit_limit
├── current_balance
├── transactions[] (CreditTransaction)
└── created_at
```

### 3.2 User Stories - Phase 3

#### US-3.1: Pharmacy POS - Quick billing
**Description**: As a pharmacist, I want to bill customers quickly using barcode or search.

**Acceptance Criteria**:
- [ ] Barcode scanner input
- [ ] Search by product name or generic name
- [ ] Auto-select batch with nearest expiry (FEFO)
- [ ] Show available quantity
- [ ] Add quantity, apply discount
- [ ] Multiple payment modes
- [ ] Print receipt (thermal printer)
- [ ] Typecheck passes

#### US-3.2: Inventory management
**Description**: As a pharmacy owner, I want to track stock levels.

**Acceptance Criteria**:
- [ ] View current stock with batch details
- [ ] Low stock alerts (configurable threshold)
- [ ] Stock value reports
- [ ] Stock adjustment (damage, loss)
- [ ] Physical stock count/audit
- [ ] Typecheck passes

#### US-3.3: Expiry tracking and alerts
**Description**: As a pharmacist, I want alerts for medicines expiring soon.

**Acceptance Criteria**:
- [ ] Dashboard widget: expiring in 30/60/90 days
- [ ] Expiry report for supplier returns
- [ ] Auto-exclude expired batches from sale
- [ ] Email/SMS alerts for high-value expiring items
- [ ] Mark items as returned to supplier
- [ ] Typecheck passes

#### US-3.4: Purchase and supplier management
**Description**: As a pharmacy owner, I want to track purchases from suppliers.

**Acceptance Criteria**:
- [ ] Add suppliers with contact and payment terms
- [ ] Create purchase orders
- [ ] Receive stock (update inventory)
- [ ] Track supplier invoices
- [ ] Supplier payment tracking
- [ ] Purchase reports
- [ ] Typecheck passes

#### US-3.5: Credit sales (Khata)
**Description**: As a pharmacist, I want to sell on credit to regular customers.

**Acceptance Criteria**:
- [ ] Create credit customer accounts
- [ ] Set credit limit per customer
- [ ] Mark sale as credit
- [ ] View outstanding balance
- [ ] Record payments against credit
- [ ] Credit statement/ledger per customer
- [ ] Typecheck passes

#### US-3.6: GST/VAT compliance
**Description**: As a pharmacy owner, I want GST-compliant invoices and reports.

**Acceptance Criteria**:
- [ ] GST-compliant invoice format
- [ ] Tax breakup on invoices
- [ ] GST reports (monthly, quarterly)
- [ ] Export for tax filing
- [ ] IRD integration (future)
- [ ] Typecheck passes

#### US-3.7: Reports and analytics
**Description**: As a pharmacy owner, I want business reports.

**Acceptance Criteria**:
- [ ] Daily sales summary
- [ ] Product-wise sales report
- [ ] Profit margin report
- [ ] Slow-moving items
- [ ] Top selling items
- [ ] Cash flow report
- [ ] Typecheck passes

### 3.3 Functional Requirements - Phase 3

| ID | Requirement |
|----|-------------|
| FR-3.1 | POS shall support barcode and search-based billing |
| FR-3.2 | System shall follow FEFO (First Expiry First Out) for sales |
| FR-3.3 | Inventory shall track batch-wise stock with expiry |
| FR-3.4 | System shall alert for low stock and near-expiry items |
| FR-3.5 | Purchases shall update inventory automatically |
| FR-3.6 | Credit sales shall track customer-wise balances |
| FR-3.7 | Invoices shall be GST/VAT compliant |
| FR-3.8 | All transactions shall be audit-logged |

---

## Phase 4: Hospital & Advanced Features

**Goal**: IPD, lab integration, EMR, advanced billing

**Timeline**: 8-12 weeks after Phase 3

### 4.1 Additional Data Models

#### Admission (IPD)
```
Admission
├── id (UUID)
├── hospital_id (FK)
├── patient_id (FK)
├── admission_date
├── discharge_date
├── bed_id (FK)
├── attending_doctor_id (FK)
├── diagnosis[]
├── status (admitted | discharged | transferred)
└── discharge_summary
```

#### Bed Management
```
Bed
├── id (UUID)
├── hospital_id (FK)
├── ward_id (FK)
├── bed_number
├── bed_type (general | semi_private | private | ICU)
├── status (available | occupied | maintenance)
├── daily_rate
└── current_admission_id (FK, nullable)
```

#### Lab Order & Results
```
LabOrder
├── id (UUID)
├── clinic_id (FK)
├── patient_id (FK)
├── ordered_by (Doctor FK)
├── tests[] (LabTest)
├── status (ordered | sample_collected | processing | completed)
├── priority (normal | urgent)
├── ordered_at
└── completed_at

LabResult
├── id (UUID)
├── lab_order_id (FK)
├── test_id (FK)
├── result_value
├── unit
├── reference_range
├── abnormal_flag
├── verified_by (User FK)
├── verified_at
└── notes
```

#### Clinical Notes (EMR)
```
ClinicalNote
├── id (UUID)
├── appointment_id (FK)
├── patient_id (FK)
├── doctor_id (FK)
├── chief_complaint
├── history_present_illness
├── vitals (JSON: BP, pulse, temp, SpO2, weight)
├── examination_findings
├── diagnosis[]
├── treatment_plan
├── prescriptions[] (Prescription)
├── follow_up_date
└── created_at
```

### 4.2 User Stories - Phase 4

#### US-4.1: Electronic Medical Records (EMR)
**Description**: As a doctor, I want to record clinical notes during consultation.

**Acceptance Criteria**:
- [ ] Record vitals, complaints, findings
- [ ] ICD-10 diagnosis codes
- [ ] Generate prescription
- [ ] View patient history across visits
- [ ] Templates for common conditions
- [ ] Typecheck passes

#### US-4.2: Lab orders and results
**Description**: As a doctor, I want to order lab tests and view results.

**Acceptance Criteria**:
- [ ] Order tests from consultation
- [ ] Lab receives order queue
- [ ] Enter results with reference ranges
- [ ] Flag abnormal values
- [ ] Results visible to doctor and patient
- [ ] Online lab report access (like CSH)
- [ ] Typecheck passes

#### US-4.3: E-prescription
**Description**: As a doctor, I want to generate digital prescriptions.

**Acceptance Criteria**:
- [ ] Drug database with dosage forms
- [ ] Auto-calculate duration/quantity
- [ ] Drug interaction warnings
- [ ] Print prescription
- [ ] Send to patient (SMS/WhatsApp)
- [ ] Integrate with pharmacy module
- [ ] Typecheck passes

#### US-4.4: Bed/ward management (Hospital)
**Description**: As a hospital admin, I want to manage bed allocation.

**Acceptance Criteria**:
- [ ] View bed availability by ward
- [ ] Admit patient to bed
- [ ] Transfer between beds/wards
- [ ] Discharge process
- [ ] Bed occupancy reports
- [ ] Typecheck passes

#### US-4.5: IPD billing
**Description**: As a billing clerk, I want to generate comprehensive hospital bills.

**Acceptance Criteria**:
- [ ] Bed charges (daily)
- [ ] Doctor visit charges
- [ ] Procedure charges
- [ ] Lab/radiology charges
- [ ] Pharmacy charges
- [ ] Consolidated final bill
- [ ] Insurance integration (future)
- [ ] Typecheck passes

#### US-4.6: Health packages
**Description**: As a hospital, I want to offer health check-up packages.

**Acceptance Criteria**:
- [ ] Create packages (tests + consultations)
- [ ] Package pricing (discounted)
- [ ] Online package booking
- [ ] Package-wise reports
- [ ] Typecheck passes

### 4.3 Functional Requirements - Phase 4

| ID | Requirement |
|----|-------------|
| FR-4.1 | EMR shall store structured clinical data |
| FR-4.2 | Lab orders shall flow from doctor to lab |
| FR-4.3 | Lab results shall be accessible online by patients |
| FR-4.4 | Prescriptions shall check for drug interactions |
| FR-4.5 | IPD shall track bed allocation and transfers |
| FR-4.6 | Hospital bills shall consolidate all charges |

---

## Phase 5: Telemedicine

**Goal**: Video consultations, instant chat, e-prescriptions

**Timeline**: 4-6 weeks after Phase 4

### 5.1 User Stories - Phase 5

#### US-5.1: Video consultation booking
**Description**: As a patient, I want to book a video consultation with a doctor.

**Acceptance Criteria**:
- [ ] Filter doctors available for telemedicine
- [ ] Book video slot
- [ ] Payment upfront (eSewa, Khalti, card)
- [ ] SMS/email with join link
- [ ] Reminder before appointment
- [ ] Typecheck passes

#### US-5.2: Video call
**Description**: As a patient/doctor, I want to have a video consultation.

**Acceptance Criteria**:
- [ ] WebRTC-based video call
- [ ] Works on mobile and desktop browsers
- [ ] Waiting room before doctor joins
- [ ] Screen sharing (for reports)
- [ ] Call duration tracking
- [ ] Recording (with consent, optional)
- [ ] Typecheck passes

#### US-5.3: Instant consultation
**Description**: As a patient, I want to consult any available doctor immediately.

**Acceptance Criteria**:
- [ ] Pool of doctors marked "available now"
- [ ] Pay fixed fee
- [ ] Auto-match to available doctor
- [ ] Start call within 5 minutes
- [ ] Typecheck passes

#### US-5.4: Chat consultation
**Description**: As a patient, I want to chat with a doctor for minor queries.

**Acceptance Criteria**:
- [ ] Text-based chat
- [ ] Share images (reports, photos)
- [ ] Doctor responds within SLA
- [ ] Prescription via chat
- [ ] Typecheck passes

### 5.2 Functional Requirements - Phase 5

| ID | Requirement |
|----|-------------|
| FR-5.1 | Video calls shall use WebRTC with fallback |
| FR-5.2 | Telemedicine shall require upfront payment |
| FR-5.3 | Prescriptions shall be generated post-consultation |
| FR-5.4 | Call quality shall be monitored and logged |

---

## Technical Architecture

### Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG for SEO, React ecosystem |
| **Backend API** | Next.js API Routes + tRPC | Type-safe API, colocation |
| **Database** | PostgreSQL | Relational data, full-text search |
| **ORM** | Prisma | Type-safe queries, migrations |
| **Auth** | NextAuth.js / Clerk | OAuth + credentials, session mgmt |
| **File Storage** | Cloudflare R2 / AWS S3 | Photos, documents |
| **Search** | PostgreSQL FTS / Meilisearch | Full-text search |
| **Cache** | Redis | Sessions, rate limiting |
| **Queue** | BullMQ (Redis) | Background jobs, notifications |
| **Video** | Daily.co / 100ms / Jitsi | WebRTC provider |
| **Payments** | eSewa, Khalti, Stripe | Nepal + international |
| **SMS** | Sparrow SMS / Aakash SMS | Nepal SMS gateway |
| **Email** | Resend / AWS SES | Transactional email |
| **Hosting** | Vercel / Railway / AWS | Serverless preferred |
| **CI/CD** | GitHub Actions | Automated testing, deployment |

### Monorepo Structure

```
swasthya/
├── apps/
│   ├── web/                    # Main Next.js app (public + dashboard)
│   ├── admin/                  # Admin dashboard (internal)
│   └── docs/                   # Documentation site
├── packages/
│   ├── database/               # Prisma schema, migrations, seed
│   ├── api/                    # tRPC routers, shared API logic
│   ├── ui/                     # Shared UI components (shadcn/ui based)
│   ├── utils/                  # Shared utilities
│   ├── config/                 # Shared configs (eslint, tsconfig)
│   └── email/                  # Email templates
├── mobile/                     # Flutter monorepo
│   ├── apps/
│   │   ├── patient/            # Patient app (Android + iOS)
│   │   ├── doctor/             # Doctor app
│   │   ├── clinic/             # Clinic tablet app
│   │   └── pharmacy/           # Pharmacy POS (mobile + desktop)
│   ├── packages/
│   │   ├── core/               # Shared business logic
│   │   ├── api_client/         # Dio-based API client
│   │   ├── design_system/      # Shared UI components, themes
│   │   ├── local_db/           # Isar/Drift offline database
│   │   └── models/             # Freezed models
│   ├── melos.yaml              # Flutter monorepo management
│   └── pubspec.yaml
├── scripts/
│   ├── import-data.ts          # Import scraped CSV data
│   ├── generate-sitemap.ts     # Sitemap generation
│   ├── generate-openapi.ts     # Generate OpenAPI spec for Flutter
│   └── sync-scrapers.ts        # Run scrapers, update DB
├── scrapers/                   # Existing Python scrapers
├── docker/
│   └── docker-compose.yml      # Local dev (postgres, redis)
├── .github/
│   └── workflows/
│       ├── web.yml             # Web CI/CD
│       ├── flutter.yml         # Flutter CI/CD (build, test, deploy)
│       └── scrapers.yml        # Scraper scheduled runs
├── turbo.json                  # Turborepo config (web)
├── package.json
└── pnpm-workspace.yaml
```

### Flutter Project Structure (mobile/)

```
mobile/
├── apps/patient/
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/                # App setup, routing
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── search/
│   │   │   ├── booking/
│   │   │   ├── appointments/
│   │   │   ├── profile/
│   │   │   └── telemedicine/
│   │   └── shared/             # App-specific shared
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
├── packages/
│   ├── core/
│   │   └── lib/
│   │       ├── services/       # Auth, API, Storage
│   │       ├── utils/
│   │       └── constants/
│   ├── api_client/
│   │   └── lib/
│   │       ├── client.dart     # Dio setup
│   │       ├── endpoints/
│   │       └── interceptors/
│   ├── design_system/
│   │   └── lib/
│   │       ├── theme/
│   │       ├── components/
│   │       └── tokens/         # Colors, typography (synced with web)
│   ├── local_db/
│   │   └── lib/
│   │       ├── isar/           # Isar schemas
│   │       ├── sync/           # Offline sync logic
│   │       └── repositories/
│   └── models/
│       └── lib/
│           ├── doctor.dart
│           ├── appointment.dart
│           └── ...             # Freezed models
└── melos.yaml
```

### Database Schema (Simplified ERD)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────<│  Professional │>────│    Clinic    │
│              │     │ (Doctor/etc) │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Review     │     │ Appointment  │     │   Patient    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ ClinicalNote │
                     │ LabOrder     │
                     │ Prescription │
                     └──────────────┘
```

---

## Internationalization (i18n)

### Day 1 Languages
- **English** (en) - Default
- **Nepali** (ne) - Full translation

### Strategy

#### URL Structure (Language in Path)
```
/en/doctor/dr-ram-sharma-12345    # English
/ne/doctor/dr-ram-sharma-12345    # Nepali

/en/doctors/cardiologist
/ne/doctors/हृदयरोग-विशेषज्ञ      # Nepali specialty names
```

#### Implementation

**1. next-intl (Recommended)**
```typescript
// messages/en.json
{
  "common": {
    "search": "Search",
    "book_appointment": "Book Appointment",
    "verified": "Verified"
  },
  "doctor": {
    "nmc_number": "NMC Number",
    "specialties": "Specialties",
    "consultation_fee": "Consultation Fee"
  }
}

// messages/ne.json
{
  "common": {
    "search": "खोज्नुहोस्",
    "book_appointment": "अपोइन्टमेन्ट बुक गर्नुहोस्",
    "verified": "प्रमाणित"
  },
  "doctor": {
    "nmc_number": "NMC नम्बर",
    "specialties": "विशेषज्ञता",
    "consultation_fee": "परामर्श शुल्क"
  }
}
```

**2. Database Content**
```
Professional
├── name_en: "Dr. Ram Sharma"
├── name_ne: "डा. राम शर्मा"  (nullable, fallback to en)
├── bio_en: "..."
├── bio_ne: "..."
└── ...
```

**3. Auto-translation Pipeline**
- Use Google Translate API for initial bulk translation
- Admin review queue for translations
- Professionals can edit their Nepali profile

#### SEO Considerations
- `<html lang="en">` or `<html lang="ne">`
- `<link rel="alternate" hreflang="en" href="...">`
- `<link rel="alternate" hreflang="ne" href="...">`
- Separate sitemaps per language

#### UI Components
- Language switcher in header
- Persist preference in cookie/localStorage
- Auto-detect from browser `Accept-Language`

### Translation Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  English    │────>│  Auto       │────>│  Review     │
│  Content    │     │  Translate  │     │  Queue      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Nepali     │<────│  Admin      │
                    │  Content    │     │  Approval   │
                    └─────────────┘     └─────────────┘
```

---

## Offline-First Architecture

### Why Offline Support?
- Rural clinics/pharmacies have unreliable internet
- Power outages common in Nepal
- Must not lose patient/sales data

### Strategy: Progressive Web App (PWA) + Local-First

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser/PWA)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  React UI   │  │  IndexedDB  │  │  Service    │         │
│  │             │  │  (Local DB) │  │  Worker     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────┴──────┐                          │
│                   │  Sync       │                          │
│                   │  Engine     │                          │
│                   └──────┬──────┘                          │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Server    │
                    │   (Cloud)   │
                    └─────────────┘
```

#### Technology Options

**Web (PWA):**
| Option | Pros | Cons |
|--------|------|------|
| **IndexedDB + Custom Sync** | Full control | Complex to build |
| **Dexie.js + Custom** | Simple IndexedDB wrapper | Manual sync logic |
| **PowerSync** | Postgres sync, real-time | SaaS dependency |

**Flutter (Mobile/Desktop):**
| Option | Pros | Cons |
|--------|------|------|
| **Isar** | Fastest, async, Flutter-native | No SQL |
| **Drift (SQLite)** | SQL, type-safe, reactive | Slightly slower |
| **ObjectBox** | Fast, sync built-in | Commercial license |
| **Hive** | Simple key-value | Not for complex queries |

**Recommendation**:
- **Web**: Dexie.js + custom sync (simpler)
- **Flutter**: **Isar** for speed + custom sync, or **Drift** if SQL preferred

#### Offline Capabilities by Module

| Module | Offline Support | Sync Strategy |
|--------|-----------------|---------------|
| **Public Directory** | Cache only (read) | Service Worker cache |
| **Patient Registration** | Full offline | Sync on reconnect |
| **Appointments** | Full offline | Conflict resolution |
| **Queue Management** | Full offline | Real-time when online |
| **Billing** | Full offline | Sync on reconnect |
| **Pharmacy POS** | Full offline | CRDT-based sync |
| **Inventory** | Full offline | Last-write-wins |
| **Reports** | Online only | N/A |

#### Conflict Resolution

```typescript
// Example: Appointment conflict
interface SyncConflict {
  localVersion: Appointment;
  serverVersion: Appointment;
  resolution: 'local_wins' | 'server_wins' | 'merge' | 'manual';
}

// Strategy:
// - Patient data: server wins (authoritative)
// - Appointments: timestamp-based (latest wins)
// - Sales: always accept (append-only)
// - Inventory: merge with conflict flag for review
```

#### PWA Features

```javascript
// service-worker.js
const CACHE_NAME = 'swasthya-v1';
const OFFLINE_URLS = [
  '/',
  '/clinic/dashboard',
  '/pharmacy/pos',
  '/offline.html',
  // Static assets
];

// Cache static assets
// Queue failed requests for retry
// Background sync when online
```

#### Data Storage Limits
- IndexedDB: ~50MB default, can request more
- For large clinics: Electron app option (unlimited local storage)

---

## Mobile Apps Strategy

### Phased Approach

| Phase | Platform | Technology | Target Users |
|-------|----------|------------|--------------|
| **Phase 1** | Web (Mobile-responsive) | Next.js | All users |
| **Phase 1.5** | PWA (Installable) | Next.js + SW | Patients, Staff |
| **Phase 2** | Android + iOS | Flutter | Patients |
| **Phase 3** | Tablet (Clinic) | Flutter | Clinic staff |
| **Phase 4** | Desktop (Pharmacy POS) | Flutter | Pharmacy staff |

### App Types

#### 1. Patient App (Phase 2)
**Features:**
- Search doctors/clinics
- Book appointments
- View appointment history
- Receive notifications (reminders, queue updates)
- Video consultation
- View lab reports
- Health records

**Technology**: Flutter (single codebase for Android + iOS)

#### 2. Doctor App (Phase 2)
**Features:**
- View schedule
- Manage appointments
- Video consultations
- E-prescription
- Patient notes (quick)
- Earnings dashboard

**Technology**: Flutter (same codebase, different entry point/flavors)

#### 3. Clinic Staff App / Tablet App (Phase 3)
**Features:**
- Patient check-in (tablet at reception)
- Queue display
- Quick billing
- Appointment management

**Technology**: Flutter (tablet-optimized layouts)

#### 4. Pharmacy POS App (Phase 4)
**Features:**
- Barcode scanning (camera)
- Quick billing
- Inventory lookup
- Offline sales
- Thermal printer support

**Technology**: Flutter Desktop (Windows/Linux) + Flutter Mobile

### Architecture (Code Sharing)

```
┌─────────────────────────────────────────────────────────────┐
│                 WEB (Next.js + TypeScript)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  tRPC API   │  │  Business   │  │  Types &    │         │
│  │  Client     │  │  Logic      │  │  Validation │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                    REST/GraphQL API
                          │
┌─────────────────────────────────────────────────────────────┐
│                   FLUTTER (Dart)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  API Client │  │  Business   │  │  Models &   │         │
│  │  (Dio)      │  │  Logic      │  │  Freezed    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐        │
│  │  Patient    │  │  Doctor     │  │  Clinic/    │        │
│  │  App        │  │  App        │  │  POS App    │        │
│  │ (iOS+Droid) │  │ (iOS+Droid) │  │ (Tablet+PC) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Note**: Web and Flutter are separate codebases but share:
- API contracts (OpenAPI spec generated from backend)
- Business logic patterns
- Design system tokens (colors, typography exported to both)

### Flutter Stack

| Layer | Technology |
|-------|------------|
| Framework | Flutter 3.x |
| State Management | Riverpod / Bloc |
| Navigation | go_router |
| Offline DB | Isar / Drift (SQLite) / ObjectBox |
| API Client | Dio + Retrofit |
| Push Notifications | firebase_messaging |
| Camera/Barcode | camera, mobile_scanner |
| Video | Daily.co SDK / Agora / 100ms |
| UI Components | Material 3 + Custom Design System |
| Code Generation | freezed, json_serializable |

### App Store Strategy

**Android (Google Play)**
- Target: Nepal region
- Free download
- In-app for premium features (telemedicine)

**iOS (App Store)**
- Target: Nepal region
- Same feature set
- Compliance with Apple Health guidelines

### Timeline

| Milestone | Target |
|-----------|--------|
| PWA (installable web) | Phase 1 launch |
| Flutter Patient App (Android + iOS beta) | Phase 2 + 4 weeks |
| Flutter Patient App (production) | Phase 2 + 8 weeks |
| Flutter Doctor App | Phase 2 + 10 weeks |
| Flutter Clinic Tablet App | Phase 3 |
| Flutter Pharmacy POS (Desktop + Mobile) | Phase 4 |

### Why Flutter over React Native

| Aspect | Flutter | React Native |
|--------|---------|--------------|
| Performance | Native ARM compilation | JS Bridge overhead |
| Stability | Predictable, fewer breaking changes | npm dependency hell |
| Offline | Isar/Drift (excellent) | WatermelonDB (decent) |
| Desktop | First-class support | Experimental |
| UI Consistency | Pixel-perfect (Skia) | Platform differences |
| Learning Curve | Dart is simple | JS/TS ecosystem chaos |
| Debugging | Excellent DevTools | Painful |
| Hot Reload | Reliable | Hit or miss |

---

## SEO Strategy

### Goals
- Index 40,000+ professional pages
- Rank for "doctor name + nepal" searches
- Rank for "specialty + city" searches

### Implementation

#### 1. URL Structure
```
/doctor/dr-ram-sharma-12345           # Individual doctor
/doctors                              # All doctors
/doctors/cardiologist                 # By specialty
/doctors/kathmandu                    # By city
/doctors/cardiologist/kathmandu       # Specialty + city

/dentist/dr-sita-thapa-34567
/dentists
/dentists/orthodontist
/dentists/pokhara

/pharmacist/ram-bahadur-g1234
/pharmacists

/clinic/mayo-clinic-kathmandu
/clinics
/clinics/kathmandu
```

#### 2. Meta Tags (per page)
```html
<title>Dr. Ram Sharma - Cardiologist in Kathmandu | NMC #12345 | Swasthya</title>
<meta name="description" content="Dr. Ram Sharma is a verified Cardiologist in Kathmandu, Nepal. NMC Registration #12345. MBBS, MD Cardiology. Book appointment or view profile.">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<link rel="canonical" href="...">
```

#### 3. Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr. Ram Sharma",
  "image": "https://...",
  "medicalSpecialty": "Cardiology",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kathmandu",
    "addressCountry": "NP"
  },
  "identifier": {
    "@type": "PropertyValue",
    "name": "NMC Registration",
    "value": "12345"
  }
}
```

#### 4. Sitemap Strategy
```
/sitemap.xml                    # Index
/sitemap-doctors-1.xml          # Doctors 1-50000
/sitemap-doctors-2.xml          # Doctors 50001+
/sitemap-dentists.xml           # All dentists
/sitemap-pharmacists.xml        # All pharmacists
/sitemap-clinics.xml            # All clinics
/sitemap-pages.xml              # Static pages
```

#### 5. robots.txt
```
User-agent: *
Allow: /
Sitemap: https://swasthya.com.np/sitemap.xml
```

---

## Data Sources & Integration

### Primary Data Sources (Scraped)

| Source | Data | Update Frequency |
|--------|------|------------------|
| NMC (nmc.org.np) | 38,565 doctors | Weekly |
| NDA (nda.org.np) | 1,093 dentists + photos | Weekly |
| NPC (nepalpharmacycouncil.org.np) | 497 pharmacists + photos | Weekly |

### Secondary Data Sources

| Source | Data | Integration |
|--------|------|-------------|
| Google Maps API | Clinic/pharmacy locations | On-demand |
| OpenStreetMap | Fallback locations | Batch import |
| Nepal govt APIs | (Future) Real-time NMC verification | TBD |

### Data Sync Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scrapers   │────>│  CSV Files  │────>│  Database   │
│  (Python)   │     │  (data/)    │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │         ┌─────────────┐              │
       └────────>│  CI/CD Job  │<─────────────┘
                 │  (Weekly)   │
                 └─────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  Changelog  │
                 │  (Detect    │
                 │  changes)   │
                 └─────────────┘
```

---

## Testing & CI/CD Strategy

### Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │  Playwright (critical flows)
                   ┌┴─────────┴┐
                   │Integration │  API tests, DB tests
                  ┌┴───────────┴┐
                  │    Unit     │  Business logic, utils
                  └─────────────┘
```

### Test Categories

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Pure functions, utils |
| Integration | Vitest + Prisma | API routes, DB queries |
| E2E | Playwright | Critical user flows |
| Visual | Playwright screenshots | UI regression |
| Accessibility | axe-core | WCAG compliance |
| Performance | Lighthouse CI | Page speed |
| SEO | Custom checks | Meta tags, structured data |

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    - pnpm lint
    - pnpm typecheck

  test:
    - pnpm test:unit
    - pnpm test:integration

  e2e:
    - Start preview deployment
    - pnpm test:e2e

  lighthouse:
    - Run Lighthouse on preview
    - Assert performance > 90

  deploy:
    - Deploy to Vercel (preview for PRs, production for main)
```

### Feedback Loop

1. **Local Development**
   ```bash
   pnpm dev          # Start dev server
   pnpm test:watch   # Run tests in watch mode
   pnpm db:studio    # Prisma Studio for DB inspection
   ```

2. **PR Preview**
   - Auto-deploy preview URL
   - Run full test suite
   - Lighthouse report in PR comment

3. **Production Monitoring**
   - Vercel Analytics
   - Sentry for errors
   - Google Search Console for SEO

---

## Open Questions

### Decided ✅

| Question | Decision |
|----------|----------|
| Multi-language | Nepali + English from Day 1 (i18n) |
| Offline support | Yes, offline-first for clinic/pharmacy modules |
| Mobile apps | PWA Phase 1, React Native Phase 2+ |
| Payment | Deferred to Phase 2 (not a blocker for MVP) |

### Still Open ❓

1. **Branding**: What should the platform be called? (Swasthya is placeholder)

2. **Domain**: swasthya.com.np? swasthya.health? swasthya.np?

3. **Payment gateway priority** (Phase 2): eSewa vs Khalti vs both?

4. **Insurance integration**: Which insurance companies to target?

5. **Government integration**: Any plans to integrate with govt health systems?

6. **Data privacy**: GDPR-like compliance needed? Health data regulations in Nepal?

7. **Tech stack final decision**: Need to evaluate based on team skills

---

## Appendix: Task Breakdown by Phase

### Phase 1 Tasks (MVP Directory)

| Task | Subtasks | Estimated |
|------|----------|-----------|
| **T1.1 Project Setup** | Monorepo, Next.js, Prisma, Postgres, CI | 3 days |
| **T1.2 i18n Setup** | next-intl, en/ne translations, language switcher | 2 days |
| **T1.3 Database Schema** | Professional, Clinic, User models (with i18n fields) | 2 days |
| **T1.4 Data Import** | CSV import script, photo upload, auto-translate names | 3 days |
| **T1.5 Professional Pages** | SSG pages, SEO meta, JSON-LD, hreflang | 3 days |
| **T1.6 Sitemap** | Generation per language, scheduling | 1 day |
| **T1.7 Search** | Full-text search (both languages), filters | 3 days |
| **T1.8 Auth** | Registration, login, OAuth | 2 days |
| **T1.9 Profile Claim** | Claim flow, verification queue | 3 days |
| **T1.10 Profile Edit** | Edit form (en/ne), audit log | 2 days |
| **T1.11 Admin Dashboard** | Claim approvals, translation review, user mgmt | 3 days |
| **T1.12 Category Pages** | Specialty, location pages (both languages) | 2 days |
| **T1.13 PWA Setup** | Service worker, manifest, offline shell | 2 days |
| **T1.14 Testing & QA** | Unit, integration, E2E, i18n tests | 3 days |
| **T1.15 Deployment** | Vercel, domain, SSL, analytics | 1 day |

**Total Phase 1: ~35 days**

### Phase 2 Tasks (Clinic Management)
*(Detailed breakdown after Phase 1 completion)*

### Phase 3 Tasks (Pharmacy)
*(Detailed breakdown after Phase 2 completion)*

---

## Next Steps

1. **Validate this PRD** with stakeholder feedback
2. **Finalize tech stack** decisions
3. **Create detailed Phase 1 sprint plan**
4. **Set up development environment**
5. **Begin implementation**
