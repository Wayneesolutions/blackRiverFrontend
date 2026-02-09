import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Video, 
  CheckCircle
} from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaCheckCircle className="text-blue-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

type TestType = 'TDG' | 'VEHICLE' | 'HOS' | 'WINTER';
type ContentType = 'PDF' | 'IMAGE' | 'VIDEO';

interface TrainingContent {
  id: string;
  name: string;
  type: ContentType;
  testType: TestType;
  file: File | null;
  fileUrl?: string;
  uploadedAt?: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer
}

interface QuestionBank {
  id: string;
  testName: string;
  testType: TestType;
  passingPercentage: number;
  mandatory: boolean;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

const TrainingTestManagement = ({ showOnly }: { showOnly?: "training" | "questions" }) => {
  const [activeTab, setActiveTab] = useState<'training' | 'questionBanks'>(
    showOnly === "questions" ? "questionBanks" : "training"
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Training Content State - Initialize with dummy data
  const [trainingContent, setTrainingContent] = useState<TrainingContent[]>([
    {
      id: 'content-1',
      name: 'TDG Safety Guidelines 2024',
      type: 'PDF',
      testType: 'TDG',
      file: null,
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'content-2',
      name: 'Vehicle Inspection Checklist',
      type: 'PDF',
      testType: 'VEHICLE',
      file: null,
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'content-3',
      name: 'HOS Regulations Training Video',
      type: 'VIDEO',
      testType: 'HOS',
      file: null,
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'content-4',
      name: 'Winter Driving Safety Guide',
      type: 'IMAGE',
      testType: 'WINTER',
      file: null,
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'content-5',
      name: 'TDG Hazardous Materials Chart',
      type: 'IMAGE',
      testType: 'TDG',
      file: null,
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState<{
    name: string;
    type: ContentType;
    testType: TestType;
    file: File | null;
  }>({
    name: '',
    type: 'PDF',
    testType: 'TDG',
    file: null
  });

  // Question Bank State - Initialize with dummy data
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([
    {
      id: 'bank-1',
      testName: 'TDG Certification Test',
      testType: 'TDG',
      passingPercentage: 80,
      mandatory: true,
      questions: [
        {
          id: 'q-1',
          question: 'What does TDG stand for?',
          options: [
            'Transportation of Dangerous Goods',
            'Truck Driver Guidelines',
            'Traffic Direction Guide',
            'Transportation Department Guide'
          ],
          correctAnswer: 0
        },
        {
          id: 'q-2',
          question: 'What is the maximum weight allowed for a single package of dangerous goods?',
          options: [
            '30 kg',
            '50 kg',
            '100 kg',
            '150 kg'
          ],
          correctAnswer: 0
        },
        {
          id: 'q-3',
          question: 'Which class of dangerous goods includes flammable liquids?',
          options: [
            'Class 3',
            'Class 5',
            'Class 7',
            'Class 9'
          ],
          correctAnswer: 0
        },
        {
          id: 'q-4',
          question: 'How often must TDG training be renewed?',
          options: [
            'Every year',
            'Every 2 years',
            'Every 3 years',
            'Only once'
          ],
          correctAnswer: 2
        }
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'bank-2',
      testName: 'Vehicle Inspection Test',
      testType: 'VEHICLE',
      passingPercentage: 75,
      mandatory: true,
      questions: [
        {
          id: 'q-5',
          question: 'What should you check before starting your vehicle?',
          options: [
            'Tire pressure and tread depth',
            'Fuel level only',
            'Radio settings',
            'None of the above'
          ],
          correctAnswer: 0
        },
        {
          id: 'q-6',
          question: 'How often should you perform a pre-trip inspection?',
          options: [
            'Before every trip',
            'Once a week',
            'Once a month',
            'Only when required'
          ],
          correctAnswer: 0
        },
        {
          id: 'q-7',
          question: 'What is the minimum tread depth required for commercial vehicle tires?',
          options: [
            '2/32 inch',
            '4/32 inch',
            '6/32 inch',
            '8/32 inch'
          ],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'bank-3',
      testName: 'Hours of Service (HOS) Regulations',
      testType: 'HOS',
      passingPercentage: 80,
      mandatory: true,
      questions: [
        {
          id: 'q-8',
          question: 'What is the maximum driving time allowed in a 14-hour period?',
          options: [
            '8 hours',
            '10 hours',
            '11 hours',
            '12 hours'
          ],
          correctAnswer: 2
        },
        {
          id: 'q-9',
          question: 'How long must a driver rest after 8 hours of driving?',
          options: [
            '15 minutes',
            '30 minutes',
            '45 minutes',
            '1 hour'
          ],
          correctAnswer: 1
        },
        {
          id: 'q-10',
          question: 'What is the maximum on-duty time in a 14-hour window?',
          options: [
            '11 hours',
            '12 hours',
            '13 hours',
            '14 hours'
          ],
          correctAnswer: 3
        },
        {
          id: 'q-11',
          question: 'When must a driver take a 34-hour restart?',
          options: [
            'After 60 hours of work in 7 days',
            'After 70 hours of work in 8 days',
            'After 80 hours of work in 7 days',
            'After 70 hours of work in 7 days'
          ],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'bank-4',
      testName: 'Winter Driving Safety',
      testType: 'WINTER',
      passingPercentage: 75,
      mandatory: false,
      questions: [
        {
          id: 'q-12',
          question: 'What is the recommended following distance in winter conditions?',
          options: [
            '2 seconds',
            '4 seconds',
            '6 seconds',
            '8 seconds'
          ],
          correctAnswer: 2
        },
        {
          id: 'q-13',
          question: 'When should you use chains on your tires?',
          options: [
            'Only in heavy snow',
            'When required by law or road conditions',
            'Never',
            'Always in winter'
          ],
          correctAnswer: 1
        },
        {
          id: 'q-14',
          question: 'What should you do if you start to skid on ice?',
          options: [
            'Brake hard',
            'Steer into the skid and ease off accelerator',
            'Accelerate quickly',
            'Turn the wheel sharply'
          ],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [editingQuestionBank, setEditingQuestionBank] = useState<QuestionBank | null>(null);
  const [questionBankForm, setQuestionBankForm] = useState<{
    testName: string;
    testType: TestType;
    passingPercentage: number;
    mandatory: boolean;
    questions: Question[];
  }>({
    testName: '',
    testType: 'TDG',
    passingPercentage: 80,
    mandatory: false,
    questions: []
  });

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const testTypes: { value: TestType; label: string }[] = [
    { value: 'TDG', label: 'TDG' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'HOS', label: 'HOS' },
    { value: 'WINTER', label: 'Winter' }
  ];

  const contentTypeOptions: { value: ContentType; label: string; icon: React.ReactNode }[] = [
    { value: 'PDF', label: 'PDF', icon: <FileText className="w-4 h-4" /> },
    { value: 'IMAGE', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
    { value: 'VIDEO', label: 'Video', icon: <Video className="w-4 h-4" /> }
  ];

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Training Content Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file, name: file.name }));
    }
  };

  const handleUploadContent = () => {
    if (!uploadForm.name || !uploadForm.file) {
      addNotification('error', 'Please provide a name and select a file');
      return;
    }

    const newContent: TrainingContent = {
      id: `content-${Date.now()}`,
      name: uploadForm.name,
      type: uploadForm.type,
      testType: uploadForm.testType,
      file: uploadForm.file,
      uploadedAt: new Date().toISOString()
    };

    setTrainingContent(prev => [...prev, newContent]);
    addNotification('success', 'Training content uploaded successfully');
    setUploadForm({ name: '', type: 'PDF', testType: 'TDG', file: null });
    setShowUploadModal(false);
  };

  const handleDeleteContent = (id: string) => {
    setTrainingContent(prev => prev.filter(c => c.id !== id));
    addNotification('success', 'Training content deleted successfully');
  };

  // Question Bank Handlers
  const handleCreateQuestionBank = () => {
    setEditingQuestionBank(null);
    setQuestionBankForm({
      testName: '',
      testType: 'TDG',
      passingPercentage: 80,
      mandatory: false,
      questions: []
    });
    setShowQuestionBankModal(true);
  };

  const handleEditQuestionBank = (bank: QuestionBank) => {
    setEditingQuestionBank(bank);
    setQuestionBankForm({
      testName: bank.testName,
      testType: bank.testType,
      passingPercentage: bank.passingPercentage,
      mandatory: bank.mandatory,
      questions: bank.questions
    });
    setShowQuestionBankModal(true);
  };

  const handleSaveQuestionBank = () => {
    if (!questionBankForm.testName.trim()) {
      addNotification('error', 'Please provide a test name');
      return;
    }

    if (questionBankForm.questions.length === 0) {
      addNotification('error', 'Please add at least one question');
      return;
    }

    if (editingQuestionBank) {
      // Update existing
      setQuestionBanks(prev => prev.map(bank => 
        bank.id === editingQuestionBank.id 
          ? { ...questionBankForm, id: editingQuestionBank.id, updatedAt: new Date().toISOString() }
          : bank
      ));
      addNotification('success', 'Question bank updated successfully');
    } else {
      // Create new
      const newBank: QuestionBank = {
        id: `bank-${Date.now()}`,
        ...questionBankForm,
        createdAt: new Date().toISOString()
      };
      setQuestionBanks(prev => [...prev, newBank]);
      addNotification('success', 'Question bank created successfully');
    }

    setShowQuestionBankModal(false);
    setEditingQuestionBank(null);
  };

  const handleDeleteQuestionBank = (id: string) => {
    setQuestionBanks(prev => prev.filter(b => b.id !== id));
    addNotification('success', 'Question bank deleted successfully');
  };

  // Question Handlers
  const handleAddQuestion = () => {
    if (!questionForm.question.trim()) {
      addNotification('error', 'Please enter a question');
      return;
    }

    if (questionForm.options.filter(opt => opt.trim()).length < 2) {
      addNotification('error', 'Please provide at least 2 options');
      return;
    }

    if (questionForm.options[questionForm.correctAnswer]?.trim() === '') {
      addNotification('error', 'Please select a valid correct answer');
      return;
    }

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: questionForm.question,
      options: questionForm.options.filter(opt => opt.trim()),
      correctAnswer: questionForm.correctAnswer
    };

    setQuestionBankForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    setEditingQuestionIndex(null);
    addNotification('success', 'Question added successfully');
  };

  const handleEditQuestion = (index: number) => {
    const question = questionBankForm.questions[index];
    setQuestionForm({
      question: question.question,
      options: [...question.options, '', '', ''].slice(0, 4),
      correctAnswer: question.correctAnswer
    });
    setEditingQuestionIndex(index);
  };

  const handleUpdateQuestion = () => {
    if (editingQuestionIndex === null) return;

    if (!questionForm.question.trim()) {
      addNotification('error', 'Please enter a question');
      return;
    }

    if (questionForm.options.filter(opt => opt.trim()).length < 2) {
      addNotification('error', 'Please provide at least 2 options');
      return;
    }

    const updatedQuestions = [...questionBankForm.questions];
    updatedQuestions[editingQuestionIndex] = {
      ...updatedQuestions[editingQuestionIndex],
      question: questionForm.question,
      options: questionForm.options.filter(opt => opt.trim()),
      correctAnswer: questionForm.correctAnswer
    };

    setQuestionBankForm(prev => ({
      ...prev,
      questions: updatedQuestions
    }));

    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    setEditingQuestionIndex(null);
    addNotification('success', 'Question updated successfully');
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questionBankForm.questions.filter((_, i) => i !== index);
    setQuestionBankForm(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
    addNotification('success', 'Question deleted successfully');
  };

  const getFileIcon = (type: ContentType) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTestTypeColor = (type: TestType) => {
    switch (type) {
      case 'TDG':
        return 'bg-red-100 text-red-800';
      case 'VEHICLE':
        return 'bg-blue-100 text-blue-800';
      case 'HOS':
        return 'bg-green-100 text-green-800';
      case 'WINTER':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className={showOnly ? "" : "p-6 bg-[#EDF8FF] min-h-screen"}>
      <div className={showOnly ? "" : "max-w-7xl mx-auto"}>
        {/* Header - Only show if not used as child component */}
        {!showOnly && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Training & Test Management</h1>
              <p className="text-gray-600">Manage training content and create question banks for driver tests</p>
            </div>

            {/* Tabs - Only show if not used as child component */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('training')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'training'
                      ? 'text-[#0ea3d8] border-b-2 border-[#0ea3d8]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Training Content
                </button>
                <button
                  onClick={() => setActiveTab('questionBanks')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'questionBanks'
                      ? 'text-[#0ea3d8] border-b-2 border-[#0ea3d8]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Question Banks
                </button>
              </div>
            </div>
          </>
        )}

        {/* Training Content Tab */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Training Content</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Content
              </button>
            </div>

            {/* Training Content List */}
            {trainingContent.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No training content uploaded yet</p>
                <p className="text-gray-400 text-sm mt-2">Click "Upload Content" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingContent.map((content) => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(content.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">{content.name}</h3>
                          <p className="text-xs text-gray-500">{content.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTestTypeColor(content.testType)}`}>
                        {content.testType}
                      </span>
                    </div>
                    {content.uploadedAt && (
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(content.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question Banks Tab */}
        {activeTab === 'questionBanks' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Question Banks</h2>
              <button
                onClick={handleCreateQuestionBank}
                className="flex items-center gap-2 px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Question Bank
              </button>
            </div>

            {/* Question Banks List */}
            {questionBanks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No question banks created yet</p>
                <p className="text-gray-400 text-sm mt-2">Click "Create Question Bank" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questionBanks.map((bank) => (
                  <div key={bank.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{bank.testName}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTestTypeColor(bank.testType)}`}>
                            {bank.testType}
                          </span>
                          {bank.mandatory && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Passing: {bank.passingPercentage}%</span>
                          <span>Questions: {bank.questions.length}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuestionBank(bank)}
                          className="p-2 text-[#0ea3d8] hover:bg-[#0ea3d8]/10 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestionBank(bank.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Content Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Upload Training Content</h2>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ name: '', type: 'PDF', testType: 'TDG', file: null });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Name</label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter content name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {contentTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setUploadForm(prev => ({ ...prev, type: option.value }))}
                          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                            uploadForm.type === option.value
                              ? 'border-[#0ea3d8] bg-[#0ea3d8]/10 text-[#0ea3d8]'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.icon}
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                    <select
                      value={uploadForm.testType}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, testType: e.target.value as TestType }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                    >
                      {testTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept={uploadForm.type === 'PDF' ? '.pdf' : uploadForm.type === 'IMAGE' ? 'image/*' : 'video/*'}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {uploadForm.file ? uploadForm.file.name : 'Click to upload or drag and drop'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ name: '', type: 'PDF', testType: 'TDG', file: null });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadContent}
                    className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank Modal */}
        {showQuestionBankModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingQuestionBank ? 'Edit Question Bank' : 'Create Question Bank'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowQuestionBankModal(false);
                      setEditingQuestionBank(null);
                      setEditingQuestionIndex(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Test Configuration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
                      <input
                        type="text"
                        value={questionBankForm.testName}
                        onChange={(e) => setQuestionBankForm(prev => ({ ...prev, testName: e.target.value }))}
                        placeholder="Enter test name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                      <select
                        value={questionBankForm.testType}
                        onChange={(e) => setQuestionBankForm(prev => ({ ...prev, testType: e.target.value as TestType }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                      >
                        {testTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passing Percentage</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={questionBankForm.passingPercentage}
                        onChange={(e) => setQuestionBankForm(prev => ({ ...prev, passingPercentage: parseInt(e.target.value) || 80 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                      />
                    </div>
                    <div className="flex items-center pt-8">
                      <input
                        type="checkbox"
                        id="mandatory"
                        checked={questionBankForm.mandatory}
                        onChange={(e) => setQuestionBankForm(prev => ({ ...prev, mandatory: e.target.checked }))}
                        className="w-4 h-4 text-[#0ea3d8] border-gray-300 rounded focus:ring-[#0ea3d8]"
                      />
                      <label htmlFor="mandatory" className="ml-2 text-sm font-medium text-gray-700">
                        Mandatory Test
                      </label>
                    </div>
                  </div>

                  {/* Add Question Form */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {editingQuestionIndex !== null ? 'Edit Question' : 'Add Question'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                        <textarea
                          value={questionForm.question}
                          onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="Enter question text"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                        {questionForm.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={questionForm.correctAnswer === index}
                              onChange={() => setQuestionForm(prev => ({ ...prev, correctAnswer: index }))}
                              className="w-4 h-4 text-[#0ea3d8] border-gray-300"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...questionForm.options];
                                newOptions[index] = e.target.value;
                                setQuestionForm(prev => ({ ...prev, options: newOptions }));
                              }}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea3d8]"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        {editingQuestionIndex !== null ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingQuestionIndex(null);
                                setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateQuestion}
                              className="px-4 py-2 bg-[#0ea3d8] text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
                            >
                              Update Question
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleAddQuestion}
                            className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
                          >
                            Add Question
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Questions ({questionBankForm.questions.length})
                    </h3>
                    {questionBankForm.questions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No questions added yet</p>
                    ) : (
                      <div className="space-y-4">
                        {questionBankForm.questions.map((question, index) => (
                          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-2">
                                  {index + 1}. {question.question}
                                </p>
                                <div className="space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`flex items-center gap-2 text-sm ${
                                        optIndex === question.correctAnswer
                                          ? 'text-green-600 font-medium'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {optIndex === question.correctAnswer ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : (
                                        <div className="w-4 h-4" />
                                      )}
                                      <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditQuestion(index)}
                                  className="p-2 text-[#0ea3d8] hover:bg-[#0ea3d8]/10 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-6">
                  <button
                    onClick={() => {
                      setShowQuestionBankModal(false);
                      setEditingQuestionBank(null);
                      setEditingQuestionIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestionBank}
                    className="px-4 py-2 bg-[#0ea3d8] !text-white rounded-lg hover:bg-[#0d8fc7] transition-colors"
                  >
                    {editingQuestionBank ? 'Update' : 'Create'} Question Bank
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainingTestManagement;

