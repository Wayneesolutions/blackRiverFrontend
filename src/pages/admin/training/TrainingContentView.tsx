import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Image, Video, MessageSquare, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { getUserRole, getUserId } from '../../../utils/auth';

interface TrainingContent {
  id: string;
  type: 'video' | 'pdf' | 'image';
  title: string;
  description?: string;
  url?: string;
  uploadedAt: string;
  questions?: Array<{
    question: string;
    answer: string;
  }>;
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

// Role mapping: user role -> training content role key
const roleMapping: Record<string, string> = {
  'dispatcher': 'dispatcher',
  'Fleet Maintenance Manager': 'fleet-maintenance-manager',
  'Compliance Manager': 'compliance-manager',
  'safety officer': 'safety-officer',
  'accountant': 'accountant',
  'hr': 'dispatcher', // HR can view all, but default to dispatcher for now
};

// Static training content data (would come from API in real app)
const staticTrainingContent: Record<string, TrainingContent[]> = {
  dispatcher: [
    {
      id: '1',
      type: 'video',
      title: 'Dispatching Best Practices',
      description: 'Learn the fundamentals of efficient load dispatching and route optimization.',
      uploadedAt: new Date().toISOString(),
      questions: [
        { question: 'What is the most important factor in load dispatching?', answer: 'Safety and driver availability' },
        { question: 'How often should you check driver status?', answer: 'Every 2-4 hours during active trips' }
      ]
    },
    {
      id: '2',
      type: 'pdf',
      title: 'Route Planning Guide',
      description: 'Comprehensive guide to planning efficient routes and managing deliveries.',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      type: 'image',
      title: 'Load Securement Standards',
      description: 'Visual guide to proper load securement techniques.',
      uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '4',
      type: 'video',
      title: 'Customer Communication Skills',
      description: 'Effective communication strategies for dispatchers when interacting with customers.',
      uploadedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: '5',
      type: 'pdf',
      title: 'Emergency Response Procedures',
      description: 'Step-by-step guide for handling emergencies and breakdowns.',
      uploadedAt: new Date(Date.now() - 345600000).toISOString(),
    }
  ],
  'fleet-maintenance-manager': [
    {
      id: '4',
      type: 'video',
      title: 'Preventive Maintenance Schedule',
      description: 'Understanding maintenance intervals and scheduling for fleet vehicles.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: '5',
      type: 'pdf',
      title: 'Vehicle Inspection Checklist',
      description: 'Complete checklist for daily vehicle inspections.',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  'compliance-manager': [
    {
      id: '6',
      type: 'video',
      title: 'DOT Compliance Requirements',
      description: 'Overview of Department of Transportation compliance standards.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: '7',
      type: 'pdf',
      title: 'HOS Regulations Guide',
      description: 'Hours of Service regulations and logging requirements.',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  'safety-officer': [
    {
      id: '8',
      type: 'video',
      title: 'Workplace Safety Protocols',
      description: 'Essential safety protocols for trucking operations.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: '9',
      type: 'pdf',
      title: 'Incident Reporting Procedures',
      description: 'Step-by-step guide for reporting safety incidents.',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  accountant: [
    {
      id: '10',
      type: 'video',
      title: 'Financial Reporting Basics',
      description: 'Introduction to financial reporting and accounting practices.',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: '11',
      type: 'pdf',
      title: 'Invoice Processing Guide',
      description: 'How to process invoices and manage accounts payable.',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
};

// Static Q&A content data (would come from API in real app)
const staticQAContent: Record<string, QAItem[]> = {
  dispatcher: [
    {
      id: 'qa1',
      title: 'Dispatching Fundamentals Quiz',
      description: 'Test your knowledge of basic dispatching principles.',
      questions: [
        {
          question: 'What is the primary responsibility of a dispatcher?',
          options: ['Managing driver schedules', 'Coordinating loads and routes', 'Maintaining vehicles', 'Processing invoices'],
          correctAnswer: 1
        },
        {
          question: 'How should you prioritize loads?',
          options: ['By customer size', 'By delivery deadline and driver availability', 'By distance only', 'Alphabetically'],
          correctAnswer: 1
        },
        {
          question: 'What information is essential when assigning a load?',
          options: ['Only pickup location', 'Pickup location, delivery location, and special requirements', 'Only delivery location', 'Driver name only'],
          correctAnswer: 1
        },
        {
          question: 'When should you communicate with drivers?',
          options: ['Only at the start of the day', 'Regularly throughout the day for updates', 'Never', 'Only in emergencies'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'qa2',
      title: 'Route Optimization Quiz',
      description: 'Assess your understanding of efficient route planning.',
      questions: [
        {
          question: 'What is route optimization?',
          options: ['Finding the shortest distance', 'Minimizing time, fuel, and costs while meeting delivery requirements', 'Using GPS only', 'Following the same route daily'],
          correctAnswer: 1
        },
        {
          question: 'Which factor is most important in route planning?',
          options: ['Driver preference', 'Delivery windows and traffic patterns', 'Vehicle color', 'Weather only'],
          correctAnswer: 1
        },
        {
          question: 'What tool is most effective for route optimization?',
          options: ['Paper maps', 'Route optimization software', 'Guessing', 'Asking drivers'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'qa7',
      title: 'Customer Service Quiz',
      description: 'Test your customer service skills as a dispatcher.',
      questions: [
        {
          question: 'How should you handle customer complaints?',
          options: ['Ignore them', 'Listen actively, apologize, and find a solution', 'Blame the driver', 'Hang up'],
          correctAnswer: 1
        },
        {
          question: 'What is the best way to provide delivery updates?',
          options: ['Never update', 'Proactively communicate delays and ETAs', 'Only when asked', 'Send updates to wrong customer'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  'fleet-maintenance-manager': [
    {
      id: 'qa3',
      title: 'Maintenance Management Quiz',
      description: 'Test your knowledge of fleet maintenance procedures.',
      questions: [
        {
          question: 'What is preventive maintenance?',
          options: ['Fixing things when they break', 'Regular scheduled maintenance to prevent failures', 'Only oil changes', 'Ignoring maintenance'],
          correctAnswer: 1
        },
        {
          question: 'How often should vehicles be inspected?',
          options: ['Once a year', 'Daily pre-trip and periodic comprehensive inspections', 'Never', 'Only when problems occur'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date().toISOString()
    }
  ],
  'compliance-manager': [
    {
      id: 'qa4',
      title: 'DOT Compliance Quiz',
      description: 'Evaluate your understanding of DOT regulations.',
      questions: [
        {
          question: 'What does HOS stand for?',
          options: ['Hours of Service', 'Hours of Safety', 'Hours of Shipping', 'Hours of Storage'],
          correctAnswer: 0
        },
        {
          question: 'What is the maximum driving time for a property-carrying driver?',
          options: ['8 hours', '11 hours', '12 hours', 'Unlimited'],
          correctAnswer: 1
        },
        {
          question: 'When must a driver take a 30-minute break?',
          options: ['After 4 hours', 'After 8 hours of driving', 'Never required', 'After 2 hours'],
          correctAnswer: 1
        },
        {
          question: 'What is the maximum on-duty time in a 14-hour period?',
          options: ['10 hours', '14 hours', '16 hours', 'No limit'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'qa8',
      title: 'ELD Compliance Quiz',
      description: 'Test your knowledge of Electronic Logging Device requirements.',
      questions: [
        {
          question: 'When did the ELD mandate become effective?',
          options: ['2015', '2017', '2019', '2020'],
          correctAnswer: 1
        },
        {
          question: 'What must drivers do if their ELD malfunctions?',
          options: ['Continue driving', 'Use paper logs and report within 24 hours', 'Ignore it', 'Stop driving permanently'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  'safety-officer': [
    {
      id: 'qa5',
      title: 'Safety Protocols Quiz',
      description: 'Test your knowledge of workplace safety procedures.',
      questions: [
        {
          question: 'What should be done first in case of an accident?',
          options: ['Call insurance', 'Ensure safety of all involved and call emergency services', 'Take photos only', 'Leave the scene'],
          correctAnswer: 1
        },
        {
          question: 'Who is responsible for workplace safety?',
          options: ['Only management', 'Everyone in the organization', 'Only drivers', 'Only safety officers'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date().toISOString()
    }
  ],
  accountant: [
    {
      id: 'qa6',
      title: 'Accounting Basics Quiz',
      description: 'Assess your understanding of financial management.',
      questions: [
        {
          question: 'What is accounts payable?',
          options: ['Money owed to the company', 'Money the company owes to suppliers', 'Employee salaries', 'Vehicle expenses only'],
          correctAnswer: 1
        },
        {
          question: 'What is the purpose of financial reporting?',
          options: ['To track expenses only', 'To provide accurate financial information for decision-making', 'To hide expenses', 'To avoid taxes'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date().toISOString()
    }
  ],
};

// Static results data - structure: role -> userId -> qaId -> results
// This allows multiple users of the same role to have their own results
const staticResults: Record<string, Record<string, Record<string, { answers: Record<number, number>; score: { correct: number; total: number }; completedAt: string }>>> = {
  dispatcher: {
    'user1': {
      'qa1': {
        answers: { 0: 1, 1: 1, 2: 1, 3: 1 },
        score: { correct: 4, total: 4 },
        completedAt: new Date().toISOString()
      },
      'qa2': {
        answers: { 0: 1, 1: 0, 2: 1 },
        score: { correct: 2, total: 3 },
        completedAt: new Date(Date.now() - 86400000).toISOString()
      }
    },
    'user2': {
      'qa1': {
        answers: { 0: 1, 1: 0, 2: 1, 3: 1 },
        score: { correct: 3, total: 4 },
        completedAt: new Date(Date.now() - 172800000).toISOString()
      }
    }
  },
  'fleet-maintenance-manager': {
    'user1': {
      'qa3': {
        answers: { 0: 1, 1: 1 },
        score: { correct: 2, total: 2 },
        completedAt: new Date().toISOString()
      }
    }
  },
  'compliance-manager': {
    'user1': {
      'qa4': {
        answers: { 0: 0, 1: 1, 2: 1 },
        score: { correct: 2, total: 3 },
        completedAt: new Date().toISOString()
      }
    }
  },
  'safety-officer': {
    'user1': {
      'qa5': {
        answers: { 0: 1, 1: 1 },
        score: { correct: 2, total: 2 },
        completedAt: new Date().toISOString()
      }
    }
  },
  accountant: {
    'user1': {
      'qa6': {
        answers: { 0: 1, 1: 1 },
        score: { correct: 2, total: 2 },
        completedAt: new Date().toISOString()
      }
    }
  }
};

const TrainingContentView: React.FC = () => {
  const userRole = getUserRole();
  const userId = getUserId() || 'default-user'; // Get current user ID
  
  // State to track user answers for each Q&A set (per user)
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<number, number>>>({});
  // State to track submitted Q&A sets (per user)
  const [submittedQA, setSubmittedQA] = useState<Record<string, boolean>>({});
  // State to track scores (per user)
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});
  
  // Map user role to training content role key
  const contentRoleKey = useMemo(() => {
    if (!userRole) return null;
    return roleMapping[userRole] || null;
  }, [userRole]);

  // Get role label for display
  const roleLabel = useMemo(() => {
    if (!userRole) return 'Your Role';
    const roleLabels: Record<string, string> = {
      'dispatcher': 'Dispatcher',
      'Fleet Maintenance Manager': 'Fleet Maintenance Manager',
      'Compliance Manager': 'Compliance Manager',
      'safety officer': 'Safety Officer',
      'accountant': 'Accountant',
      'hr': 'HR',
    };
    return roleLabels[userRole] || userRole;
  }, [userRole]);

  // Fallback to dispatcher if role detection fails
  const effectiveRoleKey = contentRoleKey || 'dispatcher';
  const effectiveRoleLabel = roleLabel || 'Dispatcher';
  
  // Initialize with static results for current user
  useEffect(() => {
    const roleResults = staticResults[effectiveRoleKey] || {};
    const userResults = roleResults[userId] || {};
    
    // Set static results as submitted for current user
    Object.keys(userResults).forEach((qaId) => {
      setSubmittedQA((prev) => ({ ...prev, [qaId]: true }));
      setUserAnswers((prev) => ({ ...prev, [qaId]: userResults[qaId].answers }));
      setScores((prev) => ({ ...prev, [qaId]: userResults[qaId].score }));
    });
  }, [effectiveRoleKey, userId]);


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

  // Handle answer selection
  const handleAnswerSelect = (qaId: string, questionIndex: number, answerIndex: number) => {
    if (submittedQA[qaId]) return; // Don't allow changes after submission
    
    setUserAnswers((prev) => ({
      ...prev,
      [qaId]: {
        ...prev[qaId],
        [questionIndex]: answerIndex,
      },
    }));
  };

  // Handle Q&A submission (saves per user)
  const handleSubmitQA = (qaId: string, questions: QAItem['questions']) => {
    const answers = userAnswers[qaId] || {};
    let correct = 0;
    const total = questions.length;

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    // Save results (in real app, this would be sent to API with userId)
    setScores((prev) => ({
      ...prev,
      [qaId]: { correct, total },
    }));

    setSubmittedQA((prev) => ({
      ...prev,
      [qaId]: true,
    }));

    // In a real app, you would save to backend:
    // saveQuizResult(userId, effectiveRoleKey, qaId, { answers, score: { correct, total } });
  };

  // Reset Q&A to allow retaking
  const handleResetQA = (qaId: string) => {
    setUserAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[qaId];
      return newAnswers;
    });
    setSubmittedQA((prev) => {
      const newSubmitted = { ...prev };
      delete newSubmitted[qaId];
      return newSubmitted;
    });
    setScores((prev) => {
      const newScores = { ...prev };
      delete newScores[qaId];
      return newScores;
    });
  };

  // Get training content for current role (with fallback)
  const effectiveTrainingContent = useMemo(() => {
    return staticTrainingContent[effectiveRoleKey] || staticTrainingContent['dispatcher'] || [];
  }, [effectiveRoleKey]);

  // Get Q&A content for current role (with fallback)
  const effectiveQAContent = useMemo(() => {
    return staticQAContent[effectiveRoleKey] || staticQAContent['dispatcher'] || [];
  }, [effectiveRoleKey]);

  return (
    <div className="p-6 bg-[#EDF8FF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Content</h1>
          <p className="text-gray-600">
            Training materials and Q&A for {effectiveRoleLabel}
            {!userRole && <span className="text-xs text-gray-500 ml-2">(Default view)</span>}
          </p>
        </div>

        {/* Training Materials Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Training Materials</h2>
            <p className="text-sm text-gray-600 mt-1">
              Videos, PDFs, and images for your role
            </p>
          </div>
          <div className="p-6">
            {effectiveTrainingContent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No training materials available yet</p>
                <p className="text-sm mt-2">Training materials will appear here when uploaded by HR or Admin</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {effectiveTrainingContent.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-[#0ea3d8]">{getIcon(item.type)}</div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2 mb-3">{item.description}</p>
                    )}
                    {item.questions && item.questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Questions & Answers:</p>
                        <div className="space-y-2">
                          {item.questions.map((q, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-xs">
                              <p className="font-medium text-gray-900 mb-1">Q: {q.question}</p>
                              <p className="text-gray-600">A: {q.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
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
            )}
          </div>
        </div>

        {/* Q&A Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Q&A Content</h2>
            <p className="text-sm text-gray-600 mt-1">
              Questions and answers for your role
            </p>
          </div>
          <div className="p-6">
            {effectiveQAContent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No Q&A content available yet</p>
                <p className="text-sm mt-2">Q&A content will appear here when added by HR or Admin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {effectiveQAContent.map((item) => {
                  const isSubmitted = submittedQA[item.id];
                  const answers = userAnswers[item.id] || {};
                  const score = scores[item.id];
                  const allAnswered = item.questions.every((_, idx) => answers[idx] !== undefined);

                  return (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                          {isSubmitted && score && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                              <span className="text-sm font-medium text-gray-700">Score:</span>
                              <span className={`text-lg font-bold ${score.correct === score.total ? 'text-green-600' : score.correct / score.total >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {score.correct}/{score.total}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({Math.round((score.correct / score.total) * 100)}%)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 mt-3">
                          {item.questions.map((q, idx) => {
                            const userAnswer = answers[idx];
                            const isCorrect = userAnswer === q.correctAnswer;
                            const showResults = isSubmitted;

                            return (
                              <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                                <p className="font-medium text-gray-900 mb-2">Q{idx + 1}: {q.question}</p>
                                <div className="space-y-1">
                                  {q.options.map((option, optIdx) => {
                                    const isSelected = userAnswer === optIdx;
                                    const isCorrectOption = q.correctAnswer === optIdx;
                                    let optionClass = 'text-gray-600';
                                    
                                    if (showResults) {
                                      if (isCorrectOption) {
                                        optionClass = 'text-green-600 font-medium';
                                      } else if (isSelected && !isCorrectOption) {
                                        optionClass = 'text-red-600 font-medium';
                                      }
                                    }

                                    return (
                                      <div key={optIdx} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name={`qa-${item.id}-q${idx}`}
                                          checked={isSelected}
                                          onChange={() => handleAnswerSelect(item.id, idx, optIdx)}
                                          disabled={isSubmitted}
                                          className="w-4 h-4"
                                        />
                                        <span className={`text-sm ${optionClass} flex items-center gap-2`}>
                                          {String.fromCharCode(65 + optIdx)}. {option}
                                          {showResults && isCorrectOption && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          )}
                                          {showResults && isSelected && !isCorrectOption && (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {showResults && (
                                  <div className={`mt-2 text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    {isCorrect ? '✓ Correct!' : '✗ Incorrect. The correct answer is marked in green.'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex gap-2">
                          {!isSubmitted ? (
                            <button
                              onClick={() => handleSubmitQA(item.id, item.questions)}
                              disabled={!allAnswered}
                              className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Submit Answers
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResetQA(item.id)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Retake Quiz
                            </button>
                          )}
                        </div>
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
  );
};

export default TrainingContentView;

