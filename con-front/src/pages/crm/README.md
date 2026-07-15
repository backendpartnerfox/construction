# CRM Module Documentation

## Overview
The CRM module provides a comprehensive system for managing customer enquiries, leads, and customer relationships in the construction management system.

## Features

### 1. Enquiry Management
- **Create New Enquiries**: Complete form with contact info, project details, and source tracking
- **Edit Enquiries**: Modify enquiry details and update classification
- **View Enquiry Details**: Comprehensive modal with all enquiry information
- **Delete Enquiries**: Remove unwanted enquiries with confirmation
- **Search & Filter**: Find enquiries by name, phone, email, status, or classification
- **Pagination**: Handle large lists of enquiries efficiently

### 2. Lead Qualification System
- **Hot/Cold Classification**: Automatic classification based on lead quality
- **Qualification Criteria**:
  - Has specific location identified
  - Has realistic budget
  - Has immediate timeline
  - Is repeat visitor
  - Company enquiry vs individual

### 3. Status Management
Enquiries progress through these statuses:
- **New**: Initial enquiry received
- **WhatsApp_Sent**: Automated WhatsApp message sent
- **Call_Scheduled**: Follow-up call scheduled
- **Called**: Contact attempted or completed
- **Interested**: Customer shows interest
- **Not_Interested**: Customer not interested
- **Converted_to_Lead**: Successfully converted to lead
- **Lost**: Enquiry lost/closed

### 4. Source Tracking
- UTM parameters (source, medium, campaign)
- Device type (Mobile/Desktop)
- Referrer URL tracking
- Landing page tracking
- Browser information

## File Structure

```
src/pages/crm/
├── CRM.js                     # Main CRM dashboard
├── index.js                   # Export file
├── components/
│   └── EnquiryList.js        # Enquiry list with CRUD operations
└── forms/
    ├── NewEnquiryForm.js     # Create new enquiry
    ├── EditEnquiryForm.js    # Edit existing enquiry
    └── ViewEnquiryModal.js   # View enquiry details
```

## API Integration

The CRM module integrates with the backend API through `services/api.js`:

### Endpoints Used
- `GET /api/enquiries` - Fetch all enquiries
- `POST /api/enquiries` - Create new enquiry
- `PUT /api/enquiries/:id` - Update enquiry
- `DELETE /api/enquiries/:id` - Delete enquiry

### Data Structure

```javascript
// Enquiry Object
{
  enquiry_id: number,
  enquiry_number: string,        // Auto-generated (ENQ-XXXXXX)
  
  // Contact Information
  contact_person_name: string,
  contact_surname: string,
  company_name: string,
  primary_phone: string,
  email: string,
  whatsapp_number: string,
  
  // Location
  city: string,
  state: string,
  
  // Project Information
  project_type: string,          // Residential, Commercial, Industrial, Institutional
  construction_type: string,     // New Construction, Renovation, Extension, Repair
  approximate_area: number,
  area_unit: string,            // sqft, sqmt, acres, cents
  budget_range: string,
  expected_timeline: string,
  
  // Classification
  crm_classification: string,    // Hot, Medium, Cold
  classification_reason: string,
  
  // Status
  status: string,
  
  // Timestamps
  created_at: datetime,
  updated_at: datetime
}
```

## Usage Examples

### 1. Using the Main CRM Component

```javascript
import CRM from './pages/crm/CRM';

function App() {
  return (
    <div>
      <CRM />
    </div>
  );
}
```

### 2. Using Individual Components

```javascript
import { EnquiryList, NewEnquiryForm } from './pages/crm';

function CustomCRMPage() {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowForm(true)}>
        Create Enquiry
      </button>
      
      <EnquiryList />
      
      <NewEnquiryForm 
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => console.log('New enquiry:', data)}
      />
    </div>
  );
}
```

## Customization

### 1. Adding New Fields
To add new fields to the enquiry form:

1. Update the `formData` state in `NewEnquiryForm.js` and `EditEnquiryForm.js`
2. Add the field to the form JSX
3. Update the validation function if required
4. Update the `ViewEnquiryModal.js` to display the new field

### 2. Modifying Classification Logic
Update the `getEnquiryClassification()` function in the form components:

```javascript
const getEnquiryClassification = (data) => {
  let hotScore = 0;
  
  // Add your custom criteria here
  if (data.has_specific_location) hotScore++;
  if (data.has_realistic_budget) hotScore++;
  // ... more criteria
  
  if (hotScore >= 4) return 'Hot';
  if (hotScore >= 2) return 'Medium';
  return 'Cold';
};
```

### 3. Adding New Status Options
Update the status dropdown options in all relevant components and ensure the `getStatusColor()` function handles the new statuses.

## Styling

The module uses Tailwind CSS for styling. Key design tokens:
- **Primary Color**: Orange (`orange-500`, `orange-600`)
- **Secondary Color**: Blue (`blue-500`, `blue-600`)
- **Success Color**: Green (`green-500`)
- **Warning Color**: Yellow (`yellow-500`)
- **Danger Color**: Red (`red-500`)

## Error Handling

The module includes comprehensive error handling:
- Form validation with real-time feedback
- API error handling with user-friendly messages
- Loading states for all async operations
- Confirmation dialogs for destructive actions

## Accessibility

The module follows accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatible
- Focus management

## Performance Optimizations

- **Pagination**: Large lists are paginated for better performance
- **Search Debouncing**: Search is debounced to prevent excessive API calls
- **Lazy Loading**: Components are loaded only when needed
- **Memoization**: React.memo used for expensive components

## Testing

### Manual Testing Checklist
- [ ] Create new enquiry with all fields
- [ ] Create enquiry with minimal required fields
- [ ] Edit existing enquiry
- [ ] Delete enquiry with confirmation
- [ ] Search enquiries by different criteria
- [ ] Filter by status and classification
- [ ] Pagination works correctly
- [ ] Form validation prevents invalid submissions
- [ ] Modal close/open behavior

### Integration Testing
- [ ] API calls work correctly
- [ ] Error handling displays appropriate messages
- [ ] Loading states show correctly
- [ ] Data persistence after page refresh

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Select and perform actions on multiple enquiries
2. **Export/Import**: CSV export and import functionality
3. **Advanced Analytics**: Conversion funnel and performance metrics
4. **Email Integration**: Send emails directly from the interface
5. **WhatsApp Integration**: Automated WhatsApp messaging
6. **Lead Scoring**: Advanced AI-based lead scoring
7. **Pipeline Management**: Visual pipeline for lead progression
8. **Task Management**: Follow-up tasks and reminders
9. **Document Management**: Attach files to enquiries
10. **Reporting**: Detailed reports and analytics

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Offline Support**: PWA capabilities for offline usage
3. **Mobile App**: React Native mobile application
4. **Advanced Search**: Full-text search with filters
5. **Data Visualization**: Charts and graphs for insights

## Support & Maintenance

For issues or questions:
1. Check the console for error messages
2. Verify API endpoints are accessible
3. Ensure proper authentication tokens
4. Check network connectivity
5. Review form validation requirements

## Contributing

When contributing to the CRM module:
1. Follow the existing code structure
2. Add proper TypeScript types if available
3. Include comprehensive tests
4. Update documentation
5. Follow the established naming conventions