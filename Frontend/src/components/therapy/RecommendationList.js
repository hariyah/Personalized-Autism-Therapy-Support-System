import React from 'react';
import ActivityCard from './ActivityCard';
import { FiTarget, FiZap } from 'react-icons/fi';

const RecommendationList = ({ recommendations, onSelectActivity }) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4 text-indigo-300">
                    <FiTarget size={32} />
                </div>
                <h4 className="text-xl font-bold text-indigo-900 mb-2">No Recommendations Yet</h4>
                <p className="text-indigo-600">Update the child's emotion or profile factors to get personalized activity suggestions.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <FiZap className="text-yellow-500" /> AI-Driven Recommendations
                    </h3>
                    <p className="text-gray-500 font-medium mt-1">Personalized based on emotion, interests, and profile factors</p>
                </div>
                <div className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-inner">
                    {recommendations.length} Activities Found
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recommendations.map((activity, index) => (
                    <div
                        key={activity._id || activity.id || index}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <ActivityCard
                            activity={activity}
                            onSelect={onSelectActivity}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationList;
