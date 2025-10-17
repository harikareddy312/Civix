import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Add useNavigate
import PetitionCard from "./PetitionCard";
import PetitionFilters from "./PetitionFilters";
import PetitionStats from "./PetitionStats";
import petitionService from "../../services/petitionService";
import { getCurrentUserId } from "../../utils/auth";
import { Alert, Box, Chip } from "@mui/material";

const PetitionList = () => {
  const navigate = useNavigate(); // Add navigation hook
  const currentUserId = getCurrentUserId();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const highlightId = searchParams.get('highlight');
  const fromSearch = searchParams.get('from') === 'search';

  const [filters, setFilters] = useState({
    type: "Active Petitions",
    location: "All Locations",
    status: "All Status",
    view: "List View", // Add view state
  });
  const [petitions, setPetitions] = useState([]);
  const [filteredPetitions, setFilteredPetitions] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const mapStatusToUI = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "closed":
        return "Closed";
      case "under_review":
        return "Under Review";
      default:
        return status;
    }
  };

  const normalizePetition = (p) => ({
    ...p,
    status: mapStatusToUI(p.status),
    signaturesCount: p.signaturesCount || 0,
    time: getRelativeTime(p.createdAt)
  });

  const getRelativeTime = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Function to sort petitions with highlighted item at top
  const sortPetitionsWithHighlight = (petitionsArray) => {
    if (!highlightId) {
      return petitionsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const highlightedPetition = petitionsArray.find(p => p._id === highlightId || p.id === highlightId);
    const otherPetitions = petitionsArray.filter(p => p._id !== highlightId && p.id !== highlightId);
    
    otherPetitions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return highlightedPetition ? [highlightedPetition, ...otherPetitions] : otherPetitions;
  };

  // Function to filter petitions based on search query
  const filterPetitionsBySearch = (petitionsArray) => {
    if (!searchQuery) return petitionsArray;
    
    const query = searchQuery.toLowerCase();
    return petitionsArray.filter(petition => 
      petition.title?.toLowerCase().includes(query) ||
      petition.description?.toLowerCase().includes(query) ||
      petition.location?.toLowerCase().includes(query) ||
      petition.category?.toLowerCase().includes(query)
    );
  };

  // Fetch all petitions on mount
  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const data = await petitionService.getAllPetitions();
        const petitionsArray = Array.isArray(data) ? data : data.petitions || [];
        const normalized = petitionsArray.map((p) => normalizePetition(p));
        
        let processedPetitions = normalized;
        if (fromSearch && searchQuery) {
          processedPetitions = filterPetitionsBySearch(normalized);
        }
        
        const sortedPetitions = sortPetitionsWithHighlight(processedPetitions);

        setPetitions(sortedPetitions);
        setFilteredPetitions(sortedPetitions);
      } catch (err) {
        console.error("Error fetching petitions:", err);
      }
    };

    fetchPetitions();
  }, [searchQuery, highlightId, fromSearch]);

  // Apply filters
  useEffect(() => {
    let result = [...petitions];

    if (filters.location !== "All Locations") {
      result = result.filter((p) => p.location === filters.location);
    }

    if (filters.status !== "All Status") {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.type === "My Petitions") {
      result = result.filter((p) => {
        const creatorId = p.creator?._id || p.creator?.id || p.creator || p.createdBy?._id || p.createdBy?.id || p.createdBy;
        return String(creatorId) === String(currentUserId);
      });
    } else if (filters.type === "Active Petitions") {
      result = result.filter((p) => 
        p.status === "Active" || p.status === "active"
      );
    } else if (filters.type === "Closed Petitions") {
      result = result.filter((p) => 
        p.status === "Closed" || p.status === "closed" || p.status === "Under Review"
      );
    } else if (filters.type === "Petitions I Signed") {
      result = result.filter((p) => {
        if (p.userHasSigned === true) return true;
        if (p.hasSigned === true) return true;
        if (p.signatures && Array.isArray(p.signatures)) {
          return p.signatures.some(signature => {
            const signerId = signature.user?._id || signature.user?.id || signature.user || signature.userId;
            return String(signerId) === String(currentUserId);
          });
        }
        return false;
      });
    }

    const sortedResult = sortPetitionsWithHighlight(result);
    setFilteredPetitions(sortedResult);
  }, [filters, petitions, currentUserId, highlightId]);

  const handleFilterChange = (type, value) =>
    setFilters((prev) => ({ ...prev, [type]: value }));

  const handleSigned = (petitionId, updatedData) => {
    if (typeof petitionId === 'string' && petitionId.startsWith('delete_')) {
      // Handle deletion
      const actualId = petitionId.replace('delete_', '');
      setPetitions(prev => prev.filter(p => p._id !== actualId && p.id !== actualId));
      setFilteredPetitions(prev => prev.filter(p => p._id !== actualId && p.id !== actualId));
    } else {
      // Handle signature update
      if (updatedData) {
        setPetitions(prev => prev.map(p => 
          p._id === petitionId 
            ? { ...p, signaturesCount: updatedData.signaturesCount, userHasSigned: updatedData.signed }
            : p
        ));
        setFilteredPetitions(prev => prev.map(p => 
          p._id === petitionId 
            ? { ...p, signaturesCount: updatedData.signaturesCount, userHasSigned: updatedData.signed }
            : p
        ));
      }
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const clearSearch = () => {
    setSearchParams({});
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle create petition navigation
  const handleCreatePetition = () => {
    navigate('/dashboard/petitions/create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Community Petitions</h1>
          <p className="text-gray-600 mt-2">
            Browse and support community petitions for positive change.
          </p>
        </div>

        {/* Search Context Alert */}
        {fromSearch && searchQuery && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`"${searchQuery}"`} 
                  size="small"
                  sx={{ 
                    bgcolor: '#ADFF2F', 
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                />
                <button
                  onClick={clearSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              </Box>
            }
          >
            <strong>Search Results:</strong> Showing petitions matching your search query
            {highlightId && <span> • Selected petition is highlighted at the top</span>}
          </Alert>
        )}

        {/* Stats & Filters */}
        <div className="mb-6">
          <PetitionStats 
            refreshTrigger={refreshTrigger}
            onCreatePetition={handleCreatePetition} // Pass the navigation function
          />
          <PetitionFilters
            activeFilter={filters}
            onFilterChange={handleFilterChange}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Petitions List - UPDATED FOR GRID VIEW */}
        <div className={
          filters.view === "Grid View" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-6"
        }>
          {filteredPetitions.length > 0 ? (
            filteredPetitions.map((petition, index) => {
              const isHighlighted = petition._id === highlightId || petition.id === highlightId;
              return (
                <div
                  key={petition._id}
                  className={`relative ${
                    isHighlighted 
                      ? 'ring-4 ring-yellow-300 ring-opacity-50 bg-yellow-50 rounded-lg p-2' 
                      : ''
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-2 left-4 z-10">
                      <Chip
                        label="From Search"
                        size="small"
                        sx={{
                          bgcolor: '#ADFF2F',
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          height: '20px'
                        }}
                      />
                    </div>
                  )}
                  <PetitionCard
                    petition={petition}
                    onSigned={handleSigned}
                    isHighlighted={isHighlighted}
                    searchQuery={fromSearch ? searchQuery : null}
                    viewMode={filters.view} // Pass view mode to PetitionCard
                  />
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {fromSearch && searchQuery 
                  ? `No petitions found for "${searchQuery}"`
                  : "No petitions found with the current filters"
                }
              </h3>
              <p className="text-gray-600 mb-8">
                {fromSearch && searchQuery
                  ? "Try adjusting your search terms or browse all petitions."
                  : filters.type === "My Petitions"
                    ? "You haven't created any petitions yet."
                    : "Try adjusting your filters or check back later."
                }
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {fromSearch && searchQuery ? (
                  <button
                    onClick={clearSearch}
                    className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                  >
                    Browse All Petitions
                  </button>
                ) : (
                  <button
                    onClick={() => handleFilterChange("type", "Active Petitions")}
                    className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => navigate("/dashboard/petitions/create")}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create New Petition
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetitionList;
