import React, { useState, useEffect, useMemo, useRef } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';

const PollResultsCard = ({ poll, showSentiment = true, isHighlighted = false, realTimeUpdate = false }) => {
  const [animationKey, setAnimationKey] = useState(0);
  const previousVotesRef = useRef({});

  // Calculate real-time vote distribution from actual votes array
  const voteDistribution = useMemo(() => {
    if (!poll || !poll.options) return [];

    const votes = poll.votes || [];
    const totalVotes = votes.length;

    return poll.options.map((option, index) => {
      const optionVotes = votes.filter(vote => vote.option === index).length;
      const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100 * 10) / 10 : 0;

      return {
        option: typeof option === 'string' ? option : option.text || option,
        votes: optionVotes,
        percentage
      };
    });
  }, [poll]);

  // Calculate real-time metrics - UPDATED TO VOTES PER DAY
  const metrics = useMemo(() => {
    const totalVotes = poll.votes?.length || 0;
    
    // Calculate engagement rate (votes per day)
    let engagementRate = 0;
    if (poll.createdAt && totalVotes > 0) {
      const createdAt = new Date(poll.createdAt);
      const now = new Date();
      const daysAgo = Math.max((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24), 0.01); // Minimum 0.01 day to avoid division by zero
      engagementRate = Math.round((totalVotes / daysAgo) * 10) / 10;
    }

    // Calculate participation rate based on target or baseline
    const targetVotes = poll.targetVotes || 100; // Default target
    const participationRate = Math.min(Math.round((totalVotes / targetVotes) * 100), 100);

    return {
      totalVotes,
      engagementRate,
      participationRate: totalVotes > 0 ? participationRate : 0
    };
  }, [poll]);

  // Track vote changes for animations
  useEffect(() => {
    const currentVotes = {};
    voteDistribution.forEach(option => {
      currentVotes[option.option] = option.votes;
    });

    const previousVotes = previousVotesRef.current;
    const hasChanged = Object.keys(currentVotes).some(
      option => currentVotes[option] !== previousVotes[option]
    );

    if (hasChanged && Object.keys(previousVotes).length > 0) {
      setAnimationKey(prev => prev + 1);
    }

    previousVotesRef.current = currentVotes;
  }, [voteDistribution]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEngagementColor = (rate) => {
    if (rate > 50) return 'text-green-600';
    if (rate > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarClasses = (index, hasUpdate = false) => {
    const baseClasses = 'h-full transition-all duration-500';
    const colorClasses = index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        'bg-purple-500';
    
    const animationClasses = hasUpdate ? 'animate-pulse' : '';
    
    return `${baseClasses} ${colorClasses} ${animationClasses}`;
  };

  // NEW: compute sentiment for this poll using vote data (same logic as SentimentChart)
  const pollSentiment = useMemo(() => {
    if (!poll) return 'neutral';
    const votes = poll.votes || [];
    const totalVotes = votes.length;
    if (totalVotes === 0) return 'neutral';

    const optionCounts = poll.options?.map((_, i) =>
      votes.filter(v => v.option === i).length
    ) || [];

    const topVotes = Math.max(...optionCounts);
    const dominance = (topVotes / totalVotes) * 100; // %

    if (dominance > 55) return 'positive';
    if (dominance < 45) return 'negative';
    return 'neutral';
  }, [poll]);

  // use provided poll.sentiment if present, otherwise use computed one
  const displayedSentiment = pollSentiment;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1" 
    style={{ 
      height: '400px',
      width: '100%',
      maxWidth: '400px'
    }}>
      
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                poll.status === 'Active' || poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {poll.status}
              </span>
              
              {showSentiment && displayedSentiment && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${getSentimentColor(displayedSentiment)}`}>
                  {displayedSentiment}
                </span>
              )}
            </div>
            
            <span className="text-xs text-gray-500 flex-shrink-0">
              {poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : 'No date'}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4 line-clamp-3">
            {poll.question || poll.title || 'No question available'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
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

        <div className="flex-shrink-0 mt-auto">
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
                Votes/Day
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

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1 truncate">
                <LocationOnIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{poll.location || 'No location'}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <PersonIcon className="w-3 h-3" />
                <span>By {poll.creator?.name || 'Anonymous'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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