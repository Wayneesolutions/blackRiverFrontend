import React, { useState } from 'react';
import { Upload, FileText, Image, Video, MessageSquare, Plus, Trash2, X, CheckCircle2, XCircle, User, Clock, Award, TrendingUp, ChevronDown, CheckCircle } from 'lucide-react';

interface TrainingContent {
  id: string;
  type: 'video' | 'pdf' | 'image';
  title: string;
  description?: string;
  url?: string;
  uploadedAt: string;
}

interface QAItem {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    question: string;
    options: [string, string, string, string];
    correctAnswer: number;
  }>;
  createdAt: string;
}

const roles = [
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'fleet-maintenance-manager', label: 'Fleet Maintenance Manager' },
  { value: 'compliance-manager', label: 'Compliance Manager' },
  { value: 'safety-officer', label: 'Safety Officer' },
  { value: 'accountant', label: 'Accountant' },
];

// Static user list for HR role with pass/fail status
const staticUsersByRole: Record<string, Array<{ id: string; name: string; status: 'passed' | 'failed' | 'not-attempted'; score?: number; total?: number }>> = {
  hr: [
    { id: 'user1', name: 'Sarah Johnson', status: 'passed', score: 5, total: 5 },
    { id: 'user2', name: 'Michael Brown', status: 'passed', score: 4, total: 5 },
    { id: 'user3', name: 'Emily Davis', status: 'passed', score: 5, total: 5 },
    { id: 'user4', name: 'David Wilson', status: 'failed', score: 2, total: 5 },
    { id: 'user5', name: 'Lisa Anderson', status: 'not-attempted' },
    { id: 'user6', name: 'James Taylor', status: 'passed', score: 4, total: 5 }
  ]
};

// Static results data for admin view - structure: role -> userId -> qaId -> results
// This tracks results for multiple users of the same role
const adminStaticResults: Record<string, Record<string, Record<string, { answers: Record<number, number>; score: { correct: number; total: number }; completedAt: string; userName?: string }>>> = {
  dispatcher: {
    'user1': {
      'qa1': { answers: { 0: 1, 1: 1, 2: 1, 3: 1 }, score: { correct: 4, total: 4 }, completedAt: new Date().toISOString(), userName: 'John Doe' },
      'qa2': { answers: { 0: 1, 1: 0, 2: 1 }, score: { correct: 2, total: 3 }, completedAt: new Date(Date.now() - 86400000).toISOString(), userName: 'John Doe' }
    },
    'user2': {
      'qa1': { answers: { 0: 1, 1: 0, 2: 1, 3: 1 }, score: { correct: 3, total: 4 }, completedAt: new Date(Date.now() - 172800000).toISOString(), userName: 'Jane Smith' }
    },
    'user3': {
      'qa1': { answers: { 0: 1, 1: 1, 2: 0, 3: 1 }, score: { correct: 3, total: 4 }, completedAt: new Date(Date.now() - 259200000).toISOString(), userName: 'Mike Johnson' }
    }
  },
  'fleet-maintenance-manager': {
    'user1': {
      'qa3': { answers: { 0: 1, 1: 1 }, score: { correct: 2, total: 2 }, completedAt: new Date().toISOString(), userName: 'Tom Wilson' }
    },
    'user2': {
      'qa3': { answers: { 0: 1, 1: 0 }, score: { correct: 1, total: 2 }, completedAt: new Date(Date.now() - 86400000).toISOString(), userName: 'Sarah Brown' }
    }
  },
  'compliance-manager': {
    'user1': {
      'qa4': { answers: { 0: 0, 1: 1, 2: 1 }, score: { correct: 2, total: 3 }, completedAt: new Date().toISOString(), userName: 'David Lee' }
    }
  },
  'safety-officer': {
    'user1': {
      'qa5': { answers: { 0: 1, 1: 1 }, score: { correct: 2, total: 2 }, completedAt: new Date().toISOString(), userName: 'Emily Davis' }
    }
  },
  accountant: {
    'user1': {
      'qa6': { answers: { 0: 1, 1: 1 }, score: { correct: 2, total: 2 }, completedAt: new Date().toISOString(), userName: 'Robert Taylor' }
    }
  }
};

const AdminHRTrainingView: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [trainingContent, setTrainingContent] = useState<Record<string, TrainingContent[]>>({
    dispatcher: [],
    'fleet-maintenance-manager': [],
    'compliance-manager': [],
    'safety-officer': [],
    accountant: [],
  });
  
  const [qaContent, setQAContent] = useState<Record<string, QAItem[]>>({
    dispatcher: [],
    'fleet-maintenance-manager': [],
    'compliance-manager': [],
    'safety-officer': [],
    accountant: [],
  });
  
  // Static results state - structure: role -> userId -> qaId -> results
  const [qaResults] = useState<Record<string, Record<string, Record<string, { answers: Record<number, number>; score: { correct: number; total: number }; completedAt: string; userName?: string }>>>>(adminStaticResults);
  
  // Helper function to get aggregate statistics for a role and quiz
  const getQuizStats = (role: string, qaId: string) => {
    const roleResults = qaResults[role] || {};
    const allUserResults = Object.values(roleResults).map(userResults => userResults[qaId]).filter(Boolean);
    
    if (allUserResults.length === 0) return null;
    
    const totalUsers = allUserResults.length;
    const avgScore = allUserResults.reduce((sum, r) => sum + (r.score.correct / r.score.total), 0) / totalUsers;
    const totalQuestions = allUserResults[0]?.score.total || 0;
    
    return {
      totalUsers,
      avgScore,
      totalQuestions,
      completedCount: totalUsers
    };
  };
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQAModal, setShowQAModal] = useState(false);
  const [uploadType, setUploadType] = useState<'video' | 'pdf' | 'image'>('video');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // Q&A Modal states
  const [qaTitle, setQATitle] = useState('');
  const [qaDescription, setQADescription] = useState('');
  const [qaQuestions, setQAQuestions] = useState<Array<{
    question: string;
    options: [string, string, string, string];
    correctAnswer: number;
  }>>([]);
  const [currentQQuestion, setCurrentQQuestion] = useState('');
  const [currentQOptions, setCurrentQOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [currentQCorrectAnswer, setCurrentQCorrectAnswer] = useState<number>(0);
  
  const [activeRole, setActiveRole] = useState<string>('dispatcher');

  const handleUpload = () => {
    if (!uploadTitle.trim()) return;

    const newContent: TrainingContent = {
      id: Date.now().toString(),
      type: uploadType,
      title: uploadTitle,
      description: uploadDescription,
      uploadedAt: new Date().toISOString(),
    };

    // Add to all roles since admin doesn't select role
    setTrainingContent((prev) => {
      const updated = { ...prev };
      roles.forEach((role) => {
        updated[role.value] = [...(updated[role.value] || []), newContent];
      });
      return updated;
    });

    setUploadTitle('');
    setUploadDescription('');
    setShowUploadModal(false);
  };

  const handleAddQuestionToQA = () => {
    if (!currentQQuestion.trim() || currentQOptions.some(opt => !opt.trim())) return;
    
    setQAQuestions((prev) => [
      ...prev,
      {
        question: currentQQuestion,
        options: [...currentQOptions] as [string, string, string, string],
        correctAnswer: currentQCorrectAnswer,
      }
    ]);
    
    setCurrentQQuestion('');
    setCurrentQOptions(['', '', '', '']);
    setCurrentQCorrectAnswer(0);
  };

  const handleRemoveQuestionFromQA = (index: number) => {
    setQAQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQA = () => {
    if (!qaTitle.trim() || qaQuestions.length === 0) return;

    const newQA: QAItem = {
      id: Date.now().toString(),
      title: qaTitle,
      description: qaDescription,
      questions: qaQuestions,
      createdAt: new Date().toISOString(),
    };

    // Add to all roles since admin doesn't select role
    setQAContent((prev) => {
      const updated = { ...prev };
      roles.forEach((role) => {
        updated[role.value] = [...(updated[role.value] || []), newQA];
      });
      return updated;
    });

    setQATitle('');
    setQADescription('');
    setQAQuestions([]);
    setCurrentQQuestion('');
    setCurrentQOptions(['', '', '', '']);
    setCurrentQCorrectAnswer(0);
    setShowQAModal(false);
  };

  const handleDeleteContent = (id: string, role: string) => {
    setTrainingContent((prev) => ({
      ...prev,
      [role]: prev[role].filter((item) => item.id !== id),
    }));
  };

  const handleDeleteQA = (id: string, role: string) => {
    setQAContent((prev) => ({
      ...prev,
      [role]: prev[role].filter((item) => item.id !== id),
    }));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 bg-[#EDF8FF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Training Content</h1>
          <p className="text-gray-600">
            View all training materials and Q&A content managed by HR
          </p>
        </div>

        <div className="flex gap-6">
          {/* Quiz Results Sidebar - HR Users Only */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Quiz Results</h2>
                <p className="text-xs text-gray-500 mt-1">HR Users Only</p>
              </div>
              <div className="p-4 space-y-3">
                {(() => {
                  const hrRole = { value: 'hr', label: 'HR' };
                  const roleResults = qaResults['hr'] || {};
                  const roleQAs = qaContent['hr'] || [];
                  
                  // Calculate aggregate stats across all HR users
                  let totalUsersCompleted = 0;
                  let totalCompletions = 0;
                  let totalScoreSum = 0;
                  
                  roleQAs.forEach((qa) => {
                    const stats = getQuizStats('hr', qa.id);
                    if (stats) {
                      totalUsersCompleted = Math.max(totalUsersCompleted, stats.totalUsers);
                      totalCompletions += stats.completedCount;
                      totalScoreSum += stats.avgScore;
                    }
                  });
                  
                  const avgScore = roleQAs.length > 0 ? totalScoreSum / roleQAs.length : 0;
                  const uniqueUsers = new Set(Object.keys(roleResults)).size;
                  const roleUsers = staticUsersByRole['hr'] || [];
                  const isDropdownOpen = openDropdown === 'hr';
                  const passedCount = roleUsers.filter(u => u.status === 'passed').length;
                  const failedCount = roleUsers.filter(u => u.status === 'failed').length;
                  const notAttemptedCount = roleUsers.filter(u => u.status === 'not-attempted').length;

                  return (
                    <div className="rounded-lg border-2 transition-all border-gray-200 bg-gray-50 hover:border-gray-300">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">HR</span>
                          {avgScore > 0 && (
                            <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              avgScore >= 0.9 ? 'bg-green-100 text-green-700' : 
                              avgScore >= 0.7 ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {Math.round(avgScore * 100)}%
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User className="w-3.5 h-3.5" />
                            <span>{uniqueUsers || roleUsers.length} user{(uniqueUsers || roleUsers.length) !== 1 ? 's' : ''} completed</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Award className="w-3.5 h-3.5" />
                            <span>{totalCompletions || passedCount} total completion{(totalCompletions || passedCount) !== 1 ? 's' : ''}</span>
                          </div>
                          {avgScore > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div
                                className={`h-1.5 rounded-full ${
                                  avgScore >= 0.9 ? 'bg-green-500' : avgScore >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${avgScore * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Dropdown Toggle Button */}
                        <button
                          onClick={() => setOpenDropdown(isDropdownOpen ? null : 'hr')}
                          className="w-full mt-3 flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <span>View Users ({roleUsers.length})</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {/* Dropdown Content */}
                      {isDropdownOpen && (
                        <div className="border-t border-gray-200 bg-white rounded-b-lg">
                          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                            {roleUsers.map((user) => {
                              const getStatusBadge = () => {
                                if (user.status === 'passed') {
                                  return (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Passed</span>
                                      {user.score !== undefined && (
                                        <span className="font-bold">({user.score}/{user.total})</span>
                                      )}
                                    </div>
                                  );
                                } else if (user.status === 'failed') {
                                  return (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                                      <XCircle className="w-3 h-3" />
                                      <span>Failed</span>
                                      {user.score !== undefined && (
                                        <span className="font-bold">({user.score}/{user.total})</span>
                                      )}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                      <Clock className="w-3 h-3" />
                                      <span>Not Attempted</span>
                                    </div>
                                  );
                                }
                              };

                              return (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: 'linear-gradient(135deg, #0ea3d8 0%, #0d8fc4 100%)' }}
                                    >
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <span className="text-sm text-gray-900 font-medium">{user.name}</span>
                                  </div>
                                  {getStatusBadge()}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Summary Footer */}
                          <div className="border-t border-gray-200 p-2 bg-gray-50 rounded-b-lg">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-semibold text-green-700">{passedCount}</div>
                                <div className="text-gray-600">Passed</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-red-700">{failedCount}</div>
                                <div className="text-gray-600">Failed</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-gray-600">{notAttemptedCount}</div>
                                <div className="text-gray-600">Pending</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">

        {/* Training Materials Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Training Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  All training materials across all roles
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setUploadType('video');
                  setUploadTitle('');
                  setUploadDescription('');
                  setActiveRole('dispatcher');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc4] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload Content
              </button>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(trainingContent).every(key => trainingContent[key].length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No training materials uploaded yet</p>
                <p className="text-sm mt-2">HR can upload training materials for different roles</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roles.map((role) => {
                  const roleContent = trainingContent[role.value] || [];
                  if (roleContent.length === 0) return null;
                  return (
                    <div key={role.value} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                        {role.label}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roleContent.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="text-[#0ea3d8]">{getIcon(item.type)}</div>
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              </div>
                              <button
                                onClick={() => handleDeleteContent(item.id, role.value)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-2 mb-3">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                              <span className="capitalize bg-gray-200 px-2 py-1 rounded">{item.type}</span>
                              <span>
                                {new Date(item.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Q&A Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Q&A Content</h2>
                <p className="text-sm text-gray-600 mt-1">
                  All questions and answers across all roles
                </p>
              </div>
              <button
                onClick={() => {
                  setShowQAModal(true);
                  setQATitle('');
                  setQADescription('');
                  setQAQuestions([]);
                  setCurrentQQuestion('');
                  setCurrentQOptions(['', '', '', '']);
                  setCurrentQCorrectAnswer(0);
                  setActiveRole('dispatcher');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc4] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Q&A
              </button>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(qaContent).every(key => qaContent[key].length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No Q&A content added yet</p>
                <p className="text-sm mt-2">HR can add Q&A content for different roles</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roles.map((role) => {
                  const roleQA = qaContent[role.value] || [];
                  if (roleQA.length === 0) return null;
                  return (
                    <div key={role.value} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                        {role.label}
                      </h3>
                      <div className="space-y-4">
                        {roleQA.map((item) => {
                          const stats = getQuizStats(role.value, item.id);
                          const roleResults = qaResults[role.value] || {};
                          const allUserResults = Object.entries(roleResults)
                            .map(([userId, userResults]) => ({
                              userId,
                              result: userResults[item.id],
                              userName: userResults[item.id]?.userName || `User ${userId.slice(-4)}`
                            }))
                            .filter(entry => entry.result);
                          
                          return (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                    {stats && (
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                                          <span className="text-xs font-medium text-gray-600">Avg Score:</span>
                                          <span className={`text-sm font-bold ${stats.avgScore >= 0.9 ? 'text-green-600' : stats.avgScore >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {Math.round(stats.avgScore * 100)}%
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                                          <span className="text-xs font-medium text-gray-600">Completed:</span>
                                          <span className="text-sm font-bold text-gray-700">{stats.totalUsers} user{stats.totalUsers !== 1 ? 's' : ''}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                  )}
                                  
                                  {/* User Results Cards */}
                                  {allUserResults.length > 0 && (
                                    <div className="mt-4 mb-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-4 h-4 text-[#0ea3d8]" />
                                        <h4 className="text-sm font-semibold text-gray-700">User Results</h4>
                                        <span className="text-xs text-gray-500">({allUserResults.length} {allUserResults.length === 1 ? 'user' : 'users'})</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {allUserResults.map(({ userId, result, userName }) => {
                                          const percentage = (result.score.correct / result.score.total) * 100;
                                          const getScoreColor = () => {
                                            if (percentage >= 90) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' };
                                            if (percentage >= 70) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
                                            return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
                                          };
                                          const colors = getScoreColor();
                                          const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                          
                                          return (
                                            <div key={userId} className={`bg-white rounded-lg border-2 ${colors.border} p-4 hover:shadow-md transition-shadow`}>
                                              <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                                                    style={{ background: 'linear-gradient(135deg, #0ea3d8 0%, #0d8fc4 100%)' }}
                                                  >
                                                    {initials}
                                                  </div>
                                                  <div>
                                                    <h5 className="font-semibold text-gray-900 text-sm">{userName}</h5>
                                                    <p className="text-xs text-gray-500 mt-0.5">{role.label}</p>
                                                  </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-full ${colors.badge} text-xs font-semibold`}>
                                                  {Math.round(percentage)}%
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Award className="w-3.5 h-3.5" />
                                                    Score
                                                  </span>
                                                  <span className={`text-sm font-bold ${colors.text}`}>
                                                    {result.score.correct}/{result.score.total}
                                                  </span>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                  <div
                                                    className={`h-2 rounded-full transition-all ${
                                                      percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                  />
                                                </div>
                                                
                                                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(result.completedAt).toLocaleDateString('en-US', { 
                                                      month: 'short', 
                                                      day: 'numeric',
                                                      year: 'numeric'
                                                    })}
                                                  </span>
                                                  <span className="text-gray-400">
                                                    {new Date(result.completedAt).toLocaleTimeString('en-US', { 
                                                      hour: '2-digit', 
                                                      minute: '2-digit' 
                                                    })}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Questions Display (showing correct answers) */}
                                  <div className="space-y-3 mt-3">
                                    {item.questions.map((q, idx) => (
                                      <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                                        <p className="font-medium text-gray-900 mb-2">Q{idx + 1}: {q.question}</p>
                                        <div className="space-y-1">
                                          {q.options.map((option, optIdx) => {
                                            const isCorrectOption = q.correctAnswer === optIdx;
                                            return (
                                              <div key={optIdx} className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  checked={isCorrectOption}
                                                  readOnly
                                                  className="w-4 h-4"
                                                />
                                                <span className={`text-sm ${isCorrectOption ? 'text-green-600 font-medium' : 'text-gray-600'} flex items-center gap-2`}>
                                                  {String.fromCharCode(65 + optIdx)}. {option}
                                                  {isCorrectOption && ' ✓ (Correct Answer)'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteQA(item.id, role.value)}
                                  className="text-red-600 hover:text-red-700 p-1 ml-4"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload Training Content</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadTitle('');
                    setUploadDescription('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Add a new training material</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadType('video')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      uploadType === 'video'
                        ? 'bg-[#0ea3d8] !text-white border-[#0ea3d8]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-4 h-4 inline mr-2" />
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('pdf')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      uploadType === 'pdf'
                        ? 'bg-[#0ea3d8] !text-white border-[#0ea3d8]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('image')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      uploadType === 'image'
                        ? 'bg-[#0ea3d8] !text-white border-[#0ea3d8]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Image className="w-4 h-4 inline mr-2" />
                    Image
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter content title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter content description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadTitle('');
                    setUploadDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc4] transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Q&A Modal */}
      {showQAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowQAModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Q&A</h3>
                <button
                  onClick={() => {
                    setShowQAModal(false);
                    setQATitle('');
                    setQADescription('');
                    setQAQuestions([]);
                    setCurrentQQuestion('');
                    setCurrentQOptions(['', '', '', '']);
                    setCurrentQCorrectAnswer(0);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Create questions with multiple choice answers</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="qa-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  id="qa-title"
                  type="text"
                  value={qaTitle}
                  onChange={(e) => setQATitle(e.target.value)}
                  placeholder="Enter Q&A title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="qa-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="qa-description"
                  value={qaDescription}
                  onChange={(e) => setQADescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                />
              </div>

              {/* Existing Questions */}
              {qaQuestions.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Added Questions ({qaQuestions.length})
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {qaQuestions.map((q, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900 flex-1">Q{index + 1}: {q.question}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromQA(index)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1 mt-2">
                          {q.options.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={q.correctAnswer === optIdx}
                                readOnly
                                className="w-4 h-4"
                              />
                              <span className={`text-sm ${q.correctAnswer === optIdx ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                {String.fromCharCode(65 + optIdx)}. {option}
                                {q.correctAnswer === optIdx && ' ✓ (Correct)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Question */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add New Question
                </label>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-question" className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      id="new-question"
                      value={currentQQuestion}
                      onChange={(e) => setCurrentQQuestion(e.target.value)}
                      placeholder="Enter question"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                    />
                  </div>

                  {/* 4 Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options (4 required) *
                    </label>
                    <div className="space-y-2">
                      {currentQOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={currentQCorrectAnswer === idx}
                            onChange={() => setCurrentQCorrectAnswer(idx)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-700 w-6">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQOptions] as [string, string, string, string];
                              newOptions[idx] = e.target.value;
                              setCurrentQOptions(newOptions);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select the radio button next to the correct answer
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestionToQA}
                    disabled={!currentQQuestion.trim() || currentQOptions.some(opt => !opt.trim())}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowQAModal(false);
                    setQATitle('');
                    setQADescription('');
                    setQAQuestions([]);
                    setCurrentQQuestion('');
                    setCurrentQOptions(['', '', '', '']);
                    setCurrentQCorrectAnswer(0);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQA}
                  disabled={!qaTitle.trim() || qaQuestions.length === 0}
                  className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Q&A
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHRTrainingView;

