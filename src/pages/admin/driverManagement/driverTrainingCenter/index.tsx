import React, { useState } from "react";
import TrainingCertificates from "../trainingCertificates/index";
import TrainingTestManagement from "../trainingTestManagement/index";

type TabType = "certificates" | "training" | "questions";

const DriverTrainingCenter = () => {
  const [activeTab, setActiveTab] = useState<TabType>("certificates");

  const tabs = [
    { key: "certificates", label: "Certificates" },
    { key: "training", label: "Training Content" },
    { key: "questions", label: "Question Banks" },
  ];

  return (
    <div className="p-6 bg-[#EDF8FF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Driver Training Center
          </h1>
          <p className="text-gray-600">
            Manage driver certificates, training materials, and test questions
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "text-[#0ea3d8] border-b-2 border-[#0ea3d8]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "certificates" && <TrainingCertificates hideHeader={true} />}
          {activeTab === "training" && <TrainingTestManagement showOnly="training" />}
          {activeTab === "questions" && <TrainingTestManagement showOnly="questions" />}
        </div>
      </div>
    </div>
  );
};

export default DriverTrainingCenter;

