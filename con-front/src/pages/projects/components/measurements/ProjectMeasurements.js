import React, { useState } from 'react';
import {
  FileText,
  Ruler,
  Home,
  DoorOpen,
  Square,
  Zap,
  Droplet,
  PaintBucket,
  Grid,
  Layers,
  BarChart3,
  MapPin,
  Calculator,
} from 'lucide-react';
import ArchitectMeasurementsOverview from './ArchitectMeasurementsOverview';
import FloorComponentMapping from './FloorComponentMapping';
import MeasurementBOQIntegration from './MeasurementBOQIntegration';
import ArchitectDrawings from './ArchitectDrawings';
import StructuralMeasurements from './StructuralMeasurements';
import WallMeasurements from './WallMeasurements';
import DoorMeasurements from './DoorMeasurements';
import WindowMeasurements from './WindowMeasurements';
import ElectricalMeasurements from './ElectricalMeasurements';
import PlumbingMeasurements from './PlumbingMeasurements';
import FlooringMeasurements from './FlooringMeasurements';
import PaintingMeasurements from './PaintingMeasurements';

const ProjectMeasurements = ({ projectId }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3, component: ArchitectMeasurementsOverview },
    { id: 'mapping', label: 'Floor & Components', icon: MapPin, component: FloorComponentMapping },
    { id: 'boq-integration', label: 'BOQ Integration', icon: Calculator, component: MeasurementBOQIntegration },
    { id: 'drawings', label: 'Drawings', icon: FileText, component: ArchitectDrawings },
    { id: 'structural', label: 'Structural', icon: Home, component: StructuralMeasurements },
    { id: 'walls', label: 'Walls', icon: Grid, component: WallMeasurements },
    { id: 'doors', label: 'Doors', icon: DoorOpen, component: DoorMeasurements },
    { id: 'windows', label: 'Windows', icon: Square, component: WindowMeasurements },
    { id: 'electrical', label: 'Electrical', icon: Zap, component: ElectricalMeasurements },
    { id: 'plumbing', label: 'Plumbing', icon: Droplet, component: PlumbingMeasurements },
    { id: 'flooring', label: 'Flooring', icon: Layers, component: FlooringMeasurements },
    { id: 'painting', label: 'Painting', icon: PaintBucket, component: PaintingMeasurements },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Measurements & Drawings</h3>
        <p className="text-sm text-gray-500">
          Manage architect drawings and measurements for this project
        </p>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Measurement sections">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isDisabled = section.disabled;

            return (
              <button
                key={section.id}
                onClick={() => !isDisabled && setActiveSection(section.id)}
                disabled={isDisabled}
                className={`
                  group inline-flex items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
                  ${isActive
                    ? 'border-orange-500 text-orange-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-orange-500' : isDisabled ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {section.label}
                {isDisabled && (
                  <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Section Content */}
      <div className="bg-white rounded-lg">
        {ActiveComponent ? (
          <ActiveComponent projectId={projectId} />
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">This section is coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMeasurements;
