import React from 'react';
import { FiX, FiClock, FiStar, FiPackage, FiZap, FiInfo, FiTag, FiDollarSign, FiUsers } from 'react-icons/fi';

const ActivityModal = ({ activity, onClose }) => {
    if (!activity) return null;

    const getCategoryColor = (category) => {
        switch (category) {
            case 'social': return 'from-blue-500 to-indigo-600';
            case 'behavioral': return 'from-purple-500 to-purple-700';
            case 'emotional': return 'from-pink-500 to-rose-600';
            default: return 'from-gray-500 to-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>

            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleUp">
                {/* Header Profile Section */}
                <div className={`bg-gradient-to-r ${getCategoryColor(activity.category)} p-8 text-white relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FiX size={24} />
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-md shadow-inner text-5xl">
                            {activity.icon || '🧩'}
                        </div>
                        <div>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block backdrop-blur-md">
                                {activity.category}
                            </span>
                            <h2 className="text-3xl font-black">{activity.title}</h2>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Grid Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                            <FiClock className="text-indigo-500 mb-1" size={20} />
                            <span className="text-xs text-gray-400 font-bold uppercase">Duration</span>
                            <span className="text-sm font-bold text-gray-700">{activity.duration}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                            <FiStar className="text-yellow-500 mb-1" size={20} />
                            <span className="text-xs text-gray-400 font-bold uppercase">Difficulty</span>
                            <span className="text-sm font-bold text-gray-700 capitalize">{activity.difficulty}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                            <FiDollarSign className="text-green-500 mb-1" size={20} />
                            <span className="text-xs text-gray-400 font-bold uppercase">Cost</span>
                            <span className="text-sm font-bold text-gray-700 capitalize">{activity.costLevel || 'Free'}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                            <FiUsers className="text-blue-500 mb-1" size={20} />
                            <span className="text-xs text-gray-400 font-bold uppercase">Social</span>
                            <span className="text-sm font-bold text-gray-700 capitalize">{activity.socialRequirement || 'None'}</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Description */}
                        <section>
                            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                                <FiInfo className="text-indigo-500" /> Description
                            </h4>
                            <p className="text-gray-600 leading-relaxed text-lg">{activity.description}</p>
                        </section>

                        {/* Materials & Benefits */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <section>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                                    <FiPackage className="text-orange-500" /> Materials Needed
                                </h4>
                                <ul className="space-y-2">
                                    {activity.materials?.map((m, i) => (
                                        <li key={i} className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> {m}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                            <section>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                                    <FiZap className="text-yellow-500" /> Key Benefits
                                </h4>
                                <ul className="space-y-2">
                                    {activity.benefits?.map((b, i) => (
                                        <li key={i} className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> {b}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Tags */}
                        <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            <h4 className="flex items-center gap-2 text-indigo-700 font-bold mb-4">
                                <FiTag /> Related Interests
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {activity.interestTags?.map((tag, i) => (
                                    <span key={i} className="bg-white text-indigo-600 px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm border border-indigo-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
