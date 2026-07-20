import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/Login';
import LoginDebug from './pages/LoginDebug';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import CRMDashboard from './pages/CRMDashboard';
import CRM from './pages/crm/CRM';
import { Leads, LeadDetail, LeadsPipeline } from './pages/crm/leads';
import Clients from './pages/clients/Clients';
import ClientDetails from './pages/clients/ClientDetails';
import Sales from './pages/sales/Sales';
import Projects from './pages/projects/Projects';
import ProjectDetails from './pages/projects/ProjectDetails';
import Architect from './pages/architect/Architect';
import Packages from './pages/packages/Packages';
import PackageRateCards from './pages/packages/PackageRateCards';
import CreateQuotation from './pages/quotations/CreateQuotation';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationDetail from './pages/quotations/QuotationDetail';
import CreatePackage from './pages/packages/CreatePackage';
import PackageDetails from './pages/packages/PackageDetails';
import EditPackage from './pages/packages/EditPackage';
import Workflow from './pages/workflow/Workflow';
import Admin from './pages/admin/Admin';

// Workflow Management Pages
import ComponentsWorkflow from './pages/projects/workflow/ComponentsManagement';
import UnitsWorkflow from './pages/projects/workflow/UnitsManagement';
import PhasesManagement from './pages/projects/workflow/PhasesManagement';
import BlocksManagement from './pages/projects/workflow/BlocksManagement';
import SelectionsManagement from './pages/projects/workflow/SelectionsManagement';
import SequencingManagement from './pages/projects/workflow/SequencingManagement';
import ModulesManagement from './pages/projects/workflow/ModulesManagement';
import WorkPackagesManagement from './pages/projects/workflow/WorkPackagesManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';

// Admin Modules - Implemented
import ItemsManagement from './pages/admin/modules/ItemsManagement';
import ItemChoicesManagement from './pages/admin/modules/ItemChoicesManagement';
import ElementsManagement from './pages/admin/modules/ElementsManagement';
import ComponentsManagement from './pages/admin/modules/ComponentsManagement';

// ✅ Import from masterdata folder
import ElementItemMappingManagement from './pages/admin/masterdata/ElementItemMappingManagement';
import DoorDimensionsManagement from './pages/admin/masterdata/DoorDimensionsManagement';
import WindowDimensionsManagement from './pages/admin/masterdata/WindowDimensionsManagement';
import RoomTypesManagement from './pages/admin/masterdata/RoomTypesManagement';

// Admin Modules - Vendor Management
import VendorTypesManagement from './pages/admin/modules/VendorTypesManagement';
import VendorsManagement from './pages/admin/modules/VendorsManagement';
import VendorPricingManagement from './pages/admin/modules/VendorPricingManagement';
import TmtStandardsManagement from './pages/admin/modules/TmtStandardsManagement';
import PackagesManagement from './pages/admin/modules/PackagesManagement';

// Admin Modules - HR Management
import UsersManagement from './pages/admin/modules/UsersManagement';
import RolesManagement from './pages/admin/modules/RolesManagement';
import PermissionsManagement from './pages/admin/modules/PermissionsManagement';

// Admin Modules - Placeholders (only remaining ones)
import {
  UnitsManagement,
  SystemSettings
} from './pages/admin/modules/PlaceholderModules';

// Test Pages
import ProxyTest from './pages/ProxyTest';
import ConnectionTest from './pages/ConnectionTest';
import AuthTest from './pages/AuthTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: '#ff6b35',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/login-debug" element={<LoginDebug />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/test" element={<ProxyTest />} />
            <Route path="/connection-test" element={<ConnectionTest />} />
            <Route path="/auth-test" element={<AuthTest />} />
            
            {/* Protected Routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* CRM Routes */}
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
            
            <Route
              path="/crm/leads/pipeline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeadsPipeline />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
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
            
            {/* Clients Routes */}
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Projects Routes */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* NEW: Project Details Route */}
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Workflow Routes */}
            <Route
              path="/projects/:projectId/workflow/components"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ComponentsWorkflow />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/units"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UnitsWorkflow />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/phases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PhasesManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/blocks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BlocksManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/selections"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SelectionsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/sequencing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SequencingManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/modules"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ModulesManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:projectId/workflow/workpackages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WorkPackagesManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/architect"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Architect />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/packages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Packages />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packages/rates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PackageRateCards />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quotations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuotationsList />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quotations/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateQuotation />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quotations/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuotationDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packages/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePackage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/packages/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PackageDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/packages/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditPackage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/workflow"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Workflow />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes - Nested with proper URLs */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to items */}
              <Route index element={<Navigate to="/admin/items" replace />} />
              
              {/* Master Data Routes */}
              <Route path="items" element={<ItemsManagement />} />
              <Route path="item-choices" element={<ItemChoicesManagement />} />
              <Route path="elements" element={<ElementsManagement />} />
              <Route path="element-item-mapping" element={<ElementItemMappingManagement />} />
              
              {/* Vendor Management Routes */}
              <Route path="vendor-types" element={<VendorTypesManagement />} />
              <Route path="vendors" element={<VendorsManagement />} />
              <Route path="vendor-pricing" element={<VendorPricingManagement />} />
              <Route path="tmt-standards" element={<TmtStandardsManagement />} />
              
              {/* Package Management Routes */}
              <Route path="packages" element={<PackagesManagement />} />
              
              {/* Dimensions & Standards Routes */}
              <Route path="door-dimensions" element={<DoorDimensionsManagement />} />
              <Route path="window-dimensions" element={<WindowDimensionsManagement />} />
              <Route path="room-types" element={<RoomTypesManagement />} />
              
              {/* Component Management Routes */}
              <Route path="components" element={<ComponentsManagement />} />
              <Route path="units" element={<UnitsManagement />} />
              
              {/* HR Routes */}
              <Route path="users" element={<UsersManagement />} />
              <Route path="roles" element={<RolesManagement />} />
              <Route path="permissions" element={<PermissionsManagement />} />
              
              {/* System Routes */}
              <Route path="system-settings" element={<SystemSettings />} />
            </Route>
            
            {/* Legacy admin (keep for reference) */}
            <Route
              path="/admin-old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Admin />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Settings</h1>
                      <p className="text-gray-600 mt-2">Settings page coming soon...</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
