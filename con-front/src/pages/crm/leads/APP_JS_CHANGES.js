/* 
 * ADD THIS TO App.js
 * Copy and paste the sections below into your App.js file
 */

// ==========================================
// SECTION 1: ADD TO IMPORTS (Top of App.js)
// ==========================================

// Add these imports with your other CRM imports
import { 
  Leads, 
  LeadDetail,
  LeadRequirements,
  LeadQuotations,
  LeadActivities 
} from './pages/crm/leads';
import NewLeadForm from './pages/crm/forms/NewLeadForm';


// ==========================================
// SECTION 2: ADD TO ROUTES (Inside <Routes>)
// ==========================================

// Add these routes after your existing /crm routes
// Make sure to add them in the correct order (more specific routes first)

{/* ===== NEW LEADS MODULE ROUTES ===== */}

{/* Create New Lead */}
<Route
  path="/crm/leads/new"
  element={
    <ProtectedRoute>
      <Layout>
        <NewLeadForm />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Requirements */}
<Route
  path="/crm/leads/:leadId/requirements"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadRequirements />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Quotations */}
<Route
  path="/crm/leads/:leadId/quotations"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadQuotations />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Activities */}
<Route
  path="/crm/leads/:leadId/activities"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadActivities />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* ===== END NEW LEADS MODULE ROUTES ===== */


// ==========================================
// COMPLETE REFERENCE - Full CRM Routes Section
// ==========================================

/*
Your CRM routes section should look like this:

{/* CRM Routes *}
<Route
  path="/crm"
  element={
    <ProtectedRoute>
      <Layout>
        <CRM />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Leads List *}
<Route
  path="/crm/leads"
  element={
    <ProtectedRoute>
      <Layout>
        <Leads />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Create New Lead *}
<Route
  path="/crm/leads/new"
  element={
    <ProtectedRoute>
      <Layout>
        <NewLeadForm />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Detail *}
<Route
  path="/crm/leads/:id"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadDetail />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Requirements *}
<Route
  path="/crm/leads/:leadId/requirements"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadRequirements />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Quotations *}
<Route
  path="/crm/leads/:leadId/quotations"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadQuotations />
      </Layout>
    </ProtectedRoute>
  }
/>

{/* Lead Activities *}
<Route
  path="/crm/leads/:leadId/activities"
  element={
    <ProtectedRoute>
      <Layout>
        <LeadActivities />
      </Layout>
    </ProtectedRoute>
  }
/>

*/

// ==========================================
// NOTES
// ==========================================

/*
1. Make sure the imports are added at the top with other imports
2. Add the routes in the order shown above (specific routes before general routes)
3. The route order matters! /crm/leads/new must come before /crm/leads/:id
4. All routes use ProtectedRoute and Layout components
5. leadId parameter is used consistently across all sub-routes

After adding these routes, you can test by navigating to:
- http://localhost:9001/crm/leads
- http://localhost:9001/crm/leads/new
- http://localhost:9001/crm/leads/1
- http://localhost:9001/crm/leads/1/requirements
- http://localhost:9001/crm/leads/1/quotations
- http://localhost:9001/crm/leads/1/activities
*/
