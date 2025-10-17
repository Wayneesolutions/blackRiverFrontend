import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Plus } from 'lucide-react';

const EmployeesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const employees = [
    {
      id: 'EMP001',
      name: 'Alex Martinez',
      role: 'Fleet Manager',
      department: 'Operations',
      email: 'alex.martinez@logistiq.com',
      phone: '+1 234-567-8901',
      status: 'Active',
      joinDate: '2023-01-15',
      address: '123 Main St, New York, NY 10001',
      emergencyContact: 'Maria Martinez - +1 234-567-8902',
      performanceScore: 92
    },
    {
      id: 'EMP002',
      name: 'Emma Wilson',
      role: 'Dispatcher',
      department: 'Dispatch',
      email: 'emma.wilson@logistiq.com',
      phone: '+1 234-567-8903',
      status: 'Active',
      joinDate: '2023-03-22',
      address: '456 Oak Ave, Brooklyn, NY 11201',
      emergencyContact: 'John Wilson - +1 234-567-8904',
      performanceScore: 88
    },
    {
      id: 'EMP003',
      name: 'James Brown',
      role: 'Safety Officer',
      department: 'Compliance',
      email: 'james.brown@logistiq.com',
      phone: '+1 234-567-8905',
      status: 'Active',
      joinDate: '2022-11-10',
      address: '789 Pine Rd, Queens, NY 11354',
      emergencyContact: 'Sarah Brown - +1 234-567-8906',
      performanceScore: 95
    },
    {
      id: 'EMP004',
      name: 'Sophia Davis',
      role: 'Operations Staff',
      department: 'Operations',
      email: 'sophia.davis@logistiq.com',
      phone: '+1 234-567-8907',
      status: 'On Leave',
      joinDate: '2023-05-18',
      address: '321 Elm St, Manhattan, NY 10002',
      emergencyContact: 'Michael Davis - +1 234-567-8908',
      performanceScore: 85
    },
    {
      id: 'EMP005',
      name: 'Michael Chen',
      role: 'Maintenance Crew',
      department: 'Maintenance',
      email: 'michael.chen@logistiq.com',
      phone: '+1 234-567-8909',
      status: 'Active',
      joinDate: '2022-08-30',
      address: '654 Maple Dr, Bronx, NY 10451',
      emergencyContact: 'Linda Chen - +1 234-567-8910',
      performanceScore: 90
    },
    {
      id: 'EMP006',
      name: 'Olivia Taylor',
      role: 'Administrative',
      department: 'HR',
      email: 'olivia.taylor@logistiq.com',
      phone: '+1 234-567-8911',
      status: 'Active',
      joinDate: '2023-02-14',
      address: '987 Cedar Ln, Staten Island, NY 10301',
      emergencyContact: 'Robert Taylor - +1 234-567-8912',
      performanceScore: 87
    }
  ];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">All Employees</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{employee.name}</h3>
                    <p className="text-blue-100 text-sm">{employee.id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  employee.status === 'Active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-800">{employee.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-800">{employee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-blue-600">{employee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-800">{employee.phone}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-700">{employee.address}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Emergency Contact</p>
                <p className="text-sm text-gray-700">{employee.emergencyContact}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Join Date</p>
                  <p className="text-sm font-medium text-gray-800">{employee.joinDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Performance Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${employee.performanceScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{employee.performanceScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 pb-4 flex items-center space-x-2">
              <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeesPage;