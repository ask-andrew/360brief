
import React from 'react';
import type { TopicSentimentDataPoint } from '../../types';

interface SentimentByTopicChartProps {
  data: TopicSentimentDataPoint[];
}

export const SentimentByTopicChart: React.FC<SentimentByTopicChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                No topic data available.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pr-2">
            <ul className="space-y-4">
                {data.map((item) => (
                    <li key={item.topic} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={item.topic}>
                                {item.topic}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
                                {item.negative > 0 && <span className="text-red-500">{item.negative} neg</span>}
                                {item.negative > 0 && item.positive > 0 && <span>, </span>}
                                {item.positive > 0 && <span className="text-green-500">{item.positive} pos</span>}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 flex overflow-hidden">
                            <div
                                className="bg-green-500 h-2.5"
                                style={{ width: `${(item.positive / item.total) * 100}%` }}
                                title={`${item.positive} Positive`}
                            ></div>
                            <div
                                className="bg-red-500 h-2.5"
                                style={{ width: `${(item.negative / item.total) * 100}%` }}
                                title={`${item.negative} Negative`}
                            ></div>
                             <div
                                className="bg-slate-400 dark:bg-slate-500 h-2.5"
                                style={{ width: `${(item.neutral / item.total) * 100}%` }}
                                title={`${item.neutral} Neutral`}
                            ></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
