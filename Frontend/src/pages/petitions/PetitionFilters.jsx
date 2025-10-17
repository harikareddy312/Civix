import React, { useState } from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';

const PetitionFilters = ({ activeFilter, onFilterChange }) => {
  const [dropdowns, setDropdowns] = useState({ location: false, status: false });

  const petitionTypes = ['Active Petitions', 'Petitions I Signed', 'My Petitions', 'Closed Petitions'];
  const locations = ['All Locations', 'San Diego, CA', 'Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Miami, FL'];
  const statuses = ['All Status', 'Active', 'Closed', 'Under Review'];
  const viewOptions = ['List View', 'Grid View'];

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({ ...prev, [dropdown]: !prev[dropdown] }));
  };

  const handleSelect = (type, value) => {
    onFilterChange(type, value);
    setDropdowns(prev => ({ ...prev, [type]: false }));
  };

  const clearFilters = () => {
    onFilterChange('type', 'Active Petitions');
    onFilterChange('location', 'All Locations');
    onFilterChange('status', 'All Status');
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          {petitionTypes.map(type => (
            <button
              key={type}
              onClick={() => onFilterChange('type', type)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeFilter.type === type 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex space-x-4 items-center">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onFilterChange('view', 'List View')}
              className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeFilter.view === 'List View' || !activeFilter.view
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ViewListIcon className="w-2 h-2" />
            </button>
            <button
              onClick={() => onFilterChange('view', 'Grid View')}
              className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeFilter.view === 'Grid View'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GridViewIcon className="w-2 h-2" />
            </button>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('location')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span>{activeFilter.location || 'All Locations'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdowns.location && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {locations.map(item => (
                  <button 
                    key={item} 
                    onClick={() => handleSelect('location', item)} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('status')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span>{activeFilter.status || 'All Status'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdowns.status && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {statuses.map(item => (
                  <button 
                    key={item} 
                    onClick={() => handleSelect('status', item)} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-200 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetitionFilters;
