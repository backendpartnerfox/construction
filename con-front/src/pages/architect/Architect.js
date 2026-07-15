import React, { useState } from 'react';
import { 
  Ruler,
  FileText,
  Building2,
  Camera,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Users,
  Calendar
} from 'lucide-react';

const Architect = () => {
  const [activeTab, setActiveTab] = useState('measurements');

  // Mock data
  const [projects] = useState([
    {
      id: 'PRJ-001',
      name: 'Green Valley Residences',
      client: 'Balakrishna Nandamuri',
      status: 'In Progress',
      architect: 'Anand Sharma',
      lastUpdate: '2025-01-15',
      measurements: {
        structural: 85,
        walls: 70,
        doors: 60,
        windows: 45
      },
      drawings: {
        architectural: 'Approved',
        structural: 'Under Review',
        electrical: 'Pending',
        plumbing: 'Pending'
      }
    },
    {
      id: 'PRJ-003',
      name: 'Serenity Villa',
      client: 'Amit Kumar',
      status: 'Design Phase',
      architect: 'Anand Sharma',
      lastUpdate: '2025-01-14',
      measurements: {
        structural: 100,
        walls: 90,
        doors: 85,
        windows: 80
      },
      drawings: {
        architectural: 'Approved',
        structural: 'Approved',
        electrical: 'Under Review',
        plumbing: 'Draft'
      }
    }
  ]);

  const [measurements] = useState([
    {
      id: 'MEAS-001',
      projectId: 'PRJ-001',
      projectName: 'Green Valley Residences',
      element: 'Columns',
      floor: 'Ground Floor',
      dimensions: '0.45m x 0.45m x 3.2m',
      quantity: 8,
      status: 'Verified',
      recordedBy: 'Site Engineer',
      recordedDate: '2025-01-15',
      notes: 'Standard column measurements for ground floor'
    },
    {
      id: 'MEAS-002',
      projectId: 'PRJ-001',
      projectName: 'Green Valley Residences',
      element: 'Beams',
      floor: 'Ground Floor',
      dimensions: '6.2m x 0.3m x 0.45m',
      quantity: 4,
      status: 'Draft',
      recordedBy: 'Architect',
      recordedDate: '2025-01-14',
      notes: 'Main beams connecting columns'
    },
    {
      id: 'MEAS-003',
      projectId: 'PRJ-003',
      projectName: 'Serenity Villa',
      element: 'Slab',
      floor: 'First Floor',
      dimensions: '6.0m x 4.5m x 0.15m',
      quantity: 1,
      status: 'Verified',
      recordedBy: 'Site Engineer',
      recordedDate: '2025-01-13',
      notes: 'First floor slab specifications'
    }
  ]);

  const [drawings] = useState([
    {
      id: 'DRW-001',
      projectId: 'PRJ-001',
      projectName: 'Green Valley Residences',
      type: 'Architectural Plan',
      floor: 'Ground Floor',
      version: 'v2.1',
      status: 'Approved',
      uploadedBy: 'Anand Sharma',
      uploadDate: '2025-01-10',
      approvedBy: 'Rajesh Kumar',
      approvalDate: '2025-01-12',
      fileSize: '2.5 MB'
    },
    {
      id: 'DRW-002',
      projectId: 'PRJ-001',
      projectName: 'Green Valley Residences',
      type: 'Structural Plan',
      floor: 'Ground Floor',
      version: 'v1.3',
      status: 'Under Review',
      uploadedBy: 'Anand Sharma',
      uploadDate: '2025-01-14',
      approvedBy: null,
      approvalDate: null,
      fileSize: '3.1 MB'
    },
    {
      id: 'DRW-003',
      projectId: 'PRJ-003',
      projectName: 'Serenity Villa',
      type: 'Electrical Layout',
      floor: 'Ground Floor',
      version: 'v1.0',
      status: 'Draft',
      uploadedBy: 'Anand Sharma',
      uploadDate: '2025-01-15',
      approvedBy: null,
      approvalDate: null,
      fileSize: '1.8 MB'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Architect Dashboard</h1>
          <p className="text-gray-600">Manage drawings, measurements, and site surveys</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Upload className="h-4 w-4" />
            <span>Upload Drawing</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Plus className="h-4 w-4" />
            <span>New Measurement</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Projects"
          value="8"
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Measurements"
          value="12"
          icon={Ruler}
          color="bg-yellow-500"
        />
        <StatCard
          title="Drawings Under Review"
          value="5"
          icon={FileText}
          color="bg-orange-500"
        />
        <StatCard
          title="Site Visits This Week"
          value="3"
          icon={Camera}
          color="bg-green-500"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'measurements', label: 'Measurements', icon: Ruler },
            { id: 'drawings', label: 'Drawings', icon: FileText },
            { id: 'projects', label: 'Project Overview', icon: Building2 },
            { id: 'site-visits', label: 'Site Visits', icon: Camera }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Measurements Tab */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Structural Measurements</h2>
              <p className="text-gray-600">Record and verify site measurements</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
                <Plus className="h-4 w-4" />
                <span>Add Measurement</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search measurements..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Measurement Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project & Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {measurements.map((measurement) => (
                    <tr key={measurement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{measurement.id}</div>
                          <div className="text-sm text-gray-500">{measurement.element}</div>
                          <div className="text-xs text-gray-400">Qty: {measurement.quantity}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{measurement.projectName}</div>
                          <div className="text-sm text-gray-500">{measurement.floor}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{measurement.dimensions}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(measurement.status)}`}>
                          {measurement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{measurement.recordedBy}</div>
                          <div className="text-xs text-gray-500">{measurement.recordedDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-orange-600 hover:text-orange-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Drawings Tab */}
      {activeTab === 'drawings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Project Drawings</h2>
              <p className="text-gray-600">Manage architectural and technical drawings</p>
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
              <Upload className="h-4 w-4" />
              <span>Upload Drawing</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawing Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project & Floor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version & Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawings.map((drawing) => (
                    <tr key={drawing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{drawing.id}</div>
                          <div className="text-sm text-gray-500">{drawing.type}</div>
                          <div className="text-xs text-gray-400">{drawing.fileSize}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{drawing.projectName}</div>
                          <div className="text-sm text-gray-500">{drawing.floor}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{drawing.version}</div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(drawing.status)}`}>
                            {drawing.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{drawing.uploadedBy}</div>
                          <div className="text-xs text-gray-500">{drawing.uploadDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {drawing.approvedBy ? (
                            <>
                              <div className="text-sm text-gray-900">{drawing.approvedBy}</div>
                              <div className="text-xs text-gray-500">{drawing.approvalDate}</div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-orange-600 hover:text-orange-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Overview</h2>
            <p className="text-gray-600">Monitor measurement and drawing progress across projects</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Measurement Progress</h4>
                    <div className="space-y-2">
                      {Object.entries(project.measurements).map(([type, progress]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(progress)}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Drawing Status</h4>
                    <div className="space-y-2">
                      {Object.entries(project.drawings).map(([type, status]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last updated: {project.lastUpdate}</span>
                      <span>Architect: {project.architect}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Site Visits Tab */}
      {activeTab === 'site-visits' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Site Visits</h3>
            <p className="text-gray-500">Site visit management coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Architect;