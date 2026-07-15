// Workflow Routes Configuration
// Add these routes to your App.js or Routes.js file

import ComponentsManagement from './pages/projects/workflow/ComponentsManagement';
import UnitsManagement from './pages/projects/workflow/UnitsManagement';
// Import other workflow components as they are created

// Add these routes to your router configuration:

const workflowRoutes = [
  {
    path: '/projects/:projectId/workflow/components',
    element: <ComponentsManagement />
  },
  {
    path: '/projects/:projectId/workflow/units',
    element: <UnitsManagement />
  },
  // More routes will be added here
];

export default workflowRoutes;
