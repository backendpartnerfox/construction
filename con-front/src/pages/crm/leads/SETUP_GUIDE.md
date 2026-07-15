# Leads Module - Setup Guide

## Prerequisites

1. **Backend API** must be running with the following endpoints configured
2. **Database** with tables: `leads`, `lead_requirements`, `lead_quotations`, `lead_quotation_history`, `lead_activities`
3. **Authentication** system in place
4. **React Router** v6+ installed
5. **Tailwind CSS** configured
6. **Lucide React** icons installed

## Installation Steps

### 1. Install Dependencies

```bash
cd con-front
npm install lucide-react axios react-router-dom
```

### 2. Verify File Structure

Ensure all files are in place:

```
src/pages/crm/leads/
├── Leads.js
├── LeadDetail.js
├── LeadsPipeline.js
├── index.js
├── leadsUtils.js
├── README.md
├── SETUP_GUIDE.md
├── requirements/
│   └── LeadRequirements.js
├── quotations/
│   └── LeadQuotations.js
└── activities/
    └── LeadActivities.js

src/services/
└── leadsApi.js
```

### 3. Update App.js Routes

Add the following routes to your `App.js`:

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Leads, LeadDetail, LeadsPipeline } from './pages/crm/leads';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes ... */}
        
        {/* Leads Routes */}
        <Route path="/crm/leads" element={<Leads />} />
        <Route path="/crm/leads/pipeline" element={<LeadsPipeline />} />
        <Route path="/crm/leads/:id" element={<LeadDetail />} />
        
        {/* ... other routes ... */}
      </Routes>
    </Router>
  );
}

export default App;
```

### 4. Update CRM Index (Optional)

If you have a CRM index file at `src/pages/crm/index.js`:

```javascript
// Export leads module
export * from './leads';
export { default as Leads } from './leads/Leads';
export { default as LeadDetail } from './leads/LeadDetail';
export { default as LeadsPipeline } from './leads/LeadsPipeline';
```

### 5. Backend API Endpoints

Ensure your backend has these endpoints:

#### Leads Endpoints
```
GET    /api/leads                    - Get all leads
GET    /api/leads/:id                - Get lead by ID
POST   /api/leads                    - Create new lead
PUT    /api/leads/:id                - Update lead
DELETE /api/leads/:id                - Delete lead
PATCH  /api/leads/:id/stage          - Update lead stage
PATCH  /api/leads/:id/probability    - Update probability
POST   /api/leads/:id/convert-to-client - Convert to client
GET    /api/leads/statistics         - Get statistics
```

#### Lead Requirements Endpoints
```
GET    /api/leads/:leadId/requirements                 - Get all requirements
GET    /api/leads/:leadId/requirements/:id            - Get requirement by ID
POST   /api/leads/:leadId/requirements                - Create requirement
PUT    /api/leads/:leadId/requirements/:id            - Update requirement
DELETE /api/leads/:leadId/requirements/:id            - Delete requirement
PATCH  /api/leads/:leadId/requirements/:id/finalize   - Finalize requirement
```

#### Lead Quotations Endpoints
```
GET    /api/leads/:leadId/quotations                  - Get all quotations
GET    /api/leads/:leadId/quotations/:id              - Get quotation by ID
POST   /api/leads/:leadId/quotations                  - Create quotation
PUT    /api/leads/:leadId/quotations/:id              - Update quotation
DELETE /api/leads/:leadId/quotations/:id              - Delete quotation
POST   /api/leads/:leadId/quotations/:id/send         - Send quotation
PATCH  /api/leads/:leadId/quotations/:id/status       - Update status
GET    /api/leads/:leadId/quotations/:id/history      - Get history
POST   /api/leads/:leadId/quotations/:id/version      - Create new version
GET    /api/leads/:leadId/quotations/:id/pdf          - Download PDF
```

#### Lead Activities Endpoints
```
GET    /api/leads/:leadId/activities                  - Get all activities
POST   /api/leads/:leadId/activities                  - Create activity
PUT    /api/leads/:leadId/activities/:id              - Update activity
DELETE /api/leads/:leadId/activities/:id              - Delete activity
PATCH  /api/leads/:leadId/activities/:id/complete     - Complete activity
```

### 6. Database Tables

Run the following SQL to create required tables:

```sql
-- Already present in lk.sql file
-- Verify these tables exist:
-- 1. leads
-- 2. lead_requirements
-- 3. lead_quotations
-- 4. lead_quotation_history
-- 5. lead_activities (if you want activity tracking)
```

### 7. Environment Configuration

Update your `.env` file if needed:

```
REACT_APP_API_URL=http://localhost:9000
REACT_APP_API_TIMEOUT=30000
```

### 8. Proxy Configuration (Development)

If using Create React App, update `package.json`:

```json
{
  "proxy": "http://localhost:9000"
}
```

Or create `src/setupProxy.js`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:9000',
      changeOrigin: true,
    })
  );
};
```

## Configuration

### 1. API Base URL

In `src/services/leadsApi.js`, verify the API_URL:

```javascript
const API_URL = '/api'; // or your backend URL
```

### 2. Authentication

The module uses JWT tokens stored in localStorage:

```javascript
// Token is automatically added to requests via axios interceptor
localStorage.setItem('authToken', 'your-jwt-token');
```

### 3. Styling

The module uses Tailwind CSS. Ensure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          // ... other shades
          600: '#ea580c',
          700: '#c2410c',
        }
      }
    }
  }
}
```

## Testing

### 1. Test API Connection

```javascript
// In browser console
import { leadsAPI } from './services/leadsApi';
leadsAPI.getAll().then(data => console.log(data));
```

### 2. Test Lead Creation

Navigate to `/crm/leads` and verify:
- Page loads without errors
- Statistics cards display
- Search and filters work
- Table displays leads (if any exist)

### 3. Test Lead Detail

1. Click on any lead to open detail view
2. Verify all tabs work (Overview, Requirements, Quotations, Activities)
3. Test stage update buttons
4. Test edit functionality

### 4. Test Pipeline View

Navigate to `/crm/leads/pipeline` and verify:
- Kanban board displays
- Drag and drop works
- Stage update works

## Troubleshooting

### Issue: "Module not found"

**Solution**: Check import paths and ensure all files exist

```bash
# Verify files
ls src/pages/crm/leads/
ls src/services/leadsApi.js
```

### Issue: "API calls failing"

**Solution**: 
1. Check backend is running: `curl http://localhost:9000/api/leads`
2. Verify authentication token: Check localStorage in browser DevTools
3. Check CORS settings in backend
4. Review network tab in browser DevTools

### Issue: "Blank page or white screen"

**Solution**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify React Router is configured
4. Check that all imports are correct

### Issue: "Styles not applied"

**Solution**:
1. Verify Tailwind CSS is installed and configured
2. Rebuild CSS: `npm run build:css` (if using custom build)
3. Clear browser cache
4. Check `tailwind.config.js` content paths

### Issue: "Icons not displaying"

**Solution**:
1. Install lucide-react: `npm install lucide-react`
2. Verify import statements
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Performance Optimization

### 1. Enable Code Splitting

```javascript
// Lazy load components
const Leads = React.lazy(() => import('./pages/crm/leads/Leads'));
const LeadDetail = React.lazy(() => import('./pages/crm/leads/LeadDetail'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/crm/leads" element={<Leads />} />
    <Route path="/crm/leads/:id" element={<LeadDetail />} />
  </Routes>
</Suspense>
```

### 2. Implement Caching

```javascript
// Add to leadsApi.js
const cache = new Map();

export const leadsAPI = {
  getAll: async (params = {}) => {
    const cacheKey = JSON.stringify(params);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const data = await api.get('/leads', { params });
    cache.set(cacheKey, data);
    return data;
  }
};
```

### 3. Optimize Re-renders

Use React.memo for components that don't need frequent updates:

```javascript
export default React.memo(LeadCard);
```

## Security Considerations

### 1. API Security

- All API calls include authentication token
- Tokens are stored securely in localStorage
- Tokens expire and are refreshed automatically
- HTTPS should be used in production

### 2. Input Validation

- All form inputs are validated before submission
- Phone numbers and emails are validated using regex
- Numeric inputs are type-checked

### 3. Authorization

- Check user permissions before allowing operations
- Sensitive operations (delete, stage update) require confirmation

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Create `.env.production`:

```
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_API_TIMEOUT=30000
```

### Deploy to Server

```bash
# Build
npm run build

# Copy build folder to server
scp -r build/* user@server:/var/www/html/
```

## Monitoring

### 1. Error Tracking

Integrate error tracking (e.g., Sentry):

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### 2. Analytics

Add analytics tracking:

```javascript
// Track page views
useEffect(() => {
  analytics.track('Page View', { page: 'Leads' });
}, []);
```

## Maintenance

### Regular Tasks

1. **Update dependencies**: `npm update`
2. **Review logs**: Check for API errors
3. **Monitor performance**: Use React DevTools
4. **Backup data**: Regular database backups
5. **Test after updates**: Regression testing

## Support

For issues or questions:
- Review documentation in README.md
- Check browser console for errors
- Verify backend API is working
- Check database connection
- Review network requests in DevTools

## Next Steps

1. ✅ Complete installation
2. ✅ Test basic functionality
3. ✅ Configure for your environment
4. 🔲 Add custom branding/styling
5. 🔲 Implement additional features
6. 🔲 Deploy to production

## Version History

- **v1.0.0** - Initial release with full CRUD operations
- Includes: Leads list, detail view, requirements, quotations, activities, pipeline view

---

**Setup Complete!** 🎉

Your Leads module should now be fully functional. Navigate to `/crm/leads` to start using it.
