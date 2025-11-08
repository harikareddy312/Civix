import React, { useMemo } from 'react';

const SentimentChart = ({ polls }) => {
  // Calculate sentiment based on actual vote data
  const sentimentData = useMemo(() => {
    if (!polls || polls.length === 0) 
      return { positive: 0, negative: 0, neutral: 0 };

    const result = { positive: 0, negative: 0, neutral: 0 };

    polls.forEach(poll => {
      const votes = poll.votes || [];
      const totalVotes = votes.length;
      if (totalVotes === 0) {
        result.neutral++;
        return;
      }

      // Count votes per option
      const optionCounts = poll.options?.map((_, i) =>
        votes.filter(v => v.option === i).length
      ) || [];

      const topVotes = Math.max(...optionCounts);
      const dominance = (topVotes / totalVotes) * 100; // %

      if (dominance > 55) {
        result.positive++;
      } 
      else if (dominance < 45) {
        result.negative++;
      } 
      else {
        result.neutral++;
      }
    });

    const total = polls.length;

    return {
      positive: Math.round((result.positive / total) * 100),
      negative: Math.round((result.negative / total) * 100),
      neutral: Math.round((result.neutral / total) * 100)
    };
  }, [polls]);

  // UPDATED: Calculate engagement based on votes per day
  const engagementData = useMemo(() => {
    if (!polls || polls.length === 0) return [];

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayPolls = polls.filter(poll => {
        const pollDate = new Date(poll.createdAt);
        return pollDate >= dayStart && pollDate <= dayEnd;
      });

      // Calculate engagement from actual vote data
      const totalVotes = dayPolls.reduce((sum, poll) => sum + (poll.votes?.length || 0), 0);
      const totalPolls = dayPolls.length;
      
      // Calculate votes per day for polls created on this day
      const avgEngagement = dayPolls.reduce((sum, poll) => {
        const pollVotes = poll.votes?.length || 0;
        if (pollVotes === 0) return sum;
        
        const createdAt = new Date(poll.createdAt);
        const now = new Date();
        const daysAgo = Math.max((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24), 0.01);
        
        return sum + (pollVotes / daysAgo);
      }, 0);

      last7Days.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        engagement: totalPolls > 0 ? Math.round((avgEngagement / totalPolls) * 10) / 10 : 0,
        polls: totalPolls,
        votes: totalVotes
      });
    }

    return last7Days;
  }, [polls]);

  const maxEngagement = Math.max(...engagementData.map(d => d.engagement), 1);

  // NEW: Calculate total votes across all polls
  const totalVotes = useMemo(() => {
    return polls?.reduce((sum, poll) => sum + (poll.votes?.length || 0), 0) || 0;
  }, [polls]);

  // NEW: Calculate average votes per day across all polls
  const avgVotesPerDay = useMemo(() => {
    if (!polls || polls.length === 0) return 0;

    const totalEngagement = polls.reduce((sum, poll) => {
      const pollVotes = poll.votes?.length || 0;
      if (pollVotes === 0 || !poll.createdAt) return sum;
      
      const createdAt = new Date(poll.createdAt);
      const now = new Date();
      const daysAgo = Math.max((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24), 0.01);
      
      return sum + (pollVotes / daysAgo);
    }, 0);

    return (totalEngagement / polls.length).toFixed(1);
  }, [polls]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Sentiment Analysis</h3>
        <p className="text-sm text-gray-600">
          Real-time sentiment distribution and engagement trends across all polls
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Sentiment Distribution</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${sentimentData.positive}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-10">
                  {sentimentData.positive}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Negative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${sentimentData.negative}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-10">
                  {sentimentData.negative}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-700">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 transition-all duration-500"
                    style={{ width: `${sentimentData.neutral}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-10">
                  {sentimentData.neutral}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Community Sentiment:</strong> {' '}
              {sentimentData.positive > sentimentData.negative && sentimentData.positive > sentimentData.neutral
                ? <span className="text-green-600 font-medium">Generally Positive</span>
                : sentimentData.negative > sentimentData.positive && sentimentData.negative > sentimentData.neutral
                ? <span className="text-red-600 font-medium">Generally Negative</span>
                : <span className="text-gray-600 font-medium">Balanced/Neutral</span>
              }
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Based on {totalVotes.toLocaleString()} votes across {polls?.length || 0} polls
            </div>
          </div>

          {/* Sentiment rules for user clarity (no emojis) */}
          <div className="mt-3 p-3 bg-white border border-gray-100 rounded text-xs text-gray-600">
            <div className="font-medium text-gray-800 mb-2">How sentiment is assigned</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Dominance = (votes for top option ÷ total votes) × 100</li>
              <li>&gt; 55% — Positive</li>
              <li>&lt; 45% — Negative</li>
              <li>45–55% — Neutral</li>
            </ul>
            <div className="mt-2">
              Sentiment is computed per poll from actual vote counts. The charts above show the percentage of polls classified into these categories.
            </div>
          </div>
        </div>

        {/* Engagement Trends */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">7-Day Engagement Trend</h4>
          
          <div className="space-y-3">
            {engagementData.map((day, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-xs text-gray-600 text-right">
                  {day.date}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${(day.engagement / maxEngagement) * 100}%` }}
                      >
                        {day.engagement > 0 && (
                          <span className="text-xs text-white font-medium">
                            {day.engagement}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 w-20">
                      {day.votes} votes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Avg Engagement Rate:</strong> {' '}
              <span className="text-blue-600 font-medium">
                {avgVotesPerDay} votes/day
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Total votes this week: {engagementData.reduce((sum, d) => sum + d.votes, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data • Updates every 30 seconds</span>
          </div>
          <span>Based on {polls?.length || 0} polls • {totalVotes.toLocaleString()} total votes</span>
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;