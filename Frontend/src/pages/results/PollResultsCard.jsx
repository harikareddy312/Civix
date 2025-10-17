import React, { useState, useEffect, useMemo, useRef } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';

const PollResultsCard = ({ poll, showSentiment = true, isHighlighted = false, realTimeUpdate = false }) => {
  const [animationKey, setAnimationKey] = useState(0);
  const previousVotesRef = useRef({});

  // Calculate real-time vote distribution
  const voteDistribution = useMemo(() => {
    if (!poll) return [];

    let totalVotes = 0;
    let voteBreakdown = {};

    // Handle different vote data structures
    if (poll.votes) {
      if (Array.isArray(poll.votes)) {
        // If votes is an array of vote objects
        totalVotes = poll.votes.length;
        poll.votes.forEach(vote => {
          const option = vote.option || vote.choice;
          voteBreakdown[option] = (voteBreakdown[option] || 0) + 1;
        });
      } else if (typeof poll.votes === 'object') {
        // If votes is an object with option counts
        voteBreakdown = { ...poll.votes };
        totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
      }
    }

    // Use existing voteDistribution if available, otherwise calculate from votes
    if (poll.voteDistribution && Array.isArray(poll.voteDistribution)) {
      return poll.voteDistribution.map(option => ({
        ...option,
        votes: typeof option.votes === 'number' ? option.votes : 0,
        percentage: typeof option.percentage === 'number' ? option.percentage : 0
      }));
    }

    // Calculate distribution from options and votes
    if (poll.options && Array.isArray(poll.options)) {
      return poll.options.map((option, index) => {
        const optionText = typeof option === 'string' ? option : option.text || option;
        let optionVotes = 0;

        // Try different ways to get vote count
        if (voteBreakdown[optionText] !== undefined) {
          optionVotes = voteBreakdown[optionText];
        } else if (voteBreakdown[index] !== undefined) {
          optionVotes = voteBreakdown[index];
        } else if (voteBreakdown[option] !== undefined) {
          optionVotes = voteBreakdown[option];
        }

        const percentage = totalVotes > 0 ? ((optionVotes / totalVotes) * 100) : 0;

        return {
          option: optionText,
          votes: typeof optionVotes === 'number' ? optionVotes : 0,
          percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal
        };
      });
    }

    return [];
  }, [poll]);

  // Calculate real-time metrics
  const metrics = useMemo(() => {
    const totalVotes = voteDistribution.reduce((sum, option) => sum + option.votes, 0);
    
    // Calculate engagement rate
    let engagementRate = 0;
    if (poll.createdAt) {
      const createdAt = new Date(poll.createdAt);
      const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      engagementRate = hoursAgo > 0 ? Math.round((totalVotes / Math.max(hoursAgo, 1)) * 10) / 10 : 0;
    }

    return {
      totalVotes: poll.totalVotes || totalVotes,
      engagementRate: poll.engagementRate || engagementRate,
      participationRate: poll.participationRate || (totalVotes > 0 ? 100 : 0)
    };
  }, [poll, voteDistribution]);

  // Track vote changes for animations - FIXED VERSION
  useEffect(() => {
    const currentVotes = {};
    voteDistribution.forEach(option => {
      currentVotes[option.option] = option.votes;
    });

    // Check if votes changed by comparing with ref
    const previousVotes = previousVotesRef.current;
    const hasChanged = Object.keys(currentVotes).some(
      option => currentVotes[option] !== previousVotes[option]
    );

    // Only trigger animation if there was a previous state and votes changed
    if (hasChanged && Object.keys(previousVotes).length > 0) {
      setAnimationKey(prev => prev + 1);
    }

    // Update ref with current votes
    previousVotesRef.current = currentVotes;
  }, [voteDistribution]); // Remove previousVotes from dependency array

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <CheckCircleIcon className="w-4 h-4" />;
      case 'negative': return <CancelIcon className="w-4 h-4" />;
      default: return <RemoveCircleIcon className="w-4 h-4" />;
    }
  };

  const getEngagementColor = (rate) => {
    if (rate > 5) return 'text-green-600';
    if (rate > 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Animation classes for progress bars
  const getProgressBarClasses = (index, hasUpdate = false) => {
    const baseClasses = 'h-full transition-all duration-500';
    const colorClasses = index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        'bg-purple-500';
    
    const animationClasses = hasUpdate ? 'animate-pulse' : '';
    
    return `${baseClasses} ${colorClasses} ${animationClasses}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
    }`} 
    style={{ 
      height: '400px', // Fixed height
      width: '100%',   // Fixed width (or use specific px value like '350px')
      maxWidth: '400px' // Optional: set max width for consistency
    }}>
      
      {/* Scrollable content container */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          {/* Highlight indicator */}
          {/* {isHighlighted && (
            <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <AssessmentIcon className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  Detailed Analysis View
                </span>
              </div>
            </div>
          )} */}

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                poll.status === 'Active' || poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {poll.status}
              </span>
              
              {showSentiment && poll.sentiment && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${getSentimentColor(poll.sentiment)}`}>
                  {getSentimentIcon(poll.sentiment)}
                  {poll.sentiment}
                </span>
              )}

              {/* Real-time indicator */}
              {/* {realTimeUpdate && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  Live
                </span>
              )} */}
            </div>
            
            <span className="text-xs text-gray-500 flex-shrink-0">
              {poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : 'No date'}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4 line-clamp-3">
            {poll.question || poll.title || 'No question available'}
          </h3>
        </div>

        {/* Scrollable middle content */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          {/* Vote Distribution */}
          <div className="space-y-3 mb-6" key={animationKey}>
            {voteDistribution.length > 0 ? (
              voteDistribution.map((option, index) => (
                <div key={`${option.option}-${index}`} className="space-y-1 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium pr-2">
                      {option.option}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-600">
                        {option.votes} votes
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {option.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={getProgressBarClasses(index, animationKey > 0)}
                      style={{ 
                        width: `${Math.max(option.percentage, 0)}%`,
                        minWidth: option.percentage > 0 ? '2px' : '0px'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No vote data available
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 mt-auto">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600" key={`total-${metrics.totalVotes}`}>
                {metrics.totalVotes}
              </div>
              <div className="text-xs text-gray-500">
                Total Votes
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${getEngagementColor(metrics.engagementRate)}`} key={`engagement-${metrics.engagementRate}`}>
                {metrics.engagementRate}
              </div>
              <div className="text-xs text-gray-500">
                Engagement
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600" key={`participation-${metrics.participationRate}`}>
                {metrics.participationRate}%
              </div>
              <div className="text-xs text-gray-500">
                Participation
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1 truncate">
                <LocationOnIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{poll.location || 'No location'}</span>
              </div>
              <span className="flex-shrink-0 ml-2">By {poll.creator?.name || 'Anonymous'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PollResultsCard;