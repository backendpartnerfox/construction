# 📸 Leads Module - Visual Workflow Guide

## 🎬 Complete User Journey

This guide shows you exactly what to expect when using the Leads Module.

---

## 1️⃣ Leads List View (`/crm/leads`)

### What You See:
```
┌─────────────────────────────────────────────────────────────┐
│  Leads Management                              [Export] [Import]
│  Track and manage qualified sales leads
│
│  ┌────────────┬────────────┬────────────┬────────────┬──────────┐
│  │ Total:  5  │ Qualified  │ Negotiation│  Won: 0    │Total Value│
│  │            │    5       │    0       │            │  ₹0      │
│  └────────────┴────────────┴────────────┴────────────┴──────────┘
│
│  [🔍 Search...]  [Stage: All ▼]  [Sort: Newest ▼]  [Filters]
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │ LED-24-007│ Chiru        │ Residential │[Qualified]│ [👁️📝🗑️]│
│  │ 08-10-2025│ 9876543210   │ 2500 sq.ft  │ 25%       │           │
│  ├─────────────────────────────────────────────────────────────┤
│  │ LED-24-006│ Rajesh       │ Commercial  │[Qualified]│ [👁️📝🗑️]│
│  │ 30-09-2025│ 9876543211   │ 3000 sq.ft  │ 25%       │           │
│  ├─────────────────────────────────────────────────────────────┤
│  │ LED-24-005│ Chiru        │ Residential │[Qualified]│ [👁️📝🗑️]│
│  │ 30-09-2025│ 9876543210   │ 2000 sq.ft  │ 25%       │           │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

### Actions Available:
- 🔍 **Search** - Find leads by name, phone, email, or lead number
- 🎯 **Filter** - Filter by stage (Qualified, Negotiation, Won, etc.)
- 📊 **Sort** - Sort by date, budget, or probability
- 👁️ **View** - Open lead detail page
- 📝 **Edit** - Edit lead information
- 🗑️ **Delete** - Remove lead (with confirmation)

---

## 2️⃣ Lead Detail View - Overview Tab (`/crm/leads/:id`)

### What You See:
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]    LED-24-007                      [Edit] [Delete]  │
│              Created on 08/10/2025
│
│  [Qualified] 🎯 Probability: 25%
│
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐
│  │ Budget Range │ Timeline     │ Site Area    │ Quotations   │
│  │ ₹40L - ₹50L  │ 12 months    │ 2400 sq.ft  │ 0            │
│  └──────────────┴──────────────┴──────────────┴──────────────┘
│
│  [Overview] [Requirements] [Quotations] [Activities]
│  ─────────
│
│  📞 Contact Information
│  ┌─────────────────────────────────────────────────────────┐
│  │ 👤 Primary Contact: Chiru                               │
│  │ 🏢 Company: ABC Constructions                           │
│  │ 📞 Phone: 9876543210                                    │
│  │ 📧 Email: chiru@example.com                             │
│  └─────────────────────────────────────────────────────────┘
│
│  🏗️ Project Details
│  ┌─────────────────────────────────────────────────────────┐
│  │ Project Type: Residential                               │
│  │ Construction Type: New Construction                     │
│  │ Number of Floors: 2 (G+1)                              │
│  │ Built-up Area: 2000 sq.ft                              │
│  └─────────────────────────────────────────────────────────┘
│
│  🎯 Stage Management
│  ┌──────────────────────────────────────────────────────────┐
│  │ [✓ Qualified]  [Requirement Gathering]  [Site Visit]    │
│  │ [Quotation Requested]  [Quotation Sent]  [Negotiation]  │
│  │ [Won]  [Lost]                                            │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Click on Stage Button:
- Updates lead stage immediately
- Shows loading indicator
- Updates stage badge at top
- Records stage change in database

---

## 3️⃣ Requirements Tab

### Empty State:
```
┌─────────────────────────────────────────────────────────────┐
│  Requirements                          [+ Add Requirement]   │
│  Manage project requirements for this lead
│
│  ┌─────────────────────────────────────────────────────────┐
│  │                     📄                                    │
│  │          No requirements yet                             │
│  │   Start by adding project requirements for this lead     │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Click "Add Requirement":
```
┌─────────────────────────────────────────────────────────────┐
│  New Requirement                                             │
│
│  Requirement Title * ________________________________        │
│  Description         ________________________________        │
│                      ________________________________        │
│
│  Project Type *      [Residential ▼]   Construction *  [New ▼]
│  Site Area (sq.ft)   [2400      ]     Built-up Area   [2000  ]
│  Number of Floors    [2         ]     Bedrooms        [3     ]
│  Bathrooms           [3         ]     Quality         [Standard▼]
│
│  Budget Min (₹)      [4000000   ]     Budget Max (₹)  [5000000]
│  Expected Completion [12        ] months
│
│  Specific Requirements:
│  ________________________________________________
│
│                                    [Cancel] [Create Requirement]
└─────────────────────────────────────────────────────────────┘
```

### After Creating:
```
┌─────────────────────────────────────────────────────────────┐
│  Requirements                          [+ Add Requirement]   │
│
│  ┌─────────────────────────────────────────────────────────┐
│  │ 3BHK Villa Construction            [Draft]  [📝][✓][🗑️]│
│  │ Modern residential villa with all amenities               │
│  │                                                           │
│  │ 🏢 Residential  🏗️ New Construction  📏 2000 sq.ft      │
│  │ 💰 ₹40L - ₹50L                                          │
│  │                                                           │
│  │ Floors: 2  |  Bedrooms: 3  |  Bathrooms: 3              │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ Quotations Tab

### Create Quotation Form:
```
┌─────────────────────────────────────────────────────────────┐
│  Create Quotation                                            │
│
│  Quotation Title *   [Standard Package Quote        ]        │
│  Project Title *     [3BHK Villa at Gachibowli      ]        │
│  Package Type *      [Standard ▼]                            │
│
│  📏 Area Details                                             │
│  Package Rate/sq.ft * [1800      ]                           │
│  Habitable Area       [1800      ] sq.ft                     │
│  Balcony Area         [150       ] sq.ft                     │
│  Stilt Area           [50        ] sq.ft                     │
│  Terrace Area         [0         ] sq.ft                     │
│
│  ⏱️ Timeline                                                 │
│  Duration (months)    [12        ]                           │
│  Advance %            [20        ] %                         │
│
│  💰 Calculated Totals (Auto-calculated)                      │
│  ┌───────────────────────────────────────────────────────┐
│  │ Base Construction    : ₹32,40,000                      │
│  │ GST (18%)           : ₹5,83,200                       │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│  │ Total Amount        : ₹38,23,200                      │
│  │ Advance Required    : ₹7,64,640                       │
│  └───────────────────────────────────────────────────────┘
│
│  Terms & Conditions  _________________________________       │
│  Inclusions          _________________________________       │
│  Exclusions          _________________________________       │
│
│                                    [Cancel] [Create Quotation]
└─────────────────────────────────────────────────────────────┘
```

### After Creating:
```
┌─────────────────────────────────────────────────────────────┐
│  Quotations                          [+ Create Quotation]    │
│
│  ┌─────────────────────────────────────────────────────────┐
│  │ LQ-24-001 - Standard Package Quote                       │
│  │ 3BHK Villa at Gachibowli                 [Draft]  [Actions▼]
│  │                                                           │
│  │ Created: 08/10/2025  |  Valid Until: 07/11/2025         │
│  │ Version: 1           |  Package: Standard               │
│  │                                                           │
│  │ 📏 Areas:                                                │
│  │ Habitable: 1800 | Balcony: 150 | Stilt: 50 sq.ft       │
│  │                                                           │
│  │ 💰 Pricing:                                              │
│  │ Rate: ₹1,800/sq.ft                                       │
│  │ Base Amount: ₹32,40,000                                  │
│  │ GST (18%): ₹5,83,200                                     │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                      │
│  │ Total: ₹38,23,200                                        │
│  │ Advance: ₹7,64,640 (20%)                                 │
│  │                                                           │
│  │ [Send to Client] [Download PDF] [View History] [Edit]   │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ Activities Tab

### Activity Timeline:
```
┌─────────────────────────────────────────────────────────────┐
│  Activities                              [+ Log Activity]    │
│  Track interactions with this lead
│
│  ┌─────────────────────────────────────────────────────────┐
│  │ 08/10/2025 - 10:30 AM                    [Complete][Edit]│
│  │ 📞 Phone Call                                            │
│  │ Initial discussion about project requirements            │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│  │ 07/10/2025 - 03:00 PM                           [Edit]   │
│  │ 🏗️ Site Visit                           ✓ Completed      │
│  │ Visited site to understand location and requirements     │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│  │ 05/10/2025 - 11:00 AM                           [Edit]   │
│  │ 🤝 Meeting                               ✓ Completed      │
│  │ First meeting with client to discuss project scope       │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Log Activity Form:
```
┌─────────────────────────────────────────────────────────────┐
│  Log New Activity                                            │
│
│  Activity Type *     [📞 Phone Call ▼]                       │
│  Date & Time *       [08/10/2025] [10:30 AM]                │
│  Duration (mins)     [30        ]                            │
│
│  Description *       ________________________________        │
│                      ________________________________        │
│
│  Follow-up Required  [✓]                                     │
│  Follow-up Date      [10/10/2025]                           │
│
│  Status              [● Completed]  [○ Pending]             │
│
│                                       [Cancel] [Log Activity]
└─────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ Pipeline View (`/crm/leads/pipeline`)

### Kanban Board:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Leads Pipeline                            [🔍 Search...] [Filter]   │
│
│  ┌────────────┬────────────┬────────────┬────────────┬──────────────┐
│  │ Qualified  │ Gathering  │ Site Visit │ Quotation  │ Negotiation  │
│  │    (5)     │    (0)     │    (0)     │    (0)     │    (0)       │
│  ├────────────┼────────────┼────────────┼────────────┼──────────────┤
│  │┌──────────┐│            │            │            │              │
│  ││LED-24-007││            │            │            │              │
│  ││Chiru     ││            │            │            │              │
│  ││₹40-50L   ││            │            │            │              │
│  │└──────────┘│            │            │            │              │
│  │┌──────────┐│            │            │            │              │
│  ││LED-24-006││            │            │            │              │
│  ││Rajesh    ││            │            │            │              │
│  ││N/A       ││            │            │            │              │
│  │└──────────┘│            │            │            │              │
│  │┌──────────┐│            │            │            │              │
│  ││LED-24-005││            │            │            │              │
│  ││Chiru     ││            │            │            │              │
│  ││N/A       ││            │            │            │              │
│  │└──────────┘│            │            │            │              │
│  └────────────┴────────────┴────────────┴────────────┴──────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

### Drag & Drop:
- Click and hold lead card
- Drag to different column
- Drop to update stage
- System automatically updates database

---

## 🎯 Complete Workflow Example

### Scenario: New Lead to Won Client

**Step 1: View Lead** 
→ Navigate to `/crm/leads`
→ Click on "LED-24-007"

**Step 2: Add Requirement**
→ Go to "Requirements" tab
→ Click "Add Requirement"
→ Fill in project details
→ Click "Create Requirement"

**Step 3: Create Quotation**
→ Go to "Quotations" tab
→ Click "Create Quotation"
→ Enter pricing details
→ System auto-calculates total
→ Click "Create Quotation"

**Step 4: Send Quotation**
→ Click "Send to Client"
→ Update stage to "Quotation Sent"

**Step 5: Log Follow-up**
→ Go to "Activities" tab
→ Log phone call
→ Schedule follow-up

**Step 6: Client Accepts**
→ Update quotation status to "Accepted"
→ Update lead stage to "Won"
→ System tracks conversion

**Step 7: Create Client** (Future)
→ Click "Convert to Client"
→ System creates client record
→ Project setup begins

---

## 💡 Key Features Highlighted

### 🔍 Smart Search
- Search across multiple fields simultaneously
- Real-time filtering
- Instant results

### 🎨 Visual Indicators
- Color-coded stages
- Progress bars for probability
- Status badges
- Icon-based actions

### 🧮 Auto-Calculations
- Quotation totals
- GST amounts
- Advance payments
- Area-based pricing

### 📊 Analytics
- Lead count by stage
- Total pipeline value
- Conversion metrics
- Team performance

### 🔄 Real-time Updates
- Instant stage changes
- Live data sync
- No page refresh needed

---

## ✅ User Experience Flow

```
Login
  ↓
Dashboard
  ↓
CRM Menu → Leads
  ↓
Leads List (Search/Filter)
  ↓
Select Lead → Lead Detail
  ├→ Overview (View/Edit Info)
  ├→ Requirements (Add/Edit Specs)
  ├→ Quotations (Create/Send Quotes)
  └→ Activities (Log/Track Actions)
      ↓
Update Stage → Pipeline Movement
      ↓
Convert to Client → Project Creation
```

---

## 🎓 Tips for Best Results

1. **Keep Requirements Updated**
   - Add requirements before creating quotations
   - Finalize requirements to lock them
   - Use clear, descriptive titles

2. **Track Activities Regularly**
   - Log every interaction
   - Schedule follow-ups
   - Mark activities as complete

3. **Use Pipeline View**
   - Visualize lead progress
   - Identify bottlenecks
   - Balance workload

4. **Monitor Probabilities**
   - Update as situation changes
   - Helps forecast conversions
   - Prioritize high-probability leads

5. **Version Quotations**
   - Create new versions for changes
   - Keep history for reference
   - Track negotiations

---

## 📱 Mobile Responsive

All views work on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

---

**Ready to use!** Navigate to http://localhost:9001/crm/leads and start managing your leads! 🚀
