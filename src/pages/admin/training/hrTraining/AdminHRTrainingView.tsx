import React, { useState } from 'react';
import { Upload, FileText, Image, Video, MessageSquare, Plus, Trash2, X } from 'lucide-react';

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

const AdminHRTrainingView: React.FC = () => {
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

    setTrainingContent((prev) => ({
      ...prev,
      [activeRole]: [...(prev[activeRole] || []), newContent],
    }));

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

    setQAContent((prev) => ({
      ...prev,
      [activeRole]: [...(prev[activeRole] || []), newQA],
    }));

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
                        {roleQA.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                )}
                                <div className="space-y-3 mt-3">
                                  {item.questions.map((q, idx) => (
                                    <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                                      <p className="font-medium text-gray-900 mb-2">Q{idx + 1}: {q.question}</p>
                                      <div className="space-y-1">
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
                                              {q.correctAnswer === optIdx && ' ✓'}
                                            </span>
                                          </div>
                                        ))}
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
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
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
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
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

