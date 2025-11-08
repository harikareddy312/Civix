import React, { useState, useEffect } from "react";
import { getCurrentUserId } from "../../utils/auth";
import { votePoll } from "../../services/pollService";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';

const PollCard = ({ poll, onVoted, onEdit, onDelete, viewMode = "List View" }) => {
  const [votedOptions, setVotedOptions] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const currentUserId = getCurrentUserId();
  const isCreator = poll.creator === currentUserId || poll.creator?._id === currentUserId;

  // Count votes for each option
  const optionCounts = (poll.options || []).map((_, idx) =>
    (poll.votes || []).filter(v => v.option === idx).length
  );

  // Get user's voted options on mount
  useEffect(() => {
    if (!poll?.votes || !currentUserId) return;
    const normalizeId = (u) => typeof u === "string" ? u : (u?._id || u?.id || "");
    const userVotes = poll.votes
      .filter(v => normalizeId(v.user) === String(currentUserId))
      .map(v => v.option);
    setVotedOptions(userVotes);
  }, [poll, currentUserId]);

  // Check if mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Direct vote/unvote on option click
  const handleOptionToggle = async (optionIdx) => {
    if (poll.status === "Closed" || poll.status === "closed" || isVoting) return;
    
    const isCurrentlyVoted = votedOptions.includes(optionIdx);
    
    console.log("Toggling option:", optionIdx, "Currently voted:", isCurrentlyVoted);
    
    try {
      setIsVoting(true);
      
      // Call backend with the option to toggle
      const result = await votePoll(poll._id, optionIdx);
      const updatedPoll = result.poll || result;
      
      console.log("Vote response:", result);
      
      // Update local state based on whether it was a vote or unvote
      if (isCurrentlyVoted) {
        // Unvote
        setVotedOptions(prev => prev.filter(opt => opt !== optionIdx));
        console.log("Unvoted from option", optionIdx);
      } else {
        // Vote
        setVotedOptions(prev => [...prev, optionIdx]);
        console.log("Voted for option", optionIdx);
      }
      
      // Notify parent component
      if (onVoted) {
        onVoted(poll._id, updatedPoll);
      }
    } catch (err) {
      console.error("Error toggling vote:", err);
      console.error("Error response:", err.response?.data);
      alert(err.response?.data?.message || "Error voting on poll");
    } finally {
      setIsVoting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    
    
    try {
      await onDelete?.(poll._id);
    } catch (err) {
      console.error("Error deleting poll:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "active": return "bg-green-100 text-green-800";
      case "Closed": return "bg-red-100 text-red-800";
      case "closed": return "bg-red-100 text-red-800";
      case "Draft": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeColor = (time) => {
    if (!time) return "text-gray-600";
    if (time.includes("minute")) return "text-green-600";
    if (time.includes("hour")) return "text-blue-600";
    if (time.includes("day")) return "text-purple-600";
    return "text-gray-600";
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'Not specified';
    }
  };

  const getTotalVotes = () => {
    return (poll.votes || []).length;
  };

  const getVotePercentage = (optionIndex, totalVotes) => {
    if (totalVotes === 0) return 0;
    const optionVotes = optionCounts[optionIndex];
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const totalVotes = getTotalVotes();
  const isGridView = isMobile ? true : viewMode === "Grid View";

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow ${
      isGridView ? 'p-4 h-full flex flex-col' : 'p-6 mb-4'
    }`}>
    
    {/* Header */}
    <div className={`flex justify-between items-start ${isGridView ? 'mb-3' : 'mb-4'} flex-shrink-0`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(poll.status)}`}>
          {poll.status}
        </span>
        
        {isCreator && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(poll)}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md text-xs font-medium hover:bg-yellow-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <span className={`text-xs ${getTimeColor(poll.time)}`}>
          {poll.time || 'Recently'}
        </span>
      </div>
    </div>

    {/* Content Area */}
    {isGridView ? (
      <div className="flex-1 overflow-y-auto pr-2 mb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400" 
           style={{ maxHeight: '250px' }}>
        
        <h3 className="font-bold text-gray-900 leading-tight text-base mb-2">
          {poll.question}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          {poll.description}
        </p>

        {/* Poll Options - WhatsApp Style */}
        <div className="space-y-2">
          {poll.options?.map((option, index) => {
            const optionVotes = optionCounts[index];
            const votePercentage = getVotePercentage(index, totalVotes);
            const isVotedOption = votedOptions.includes(index);
            
            return (
              <div
                key={index}
                onClick={() => handleOptionToggle(index)}
                className={`relative p-2 rounded-lg border transition-all duration-200 ${
                  poll.status === "Closed"
                    ? "cursor-not-allowed opacity-60"
                    : isVoting
                    ? "cursor-wait"
                    : "cursor-pointer hover:border-green-400 hover:bg-green-50"
                } ${
                  isVotedOption 
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isVotedOption
                        ? "border-green-500 bg-green-500" 
                        : "border-gray-300"
                    }`}>
                      {isVotedOption && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 text-sm break-words">
                      {typeof option === 'string' ? option : option.text}
                      {isVotedOption && <span className="text-green-600 ml-1">✓</span>}
                    </span>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold text-gray-700 text-xs">
                      {optionVotes} {optionVotes === 1 ? 'vote' : 'votes'}
                    </span>
                    {totalVotes > 0 && (
                      <div className="text-gray-500 text-xs">
                        {votePercentage}%
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                {totalVotes > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          isVotedOption ? 'bg-green-600' : 'bg-green-500'
                        }`}
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <>
        <h3 className="font-bold text-gray-900 leading-tight text-xl mb-2 pr-20">
          {poll.question}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {poll.description}
        </p>

        {/* Poll Options - WhatsApp Style */}
        <div className="mb-4">
          <div className="space-y-2">
            {poll.options?.map((option, index) => {
              const optionVotes = optionCounts[index];
              const votePercentage = getVotePercentage(index, totalVotes);
              const isVotedOption = votedOptions.includes(index);
              
              return (
                <div
                  key={index}
                  onClick={() => handleOptionToggle(index)}
                  className={`relative p-3 rounded-lg border transition-all duration-200 ${
                    poll.status === "Closed"
                      ? "cursor-not-allowed opacity-60"
                      : isVoting
                      ? "cursor-wait"
                      : "cursor-pointer hover:border-green-400 hover:bg-green-50"
                  } ${
                    isVotedOption 
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isVotedOption
                          ? "border-green-500 bg-green-500" 
                          : "border-gray-300"
                      }`}>
                        {isVotedOption && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 truncate text-base">
                        {typeof option === 'string' ? option : option.text}
                        {isVotedOption && <span className="text-green-600 ml-1">✓</span>}
                      </span>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        {optionVotes} {optionVotes === 1 ? 'vote' : 'votes'}
                      </span>
                      {totalVotes > 0 && (
                        <div className="text-gray-500 text-sm">
                          {votePercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {totalVotes > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isVotedOption ? 'bg-green-600' : 'bg-green-500'
                          }`}
                          style={{ width: `${votePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}

    {/* Footer */}
    <div className={`${isGridView ? 'mt-auto flex-shrink-0' : ''}`}>
      {isGridView ? (
        // ✅ NEW: Grid View Footer - Optimized for mobile (matching PetitionCard)
        <div className="space-y-3">
          {/* Mobile Grid: Stacked layout for better readability */}
          <div className="space-y-2">
            {/* Category and Creator */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <PersonIcon sx={{ fontSize: 12 }} />
                {poll.creator?.name || 'Anonymous'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <LocationOnIcon className="text-blue-600" style={{ fontSize: '14px' }} />
                <span className="text-xs text-blue-900 truncate">
                  {poll.location || 'Not specified'}
                </span>
              </div>
            </div>
            
            {/* Location and Closing Date */}
            <div className="flex items-center justify-between gap-2">
              {/* Location */
              /* Closing Date */}
              
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <EventIcon className="text-orange-600" style={{ fontSize: '14px' }} />
                <span className="text-xs text-orange-900 font-semibold">
                  Closes on: {poll.expiresAt ? formatDate(poll.expiresAt) : 'No end'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 py-1">
                <HowToVoteIcon className="text-green-600" style={{ fontSize: '14px' }} />
                <span className="text-xs text-green-900 font-semibold">
                  Total Votes: {totalVotes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Votes */}
            
          </div>

          {/* Voted Options Indicator */}
          {votedOptions.length > 0 && (
            <div className="text-xs text-white font-medium text-center bg-green-600 py-1.5 px-3 rounded-md">
              ✓ You voted for {votedOptions.length} option{votedOptions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <PersonIcon sx={{ fontSize: 12 }} />
              {poll.creator?.name || 'Anonymous'}
            </span>
          </div>
          
          <div className="flex items-center">
            <LocationOnIcon className="text-blue-600" style={{ fontSize: '18px' }} />
            <div className="ml-2">
              <p className="text-xs font-semibold text-blue-900 truncate" title={poll.location}>
                {poll.location || 'Not specified'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <EventIcon className="text-orange-600" style={{ fontSize: '18px' }} />
            <div className="ml-2">
              <p className="text-xs font-semibold text-orange-900 truncate">
                Closes on: {poll.expiresAt ? formatDate(poll.expiresAt) : 'No end date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HowToVoteIcon className="text-green-600" style={{ fontSize: '18px' }} />            
              <p className="text-xs font-semibold text-green-900">
                Total Votes: {totalVotes.toLocaleString()}
              </p>            
          </div>
          <div className="flex items-center gap-3">
            {votedOptions.length > 0 && (
              <div className="text-xs text-white font-medium bg-green-600 py-1.5 px-3 rounded-md whitespace-nowrap">
                ✓ You voted for {votedOptions.length} option{votedOptions.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default PollCard;
