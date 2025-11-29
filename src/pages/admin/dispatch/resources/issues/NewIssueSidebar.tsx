import React, { useState, useEffect } from 'react';
import { createIssue, updateIssue } from '../../../../../axios/api/distapcher';
import { listFleetUnits, type FleetUnitDto } from '../../../../../axios/api/fleet.units';
import { MdClose, MdSave } from 'react-icons/md';

interface Issue {
  _id: string;
  reportedBy: string;
  assignedTo: string;
  vehicle?: {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
  } | string;
  issueType: 'maintanance' | 'operational' | 'accident' | 'compilance';
  issueCategory: 'engine' | 'fuel' | 'paper-work' | 'minor-damage';
  issueReport: string;
  issueTags: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'closed';
  address?: string;
  cordinates?: {
    longitude: string;
    latitude: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Vehicle {
  _id: string;
  plateNumber: string;
  make: string;
  model: string;
  licensePlate?: string;
  makeModel?: string;
}

interface NewIssueSidebarProps {
  issue?: Issue | null;
  onClose: () => void;
  onSave: () => void;
}

const NewIssueSidebar: React.FC<NewIssueSidebarProps> = ({ issue, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    reportedBy: '',
    assignedTo: '',
    vehicle: '',
    issueType: 'maintanance' as 'maintanance' | 'operational' | 'accident' | 'compilance',
    issueCategory: 'engine' as 'engine' | 'fuel' | 'paper-work' | 'minor-damage',
    issueReport: '',
    issueTags: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'open' as 'open' | 'in-progress' | 'closed',
    address: ''
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch vehicles (using FleetUnit)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesResponse = await listFleetUnits({ category: "trucks" });

        if (vehiclesResponse.success && vehiclesResponse.data) {
          // Map FleetUnit to Vehicle interface format
          const mappedVehicles: Vehicle[] = vehiclesResponse.data.map((unit: FleetUnitDto) => ({
            _id: unit._id,
            plateNumber: unit.licensePlate || 'N/A',
            make: unit.make || unit.makeModel?.split(' ')[0] || 'Unknown',
            model: unit.model || unit.makeModel?.split(' ').slice(1).join(' ') || 'Unknown',
            licensePlate: unit.licensePlate,
            makeModel: unit.makeModel
          }));
          setVehicles(mappedVehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchData();
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (issue) {
      setFormData({
        reportedBy: issue.reportedBy || '',
        assignedTo: issue.assignedTo || '',
        vehicle: typeof issue.vehicle === 'string' ? issue.vehicle : issue.vehicle?._id || '',
        issueType: issue.issueType,
        issueCategory: issue.issueCategory,
        issueReport: issue.issueReport || '',
        issueTags: issue.issueTags || [],
        priority: issue.priority,
        status: issue.status,
        address: issue.address || ''
      });
    }
  }, [issue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleAddTag = () => {
    if (tagInput.trim() && !formData.issueTags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        issueTags: [...prev.issueTags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      issueTags: prev.issueTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const issueData = {
        ...formData,
        vehicle: formData.vehicle || undefined
      };

      let response;
      if (issue) {
        response = await updateIssue(issue._id, issueData);
      } else {
        response = await createIssue(issueData);
      }

      console.log('Issue creation/update response:', response);

      if (response.success) {
        console.log('Issue saved successfully, closing modal...');
        onSave();
      } else {
        console.error('Error saving issue:', response.message);
        alert('Error saving issue: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving issue:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {issue ? 'Edit Issue' : 'Create New Issue'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reported By *
              </label>
              <input
                type="text"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter reporter name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter assignee name"
              />
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              name="vehicle"
              value={formData.vehicle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="maintanance">Maintenance</option>
                <option value="operational">Operational</option>
                <option value="accident">Accident</option>
                <option value="compilance">Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Category *
              </label>
              <select
                name="issueCategory"
                value={formData.issueCategory}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="engine">Engine</option>
                <option value="fuel">Fuel</option>
                <option value="paper-work">Paper Work</option>
                <option value="minor-damage">Minor Damage</option>
              </select>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Issue Report */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Report *
            </label>
            <textarea
              name="issueReport"
              value={formData.issueReport}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the issue in detail..."
            />
          </div>

          {/* Issue Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.issueTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Address (Optional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the address where the issue occurred"
            />
            <p className="text-xs text-gray-500 mt-1">
              Coordinates will be automatically generated from this address
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <MdSave />
              {loading ? 'Saving...' : (issue ? 'Update Issue' : 'Create Issue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssueSidebar;
