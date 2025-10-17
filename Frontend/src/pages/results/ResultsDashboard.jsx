import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pollService } from '../../services/pollService';
import { getCurrentUserId } from '../../utils/auth';
import SentimentChart from './SentimentChart';
import PollResultsCard from './PollResultsCard';
import ResultsFilters from './ResultsFilters';
import ResultsStats from './ResultsStats';

const ResultsDashboard = () => {
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All Status',
    timeRange: 'All Time',
    pollType: 'All Polls'
  });
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [highlightedPollId, setHighlightedPollId] = useState(null);
  const [focusedPoll, setFocusedPoll] = useState(null);
  const currentUserId = getCurrentUserId();

  // Fetch polls data
  const fetchPolls = async () => {
    try {
      setLoading(true);
      const pollsData = await pollService.getPolls();
      
      // Calculate sentiment and engagement metrics for each poll
      const enrichedPolls = pollsData.map(poll => ({
        ...poll,
        ...calculatePollMetrics(poll)
      }));

      setPolls(enrichedPolls);
      setError(null);
    } catch (err) {
      console.error('Error fetching polls for results:', err);
      setError('Failed to load poll results');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sentiment and engagement metrics
  const calculatePollMetrics = (poll) => {
    const totalVotes = poll.votes?.length || 0;
    const options = poll.options || [];
    
    // Calculate vote distribution
    const voteDistribution = options.map(option => ({
      option: option.text || option,
      votes: poll.votes?.filter(vote => vote.option === option.text || vote.option === option).length || 0,
      percentage: totalVotes > 0 ? 
        ((poll.votes?.filter(vote => vote.option === option.text || vote.option === option).length || 0) / totalVotes * 100).toFixed(1)
        : 0
    }));

    // Calculate engagement rate
    const createdHoursAgo = (Date.now() - new Date(poll.createdAt)) / (1000 * 60 * 60);
    const engagementRate = createdHoursAgo > 0 ? (totalVotes / Math.max(createdHoursAgo, 1)).toFixed(2) : 0;

    // Determine sentiment based on voting patterns and poll type
    let sentiment = 'neutral';
    if (poll.question?.toLowerCase().includes('support') || poll.question?.toLowerCase().includes('favor')) {
      const positiveVotes = voteDistribution.filter(v => 
        v.option.toLowerCase().includes('yes') || 
        v.option.toLowerCase().includes('support') ||
        v.option.toLowerCase().includes('agree')
      ).reduce((sum, v) => sum + parseInt(v.votes), 0);
      
      if (positiveVotes / totalVotes > 0.6) sentiment = 'positive';
      else if (positiveVotes / totalVotes < 0.4) sentiment = 'negative';
    }

    return {
      totalVotes,
      voteDistribution,
      engagementRate: parseFloat(engagementRate),
      sentiment,
      participationRate: totalVotes > 0 ? 100 : 0 // Could be enhanced with expected audience size
    };
  };

  // Filter polls based on selected filters
  useEffect(() => {
    let result = [...polls];

    // Status filter
    if (filters.status !== 'All Status') {
      result = result.filter(poll => poll.status === filters.status);
    }

    // Time range filter
    if (filters.timeRange !== 'All Time') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.timeRange) {
        case 'Last 24 Hours':
          filterDate.setHours(now.getHours() - 24);
          break;
        case 'Last Week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Last Month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate) {
        result = result.filter(poll => new Date(poll.createdAt) >= filterDate);
      }
    }

    // Poll type filter
    if (filters.pollType !== 'All Polls') {
      if (filters.pollType === 'My Polls') {
        result = result.filter(poll => 
          poll.creator?._id === currentUserId || poll.creator === currentUserId
        );
      } else if (filters.pollType === 'Polls I Voted On') {
        result = result.filter(poll => poll.userHasVoted === true);
      }
    }

    // Sort by engagement rate (most engaging first)
    result.sort((a, b) => b.engagementRate - a.engagementRate);

    setFilteredPolls(result);
  }, [polls, filters, currentUserId]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchPolls();

    const interval = setInterval(() => {
      fetchPolls();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Handle navigation from PollCard "View Report" button
  useEffect(() => {
    if (location.state?.highlightPollId) {
      setHighlightedPollId(location.state.highlightPollId);
      setFocusedPoll(location.state.focusPoll);
      
      // Auto-scroll to the highlighted poll after data loads
      setTimeout(() => {
        const element = document.getElementById(`poll-${location.state.highlightPollId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);
    }
  }, [location.state]);

  // Clear highlight after 10 seconds
  useEffect(() => {
    if (highlightedPollId) {
      const timer = setTimeout(() => {
        setHighlightedPollId(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedPollId]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleRefreshIntervalChange = (interval) => {
    setRefreshInterval(interval);
  };

  if (loading && polls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Results Dashboard</h2>
            <p className="text-gray-600">Fetching poll data and calculating metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Results Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Live sentiment analysis and engagement metrics for community polls
              </p>
            </div>
            
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-4">
              <select
                value={refreshInterval}
                onChange={(e) => handleRefreshIntervalChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
              <button
                onClick={fetchPolls}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Error handling */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
              <button 
                onClick={fetchPolls}
                className="ml-auto text-red-800 hover:text-red-900 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <ResultsStats polls={filteredPolls} loading={loading} />

        {/* Filters */}
        <ResultsFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          polls={polls}
        />

        {/* Live Sentiment Chart */}
        <div className="mb-8">
          <SentimentChart polls={filteredPolls} />
        </div>

        {/* Focused Poll Analysis - Show at top if coming from View Report */}
        {focusedPoll && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white mb-4">
              <h2 className="text-xl font-bold mb-2">📊 Detailed Poll Analysis</h2>
              <p className="text-purple-100">
                Viewing detailed analytics for: <strong>{focusedPoll.question}</strong>
              </p>
              <button
                onClick={() => {
                  setFocusedPoll(null);
                  setHighlightedPollId(null);
                }}
                className="mt-3 px-4 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors text-sm"
              >
                View All Polls
              </button>
            </div>
            
            {/* Single Poll Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PollResultsCard 
                poll={focusedPoll}
                showSentiment={true}
                isHighlighted={true}
              />
              
              {/* Additional detailed analysis for focused poll */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Engagement Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Participation</span>
                    <span className="font-semibold">{focusedPoll.totalVotes} votes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <span className="font-semibold">{focusedPoll.engagementRate} votes/hour</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Poll Status</span>
                    <span className={`font-semibold ${
                      focusedPoll.status === 'Active' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {focusedPoll.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Community Sentiment</span>
                    <span className={`font-semibold ${
                      focusedPoll.sentiment === 'positive' ? 'text-green-600' :
                      focusedPoll.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {focusedPoll.sentiment.charAt(0).toUpperCase() + focusedPoll.sentiment.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Poll Results Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Poll Results ({filteredPolls.length})
          </h2>
          
          {filteredPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPolls.map((poll, index) => (
                <div
                  key={poll._id}
                  id={`poll-${poll._id}`}
                  className={highlightedPollId === poll._id ? 'ring-2 ring-purple-500 rounded-lg' : ''}
                >
                  <PollResultsCard
                    key={poll.id}
                    poll={poll}
                    showSentiment={true}
                    isHighlighted={index === 0} // Highlight first card as example
                    realTimeUpdate={poll.status === 'active'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No poll results found
              </h3>
              <p className="text-gray-600 mb-8">
                Try adjusting your filters or check back later for new poll data.
              </p>
              <button
                onClick={() => setFilters({ status: 'All Status', timeRange: 'All Time', pollType: 'All Polls' })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;