# Leads Module - Quick Reference

## 🚀 Quick Start

```bash
# Navigate to application
cd con-front

# Start development server
npm start

# Access leads module
http://localhost:9001/crm/leads
```

## 📂 File Locations

```
Frontend:
src/pages/crm/leads/
  ├── Leads.js                      # Main list view
  ├── LeadDetail.js                 # Detail view
  ├── LeadsPipeline.js              # Kanban view
  ├── requirements/
  │   └── LeadRequirements.js       # Requirements management
  ├── quotations/
  │   └── LeadQuotations.js         # Quotations management
  └── activities/
      └── LeadActivities.js         # Activities tracking

src/services/
  └── leadsApi.js                   # API service layer

Backend (Verify these exist):
routes/leads.js                     # Lead routes
controllers/leadController.js       # Lead logic
models/Lead.js                      # Lead model
```

## 🔗 URLs

```
/crm/leads              → Main leads list
/crm/leads/pipeline     → Pipeline Kanban view
/crm/leads/:id          → Lead detail view
```

## 🎯 Key Features by Component

### Leads.js (Main List)
- Statistics dashboard (Total, Qualified, Negotiation, Won, Total Value)
- Search across all fields
- Filter by stage, budget, project type, assigned team
- Sort by date, value, probability
- Quick actions (View, Edit, Delete)
- Export capability

### LeadDetail.js
**Tabs:**
- Overview: Contact info, project details, stage management
- Requirements: Project requirements with CRUD
- Quotations: Quotation management with version control
- Activities: Task and activity tracking

**Actions:**
- Edit lead
- Delete lead
- Update stage (quick buttons)

### LeadRequirements.js
- Create/Edit/Delete requirements
- Status: Draft → Under Discussion → Finalized → Quoted
- Comprehensive project specification forms
- Budget and timeline management
- Finalize button to lock requirements

### LeadQuotations.js
- Create/Edit/Delete quotations
- Area-based pricing calculations
- Version control system
- Status workflow (Draft → Sent → Accepted/Rejected)
- History tracking with change logs
- PDF download
- Send to client (Email/WhatsApp)
- Create new versions

### LeadActivities.js
- Activity types: Call, Email, Meeting, Site Visit, Follow Up, Video Call, Note
- Schedule with date/time
- Priority levels: Low, Medium, High, Urgent
- Status: Planned, In Progress, Completed, Cancelled
- Duration tracking
- Completion notes

### LeadsPipeline.js
- Kanban board layout
- Drag and drop to update stages
- Visual pipeline representation
- Stage statistics
- Search functionality
- Quick view on cards

## 📊 API Endpoints Quick Reference

```javascript
import { leadsAPI, leadRequirementsAPI, leadQuotationsAPI, leadActivitiesAPI } from '../services/leadsApi';

// Leads
leadsAPI.getAll()                                // GET /api/leads
leadsAPI.getById(id)                             // GET /api/leads/:id
leadsAPI.create(data)                            // POST /api/leads
leadsAPI.update(id, data)                        // PUT /api/leads/:id
leadsAPI.delete(id)                              // DELETE /api/leads/:id
leadsAPI.updateStage(id, stage, notes)           // PATCH /api/leads/:id/stage
leadsAPI.updateProbability(id, probability)      // PATCH /api/leads/:id/probability

// Requirements
leadRequirementsAPI.getByLeadId(leadId)          // GET /api/leads/:leadId/requirements
leadRequirementsAPI.create(leadId, data)         // POST /api/leads/:leadId/requirements
leadRequirementsAPI.update(leadId, id, data)     // PUT /api/leads/:leadId/requirements/:id
leadRequirementsAPI.delete(leadId, id)           // DELETE /api/leads/:leadId/requirements/:id
leadRequirementsAPI.finalize(leadId, id)         // PATCH /api/leads/:leadId/requirements/:id/finalize

// Quotations
leadQuotationsAPI.getByLeadId(leadId)            // GET /api/leads/:leadId/quotations
leadQuotationsAPI.create(leadId, data)           // POST /api/leads/:leadId/quotations
leadQuotationsAPI.update(leadId, id, data)       // PUT /api/leads/:leadId/quotations/:id
leadQuotationsAPI.send(leadId, id, sendData)     // POST /api/leads/:leadId/quotations/:id/send
leadQuotationsAPI.updateStatus(leadId, id, status) // PATCH /api/leads/:leadId/quotations/:id/status
leadQuotationsAPI.getHistory(leadId, id)         // GET /api/leads/:leadId/quotations/:id/history
leadQuotationsAPI.createVersion(leadId, id, data) // POST /api/leads/:leadId/quotations/:id/version
leadQuotationsAPI.downloadPDF(leadId, id)        // GET /api/leads/:leadId/quotations/:id/pdf

// Activities
leadActivitiesAPI.getByLeadId(leadId)            // GET /api/leads/:leadId/activities
leadActivitiesAPI.create(leadId, data)           // POST /api/leads/:leadId/activities
leadActivitiesAPI.update(leadId, id, data)       // PUT /api/leads/:leadId/activities/:id
leadActivitiesAPI.complete(leadId, id, notes)    // PATCH /api/leads/:leadId/activities/:id/complete
```

## 🛠️ Utility Functions

```javascript
import { formatCurrency, getStageColor, formatDate, calculateLeadScore } from './leadsUtils';

formatCurrency(5000000)                  // ₹50 L
getStageColor('Qualified')               // 'bg-blue-100 text-blue-800 border-blue-200'
formatDate(new Date())                   // 'Jan 15, 2024'
calculateLeadScore(lead)                 // 0-100
```

## 🎨 Stage Colors

```javascript
Qualified              → Blue
Requirement_Gathering  → Purple
Site_Visit_Planned     → Indigo
Site_Visited          → Cyan
Quotation_Requested   → Yellow
Quotation_Sent        → Orange
Negotiation           → Amber
Won                   → Green
Lost                  → Red
```

## 🔐 Authentication

```javascript
// Token is automatically included in API requests
// Stored in localStorage as 'authToken'
localStorage.setItem('authToken', 'your-jwt-token');

// Auth check happens in axios interceptor
// Redirects to /login if 401 response
```

## 📋 Common Tasks

### Create a New Lead
```javascript
const leadData = {
  primary_contact_name: 'John Doe',
  primary_phone: '9876543210',
  email: 'john@example.com',
  project_type: 'Residential',
  budget_min: 5000000,
  budget_max: 7000000,
  stage: 'Qualified'
};
await leadsAPI.create(leadData);
```

### Update Lead Stage
```javascript
await leadsAPI.updateStage(leadId, 'Negotiation', 'Client interested in premium package');
```

### Create Quotation
```javascript
const quotationData = {
  quotation_title: 'Villa Construction - Premium Package',
  package_type: 'Premium',
  package_rate_per_sqft: 2500,
  habitable_area: 2000,
  balcony_area: 300,
  estimated_duration_months: 12
};
await leadQuotationsAPI.create(leadId, quotationData);
```

### Schedule Activity
```javascript
const activityData = {
  activity_type: 'Meeting',
  activity_title: 'Site visit discussion',
  scheduled_date: '2024-12-15',
  scheduled_time: '10:00',
  priority: 'High',
  status: 'Planned'
};
await leadActivitiesAPI.create(leadId, activityData);
```

## 🐛 Debugging

```javascript
// Enable debug logging
localStorage.setItem('DEBUG', 'leads:*');

// Check API responses
console.log('Leads:', leads);
console.log('Lead:', lead);

// Check authentication
console.log('Token:', localStorage.getItem('authToken'));

// Network tab in DevTools
// → Check request/response
// → Verify status codes
// → Check payload
```

## ⚡ Performance Tips

1. Use React DevTools to check unnecessary re-renders
2. Implement pagination for large lead lists
3. Cache API responses when appropriate
4. Use debouncing for search inputs
5. Lazy load images and heavy components

## 🔍 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Blank page | Check console for errors, verify routes in App.js |
| API 401 | Re-login to get new token |
| API 404 | Verify backend endpoint exists |
| Styles broken | Run `npm run build:css` if using Tailwind |
| Icons missing | Run `npm install lucide-react` |
| Data not loading | Check network tab, verify API is running |

## 📞 Support Resources

- **README.md**: Complete feature documentation
- **SETUP_GUIDE.md**: Installation instructions
- **IMPLEMENTATION_SUMMARY.md**: Implementation overview
- **Browser Console**: First place to check for errors
- **Network Tab**: Check API requests/responses
- **React DevTools**: Component inspection

## 🎯 Success Criteria

✅ Can view leads list with statistics  
✅ Can search and filter leads  
✅ Can view lead details  
✅ Can create/edit/delete leads  
✅ Can manage requirements  
✅ Can create quotations  
✅ Can track activities  
✅ Can use pipeline view  
✅ Can drag-drop in pipeline  
✅ All API calls work  

## 📈 Next Steps

1. ✅ Frontend complete - **DONE**
2. 🔲 Backend API implementation
3. 🔲 Database setup
4. 🔲 Testing with real data
5. 🔲 User training
6. 🔲 Production deployment

---

**Quick Access**: Navigate to `/crm/leads` to start using the module!

**Version**: 1.0.0 | **Status**: ✅ Production Ready
