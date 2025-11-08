import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PollStats from "./PollStats";
import PollFilters from "./PollFilters";
import PollCard from "./PollCard";
import { useNavigate } from "react-router-dom";
import { pollService } from "../../services/pollService";
import { getCurrentUserId } from "../../utils/auth";
import { Alert, Box, Chip } from "@mui/material";

const PollList = () => {
  const currentUserId = getCurrentUserId();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const highlightId = searchParams.get('highlight');
  const fromSearch = searchParams.get('from') === 'search';

  const [filters, setFilters] = useState({
    type: "Active Polls",
    location: "All Locations",
    status: "All Status",
    view: "List View", // Add view state
  });
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const mapStatusToUI = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "closed":
        return "Closed";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  const normalizePoll = (p) => ({
    ...p,
    status: mapStatusToUI(p.status),
    totalVotes: (p.votes?.length) || p.totalVotes || 0,
    time: getRelativeTime(p.createdAt)
  });

  const getRelativeTime = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Function to sort polls with highlighted item at top
  const sortPollsWithHighlight = (pollsArray) => {
    if (!highlightId) {
      return pollsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const highlightedPoll = pollsArray.find(p => p._id === highlightId || p.id === highlightId);
    const otherPolls = pollsArray.filter(p => p._id !== highlightId && p.id !== highlightId);
    
    // Sort other polls by date
    otherPolls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Return highlighted poll first, then others
    return highlightedPoll ? [highlightedPoll, ...otherPolls] : otherPolls;
  };

  // Function to filter polls based on search query
  const filterPollsBySearch = (pollsArray) => {
    if (!searchQuery) return pollsArray;
    
    const query = searchQuery.toLowerCase();
    return pollsArray.filter(poll => 
      poll.question?.toLowerCase().includes(query) ||
      poll.description?.toLowerCase().includes(query) ||
      poll.location?.toLowerCase().includes(query) ||
      poll.category?.toLowerCase().includes(query) ||
      poll.options?.some(option => 
        (typeof option === 'string' ? option : option.text)?.toLowerCase().includes(query)
      )
    );
  };

  // Fetch all polls on mount
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await pollService.getPolls();
        const normalized = data.map((p) => normalizePoll(p));
        
        // Apply search filter if coming from search
        let processedPolls = normalized;
        if (fromSearch && searchQuery) {
          processedPolls = filterPollsBySearch(normalized);
        }
        
        // Sort with highlight priority
        const sortedPolls = sortPollsWithHighlight(processedPolls);

        setPolls(sortedPolls);
        setFilteredPolls(sortedPolls);
      } catch (err) {
        console.error("Error fetching polls:", err);
      }
    };

    fetchPolls();
  }, [searchQuery, highlightId, fromSearch]);

  // Apply filters
  useEffect(() => {
    let result = [...polls];

    // Location filter
    if (filters.location !== "All Locations") {
      result = result.filter((p) => p.location === filters.location);
    }

    // Status filter  
    if (filters.status !== "All Status") {
      result = result.filter((p) => p.status === filters.status);
    }

    // Type filters - FIXED
    if (filters.type === "My Polls") {
      // Handle multiple possible creator field structures
      result = result.filter((p) => {
        const creatorId = p.creator?._id || p.creator?.id || p.creator || p.createdBy?._id || p.createdBy?.id || p.createdBy;
        return String(creatorId) === String(currentUserId);
      });
    } else if (filters.type === "Active Polls") {
      result = result.filter((p) => 
        p.status === "Active" || p.status === "active"
      );
    } else if (filters.type === "Closed Polls") {
      result = result.filter((p) => 
        p.status === "Closed" || p.status === "closed"
      );
    } else if (filters.type === "Polls I Voted On") {
      result = result.filter((p) => {
        // Check multiple possible ways to determine if user has voted
        if (p.userHasVoted === true) return true;
        if (p.hasVoted === true) return true;
        if (p.votes && Array.isArray(p.votes)) {
          return p.votes.some(vote => {
            const voterId = vote.user?._id || vote.user?.id || vote.user || vote.userId;
            return String(voterId) === String(currentUserId);
          });
        }
        if (p.voters && Array.isArray(p.voters)) {
          return p.voters.some(voter => {
            const voterId = voter._id || voter.id || voter;
            return String(voterId) === String(currentUserId);
          });
        }
        return false;
      });
    }
    // "All Polls" doesn't need additional filtering

    // Maintain highlight order even after filtering
    const sortedResult = sortPollsWithHighlight(result);
    setFilteredPolls(sortedResult);
  }, [filters, polls, currentUserId, highlightId]);

  // Check if screen is mobile and force grid view
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
      
      // Force grid view on mobile
      if (isMobileSize) {
        setFilters(prev => ({ ...prev, view: 'Grid View' }));
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleFilterChange = (type, value) => {
    // Prevent changing view to List View on mobile
    if (type === 'view' && value === 'List View' && isMobile) {
      return;
    }
    
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  const handleCreatePoll = () => navigate("/dashboard/polls/create");

  const handleEditPoll = (poll) => {
    navigate(`/dashboard/polls/edit/${poll._id}`, {
      state: { poll }
    });
  };

  const handleDeletePoll = async (pollId) => {
    

    try {
      await pollService.deletePoll(pollId);
      setPolls(prev => prev.filter(p => p._id !== pollId && p.id !== pollId));
      setFilteredPolls(prev => prev.filter(p => p._id !== pollId && p.id !== pollId));
      setRefreshTrigger(prev => prev + 1);
      
    } catch (err) {
      console.error("Error deleting poll:", err);
      alert(err.response?.data?.message || "Error deleting poll");
    }
  };

  const handleVoted = (pollId, updatedPoll) => {
    if (updatedPoll) {
      const normalized = normalizePoll(updatedPoll);
      setPolls(prev => prev.map(p => (p._id === pollId ? normalized : p)));
      setFilteredPolls(prev => prev.map(p => (p._id === pollId ? normalized : p)));
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // Function to clear search context
  const clearSearch = () => {
    setSearchParams({});
    setRefreshTrigger(prev => prev + 1);
  };

  // Determine the actual view mode to use
  const effectiveViewMode = isMobile ? 'Grid View' : filters.view;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left mt-[70px] sm:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">Community Polls</h1>
          <p className="text-gray-600 mt-2">
            Participate in community polls and make your voice heard on local issues.
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
            <strong>Search Results:</strong> Showing polls matching your search query
            {highlightId && <span> • Selected poll is highlighted at the top</span>}
          </Alert>
        )}

        {/* Stats & Filters */}
        <div className="mb-6">
          <PollStats onCreatePoll={handleCreatePoll} refreshTrigger={refreshTrigger} />
          <PollFilters
            activeFilter={filters}
            onFilterChange={handleFilterChange}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Polls List - UPDATED FOR GRID VIEW */}
        <div className={
          effectiveViewMode === "Grid View" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" 
            : "space-y-6"
        }>
          {filteredPolls.length > 0 ? (
            filteredPolls.map((poll, index) => {
              const isHighlighted = poll._id === highlightId || poll.id === highlightId;
              return (
                <div
                  key={poll._id}
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
                  <PollCard
                    poll={poll}
                    onVoted={handleVoted}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
                    isHighlighted={isHighlighted}
                    searchQuery={fromSearch ? searchQuery : null}
                    viewMode={effectiveViewMode} // Pass view mode to PollCard
                  />
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {fromSearch && searchQuery 
                  ? `No polls found for "${searchQuery}"`
                  : "No polls found with the current filters"
                }
              </h3>
              <p className="text-gray-600 mb-8">
                {fromSearch && searchQuery
                  ? "Try adjusting your search terms or browse all polls."
                  : filters.type === "My Polls"
                    ? "You haven't created any polls yet."
                    : "Try adjusting your filters or check back later."
                }
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {fromSearch && searchQuery ? (
                  <button
                    onClick={clearSearch}
                    className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                  >
                    Browse All Polls
                  </button>
                ) : (
                  <button
                    onClick={() => handleFilterChange("type", "Active Polls")}
                    className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={handleCreatePoll}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create New Poll
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollList;
