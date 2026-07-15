import React, { useState } from 'react';
import { 
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Users,
  Calendar,
  Filter,
  Search,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

const Workflow = () => {
  const [activeTab, setActiveTab] = useState('active');

  // Mock workflow data
  const [workflows] = useState([
    {
      id: 'WF-001',
      name: 'Villa Construction Workflow',
      project: 'Serenity Villa',
      projectId: 'PRJ-003',
      status: 'In Progress',
      progress: 65,
      totalSteps: 12,
      completedSteps: 8,
      currentStep: 'Foundation Work',
      startDate: '2024-04-10',
      estimatedCompletion: '2025-04-30',
      assignedTo: 'Priya Singh',
      priority: 'High'
    },
    {
      id: 'WF-002',
      name: 'Residential Complex Phase 1',
      project: 'Green Valley Residences',
      projectId: 'PRJ-001',
      status: 'In Progress',
      progress: 45,
      totalSteps: 15,
      completedSteps: 7,
      currentStep: 'Structural Work',
      startDate: '2024-05-15',
      estimatedCompletion: '2026-06-30',
      assignedTo: 'Rajesh Kumar',
      priority: 'Medium'
    },
    {
      id: 'WF-003',
      name: 'Commercial Mall Construction',
      project: 'Metro Mall & Entertainment Hub',
      projectId: 'PRJ-004',
      status: 'Planning',
      progress: 10,
      totalSteps: 20,
      completedSteps: 2,
      currentStep: 'Site Preparation',
      startDate: '2024-09-01',
      estimatedCompletion: '2026-08-31',
      assignedTo: 'Rajesh Kumar',
      priority: 'Low'
    }
  ]);

  const [workflowSteps] = useState([
    {
      id: 'STEP-001',
      workflowId: 'WF-001',
      stepNumber: 1,
      name: 'Site Survey & Planning',
      description: 'Conduct detailed site survey and prepare construction plans',
      status: 'Completed',
      startDate: '2024-04-10',
      endDate: '2024-04-15',
      assignedTo: 'Anand Sharma',
      dependencies: [],
      estimatedDays: 5,
      actualDays: 5
    },
    {
      id: 'STEP-002',
      workflowId: 'WF-001',
      stepNumber: 2,
      name: 'Excavation',
      description: 'Excavate foundation area according to architectural plans',
      status: 'Completed',
      startDate: '2024-04-16',
      endDate: '2024-04-20',
      assignedTo: 'Site Team',
      dependencies: ['STEP-001'],
      estimatedDays: 4,
      actualDays: 4
    },
    {
      id: 'STEP-003',
      workflowId: 'WF-001',
      stepNumber: 3,
      name: 'Foundation Work',
      description: 'Pour concrete foundation and install reinforcement',
      status: 'In Progress',
      startDate: '2024-04-21',
      endDate: null,
      assignedTo: 'Construction Team A',
      dependencies: ['STEP-002'],
      estimatedDays: 10,
      actualDays: null
    },
    {
      id: 'STEP-004',
      workflowId: 'WF-001',
      stepNumber: 4,
      name: 'Ground Floor Structure',
      description: 'Construct ground floor columns, beams, and slab',
      status: 'Pending',
      startDate: null,
      endDate: null,
      assignedTo: 'Construction Team A',
      dependencies: ['STEP-003'],
      estimatedDays: 15,
      actualDays: null
    }
  ]);

  const [templates] = useState([
    {
      id: 'TEMP-001',
      name: 'Residential Villa Template',
      description: 'Standard workflow for single villa construction',
      steps: 12,
      estimatedDuration: '12 months',
      category: 'Residential',
      lastUsed: '2025-01-10',
      usageCount: 5
    },
    {
      id: 'TEMP-002',
      name: 'Commercial Building Template',
      description: 'Workflow for commercial building construction',
      steps: 18,
      estimatedDuration: '24 months',
      category: 'Commercial',
      lastUsed: '2025-01-05',
      usageCount: 3
    },
    {
      id: 'TEMP-003',
      name: 'Apartment Complex Template',
      description: 'Multi-story residential apartment workflow',
      steps: 20,
      estimatedDuration: '30 months',
      category: 'Residential',
      lastUsed: '2024-12-20',
      usageCount: 2
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Planning':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="text-gray-600">Manage project workflows and track construction phases</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <GitBranch className="h-4 w-4" />
            <span>Create from Template</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Plus className="h-4 w-4" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Workflows"
          value="8"
          icon={GitBranch}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Steps"
          value="24"
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Completed This Week"
          value="12"
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Delayed Tasks"
          value="3"
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'active', label: 'Active Workflows' },
            { id: 'templates', label: 'Templates' },
            { id: 'completed', label: 'Completed' },
            { id: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Workflows Tab */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search workflows..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">{workflow.project}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(workflow.priority)}`}>
                      {workflow.priority}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{workflow.completedSteps}/{workflow.totalSteps} steps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(workflow.progress)}`}
                        style={{ width: `${workflow.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{workflow.progress}% Complete</span>
                      <span>Current: {workflow.currentStep}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Assigned to:</span>
                      <div className="font-medium text-gray-900">{workflow.assignedTo}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Started:</span>
                      <div className="font-medium text-gray-900">{workflow.startDate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Est. Completion:</span>
                      <div className="font-medium text-gray-900">{workflow.estimatedCompletion}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Workflow ID:</span>
                      <div className="font-medium text-gray-900">{workflow.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                        <Pause className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Square className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-orange-600 hover:text-orange-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Workflow Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Serenity Villa - Current Steps</h3>
              <p className="text-gray-600">Track individual step progress</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        step.status === 'Completed' ? 'bg-green-500' :
                        step.status === 'In Progress' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}>
                        {step.status === 'Completed' ? <CheckCircle className="h-4 w-4" /> : step.stepNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{step.assignedTo}</span>
                        </span>
                        {step.startDate && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{step.startDate}</span>
                          </span>
                        )}
                        <span>Est: {step.estimatedDays} days</span>
                        {step.actualDays && <span>Actual: {step.actualDays} days</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
              <p className="text-gray-600">Pre-defined workflows for different project types</p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
              <Plus className="h-4 w-4" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Steps:</span>
                    <span className="font-medium text-gray-900">{template.steps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{template.estimatedDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {template.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium text-gray-900">{template.usageCount} times</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm transition duration-200">
                    Use Template
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-2">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-2">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(activeTab === 'completed' || activeTab === 'analytics') && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'completed' ? 'Completed Workflows' : 'Workflow Analytics'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'completed' ? 'Completed workflows' : 'Analytics and reports'} coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default Workflow;