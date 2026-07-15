# Leads Module - Complete Documentation

## Overview
The Leads module is a comprehensive CRM solution for managing qualified sales leads throughout the sales pipeline, from initial qualification to client conversion.

## Module Structure

```
leads/
├── Leads.js                    # Main leads list/table view
├── LeadDetail.js               # Detailed lead view with tabs
├── LeadsPipeline.js            # Kanban-style pipeline view
├── index.js                    # Module exports
├── leadsUtils.js               # Utility functions
├── requirements/
│   └── LeadRequirements.js     # Manage lead requirements
├── quotations/
│   └── LeadQuotations.js       # Manage quotations & history
└── activities/
    └── LeadActivities.js       # Track activities & tasks
```

## Features

### 1. Leads Management (Leads.js)
- **List View**: Comprehensive table with filtering and sorting
- **Statistics Dashboard**: Real-time metrics and KPIs
- **Multi-filter Search**: By name, phone, email, stage, budget
- **Stage Management**: Quick stage updates
- **Bulk Operations**: Export, import capabilities
- **Responsive Design**: Works on all devices

**Key Statistics:**
- Total leads count
- Qualified leads
- Leads in negotiation
- Won deals
- Total pipeline value

**Filters:**
- Search across all fields
- Stage filter
- Budget range filter
- Project type filter
- Assigned team member filter
- Sort by date, value, probability

### 2. Lead Detail View (LeadDetail.js)
Comprehensive lead details with tabbed interface:

**Tabs:**
1. **Overview**
   - Contact information
   - Project details
   - Location
   - Stage management (quick update buttons)
   - Notes

2. **Requirements**
   - Project requirements management
   - Technical specifications
   - Budget and timeline details

3. **Quotations**
   - Quotation creation and management
   - Version history tracking
   - PDF download
   - Send to client

4. **Activities**
   - Activity timeline
   - Task management
   - Follow-up tracking

**Quick Actions:**
- Edit lead details
- Delete lead
- Update stage
- View probability

### 3. Lead Requirements (LeadRequirements.js)
Comprehensive requirements management:

**Features:**
- Create multiple requirements per lead
- Detailed project specifications
- Area calculations
- Budget range management
- Quality preferences
- Timeline expectations
- Status tracking (Draft, Under Discussion, Finalized, Quoted)
- Finalize requirements to lock details

**Requirement Details:**
- Project type (Residential/Commercial/Industrial)
- Construction type (New/Renovation/Extension)
- Site and built-up area
- Number of floors, bedrooms, bathrooms
- Quality preference (Basic/Standard/Premium/Luxury)
- Budget range
- Expected completion timeline
- Specific requirements and preferences

### 4. Lead Quotations (LeadQuotations.js)
Advanced quotation management with history tracking:

**Features:**
- Create multiple quotations per lead
- Area-based pricing (habitable, balcony, stilt, terrace)
- Automatic calculations
- Version control
- Status workflow
- PDF generation
- Email/WhatsApp sending
- History tracking

**Quotation Components:**
- Package type selection
- Rate per sq.ft
- Area breakdown
- Duration estimates
- Advance percentage
- Terms & conditions
- Inclusions/exclusions

**Status Workflow:**
1. Draft → Under Review → Approved → Sent → Viewed → Under Discussion → Accepted/Rejected

**History Tracking:**
- All changes logged
- Version comparison
- Client feedback tracking
- Change reasons documented

### 5. Lead Activities (LeadActivities.js)
Comprehensive activity and task management:

**Activity Types:**
- Call
- Email
- Meeting
- Site Visit
- Follow Up
- Video Call
- Note

**Features:**
- Schedule activities with date/time
- Priority levels (Low/Medium/High/Urgent)
- Duration tracking
- Status management (Planned/In Progress/Completed/Cancelled)
- Completion notes
- Timeline view
- Overdue tracking

## API Integration

The module uses dedicated API services from `services/leadsApi.js`:

### Leads API
```javascript
import { leadsAPI } from '../../../services/leadsApi';

// Basic CRUD
leadsAPI.getAll(params)
leadsAPI.getById(id)
leadsAPI.create(leadData)
leadsAPI.update(id, leadData)
leadsAPI.delete(id)

// Special operations
leadsAPI.updateStage(id, stage, notes)
leadsAPI.updateProbability(id, probability)
leadsAPI.convertToClient(id, conversionData)
leadsAPI.getStatistics()
```

### Lead Requirements API
```javascript
import { leadRequirementsAPI } from '../../../services/leadsApi';

leadRequirementsAPI.getByLeadId(leadId)
leadRequirementsAPI.getById(leadId, requirementId)
leadRequirementsAPI.create(leadId, requirementData)
leadRequirementsAPI.update(leadId, requirementId, requirementData)
leadRequirementsAPI.delete(leadId, requirementId)
leadRequirementsAPI.finalize(leadId, requirementId)
```

### Lead Quotations API
```javascript
import { leadQuotationsAPI } from '../../../services/leadsApi';

leadQuotationsAPI.getByLeadId(leadId)
leadQuotationsAPI.getById(leadId, quotationId)
leadQuotationsAPI.create(leadId, quotationData)
leadQuotationsAPI.update(leadId, quotationId, quotationData)
leadQuotationsAPI.delete(leadId, quotationId)
leadQuotationsAPI.send(leadId, quotationId, sendData)
leadQuotationsAPI.updateStatus(leadId, quotationId, status, feedback)
leadQuotationsAPI.getHistory(leadId, quotationId)
leadQuotationsAPI.createVersion(leadId, quotationId, versionData)
leadQuotationsAPI.downloadPDF(leadId, quotationId)
```

### Lead Activities API
```javascript
import { leadActivitiesAPI } from '../../../services/leadsApi';

leadActivitiesAPI.getByLeadId(leadId)
leadActivitiesAPI.create(leadId, activityData)
leadActivitiesAPI.update(leadId, activityId, activityData)
leadActivitiesAPI.delete(leadId, activityId)
leadActivitiesAPI.complete(leadId, activityId, notes)
```

## Database Schema

### leads table
```sql
- lead_id (PK)
- enquiry_id (FK)
- lead_number
- primary_contact_name
- company_name
- primary_phone
- email
- whatsapp_number
- site_address
- city, state, postal_code
- project_type
- construction_type
- site_area
- estimated_built_up_area
- number_of_floors
- budget_min, budget_max
- timeline_months
- stage (Qualified, Requirement_Gathering, Site_Visit_Planned, etc.)
- probability_percentage
- assigned_sales_person
- quotations_generated
- converted_to_client
- lead_notes
- created_at, updated_at
```

### lead_requirements table
```sql
- lead_requirement_id (PK)
- lead_id (FK)
- requirement_title
- requirement_description
- project_type
- construction_type
- site_area, built_up_area, carpet_area
- number_of_floors, bedrooms, bathrooms, kitchens
- quality_preference
- budget_range_min, budget_range_max
- expected_completion_months
- specific_requirements
- status (Draft, Under_Discussion, Finalized, Quoted)
- created_at, updated_at
```

### lead_quotations table
```sql
- lead_quotation_id (PK)
- lead_id (FK)
- lead_requirement_id (FK)
- lead_quotation_number
- quotation_title
- quotation_date
- valid_until
- version_number
- project_title
- package_type
- package_rate_per_sqft
- habitable_area, balcony_area, stilt_area, terrace_area
- package_construction_amount (calculated)
- gst_percentage, gst_amount (calculated)
- total_amount (calculated)
- estimated_duration_months
- advance_percentage
- terms_conditions, inclusions, exclusions
- status (Draft, Approved, Sent, Accepted, Rejected)
- is_current_version
- created_at, updated_at
```

### lead_quotation_history table
```sql
- history_id (PK)
- lead_quotation_id (FK)
- version_number
- change_type
- change_description
- changes_made
- reason_for_change
- client_feedback_received
- status_at_time
- changed_by (FK to employees)
- change_date
```

### lead_activities table
```sql
- activity_id (PK)
- lead_id (FK)
- activity_type (Call, Email, Meeting, Site_Visit, etc.)
- activity_title
- activity_description
- scheduled_datetime
- duration_minutes
- priority (Low, Medium, High, Urgent)
- status (Planned, In_Progress, Completed, Cancelled)
- completion_notes
- completed_at
- created_by (FK to employees)
- created_at, updated_at
```

## Workflow

### Lead Lifecycle
1. **Enquiry Conversion** → Lead Created
2. **Qualification** → Gather requirements
3. **Requirements Finalization** → Create quotations
4. **Quotation Management** → Multiple versions, client discussions
5. **Negotiation** → Updates and revisions
6. **Acceptance** → Payment received
7. **Conversion** → Client created, Project starts

### Stage Progression
```
Qualified
  ↓
Requirement_Gathering
  ↓
Site_Visit_Planned
  ↓
Site_Visited
  ↓
Quotation_Requested
  ↓
Quotation_Sent
  ↓
Negotiation
  ↓
Won (→ Convert to Client) or Lost
```

## Usage Examples

### Creating a New Lead
```javascript
const leadData = {
  primary_contact_name: 'John Doe',
  company_name: 'ABC Corp',
  primary_phone: '9876543210',
  email: 'john@abc.com',
  project_type: 'Residential',
  construction_type: 'New Construction',
  site_area: 2500,
  budget_min: 5000000,
  budget_max: 7000000,
  timeline_months: 12,
  stage: 'Qualified',
  probability_percentage: 25
};

await leadsAPI.create(leadData);
```

### Adding a Requirement
```javascript
const requirementData = {
  requirement_title: '3BHK Villa',
  project_type: 'Residential',
  construction_type: 'New Construction',
  built_up_area: 2500,
  number_of_floors: 2,
  number_of_bedrooms: 3,
  number_of_bathrooms: 3,
  quality_preference: 'Premium',
  budget_range_min: 5000000,
  budget_range_max: 7000000
};

await leadRequirementsAPI.create(leadId, requirementData);
```

### Creating a Quotation
```javascript
const quotationData = {
  quotation_title: 'Villa Construction - Premium Package',
  package_type: 'Premium',
  package_rate_per_sqft: 2500,
  habitable_area: 2000,
  balcony_area: 300,
  stilt_area: 200,
  terrace_area: 500,
  estimated_duration_months: 12,
  advance_percentage: 20
};

await leadQuotationsAPI.create(leadId, quotationData);
```

### Scheduling an Activity
```javascript
const activityData = {
  activity_type: 'Meeting',
  activity_title: 'Site visit and requirement discussion',
  scheduled_date: '2024-12-15',
  scheduled_time: '10:00',
  duration_minutes: 120,
  priority: 'High',
  status: 'Planned'
};

await leadActivitiesAPI.create(leadId, activityData);
```

## Routing

Add these routes to your App.js:

```javascript
// Leads Routes
<Route path="/crm/leads" element={<Leads />} />
<Route path="/crm/leads/:id" element={<LeadDetail />} />
<Route path="/crm/leads/:id/edit" element={<EditLeadForm />} />
<Route path="/crm/leads/pipeline" element={<LeadsPipeline />} />
```

## Styling

The module uses Tailwind CSS for styling with consistent color schemes:

- **Primary**: Orange (orange-500, orange-600, orange-700)
- **Success**: Green (green-500, green-600)
- **Warning**: Yellow/Amber (yellow-500, amber-500)
- **Danger**: Red (red-500, red-600)
- **Info**: Blue (blue-500, blue-600)

## Icons

Using Lucide React icons throughout:
- Plus, Edit, Trash2 for actions
- Phone, Mail, MapPin for contact
- Calendar, Clock for time
- DollarSign for financial
- Building2, Home for project
- FileText, Target for documents
- Activity, TrendingUp for progress

## Best Practices

1. **Always validate data** before API calls
2. **Handle errors gracefully** with try-catch blocks
3. **Provide user feedback** for all operations
4. **Use loading states** during API calls
5. **Confirm destructive actions** (delete operations)
6. **Keep state synchronized** after updates
7. **Format currency** consistently
8. **Show meaningful empty states**

## Future Enhancements

1. **Email Integration**: Direct email sending from activities
2. **WhatsApp Integration**: Direct messaging capabilities
3. **Calendar Sync**: Sync activities with Google Calendar
4. **Document Management**: Upload and manage documents
5. **Lead Scoring**: Automated lead scoring based on criteria
6. **AI Recommendations**: AI-powered next best actions
7. **Mobile App**: Dedicated mobile application
8. **Analytics Dashboard**: Advanced analytics and reporting
9. **Team Collaboration**: Comments and mentions
10. **Custom Fields**: Configurable fields per organization

## Support

For issues or questions:
- Check the database schema in `lk.sql`
- Review API endpoints in `services/leadsApi.js`
- Check console logs for error messages
- Verify authentication tokens

## Version
v1.0.0 - Complete Leads Module Implementation
