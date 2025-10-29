import { useState } from 'react';
import { FaFileAlt, FaUpload, FaCheck, FaTimes, FaDollarSign } from 'react-icons/fa';
import PaymentStatusBadge from '../../../../../components/dispatch/PaymentStatusBadge';

interface Load {
  _id: string;
  loadNumber?: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  amount?: number;
  rate?: number;
  status: 'available' | 'planned' | 'assigned' | 'in-delivery' | 'delivered' | 'paid';
  paymentStatus?: 'pending' | 'due' | 'paid';
}

interface DeliveryComponentProps {
  load: Load;
  onClose: () => void;
  onDelivered: (updatedLoad: Load) => void;
}

const DeliveryComponent: React.FC<DeliveryComponentProps> = ({ load, onClose, onDelivered }) => {
  const [documents, setDocuments] = useState({
    bol: { uploaded: load.documents?.bol || false, file: null as File | null },
    billOfSale: { uploaded: load.documents?.billOfSale || false, file: null as File | null },
    pod: { uploaded: load.documents?.pod || false, file: null as File | null }
  });

  const [paymentStatus, setPaymentStatus] = useState<'due' | 'paid'>(load.paymentStatus || 'due');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleFileUpload = (docType: 'bol' | 'billOfSale' | 'pod', file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: {
        uploaded: file !== null,
        file: file
      }
    }));
  };

  const handleMarkDelivered = () => {
    const allDocumentsUploaded = documents.bol.uploaded && documents.billOfSale.uploaded && documents.pod.uploaded;
    
    if (!allDocumentsUploaded) {
      alert('Please upload all required documents (BOL, Bill of Sale, POD) before marking as delivered.');
      return;
    }

    const updatedLoad: Load = {
      ...load,
      status: 'delivered',
      paymentStatus: 'due',
      documents: {
        bol: documents.bol.uploaded,
        billOfSale: documents.billOfSale.uploaded,
        pod: documents.pod.uploaded
      }
    };

    onDelivered(updatedLoad);
  };

  const handleMarkPaid = () => {
    const updatedLoad: Load = {
      ...load,
      status: 'paid',
      paymentStatus: 'paid'
    };
    onDelivered(updatedLoad);
    setShowPaymentModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Delivery & Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              Load: {load.loadNumber || load._id} | Customer: {load.customer || load.customerName || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Load Amount Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaDollarSign className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total Load Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(load.amount || load.rate || 0)}
                  </p>
                </div>
              </div>
              <PaymentStatusBadge status={paymentStatus} />
            </div>
          </div>

          {/* Delivery Documents Upload Section */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Delivery Documents</h4>
            <p className="text-sm text-gray-600 mb-4">Upload all required documents before marking as delivered.</p>

            <div className="space-y-4">
              {/* BOL */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      documents.bol.uploaded ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <FaFileAlt className={`${documents.bol.uploaded ? 'text-green-600' : 'text-blue-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Bill of Lading (BOL) *</h5>
                      <p className="text-sm text-gray-500">Required document for shipment</p>
                    </div>
                  </div>
                  {documents.bol.uploaded ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheck /> Uploaded
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">Required</span>
                  )}
                </div>
                <label className="block">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                    <FaUpload className="text-blue-600" />
                    <span className="text-blue-600 font-medium">Choose File</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => handleFileUpload('bol', e.target.files?.[0] || null)}
                  />
                </label>
                {documents.bol.file && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {documents.bol.file.name}</p>
                )}
              </div>

              {/* Bill of Sale */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      documents.billOfSale.uploaded ? 'bg-green-100' : 'bg-green-100'
                    }`}>
                      <FaFileAlt className={`${documents.billOfSale.uploaded ? 'text-green-600' : 'text-green-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Bill of Sale *</h5>
                      <p className="text-sm text-gray-500">Sale documentation</p>
                    </div>
                  </div>
                  {documents.billOfSale.uploaded ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheck /> Uploaded
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">Required</span>
                  )}
                </div>
                <label className="block">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors">
                    <FaUpload className="text-green-600" />
                    <span className="text-green-600 font-medium">Choose File</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => handleFileUpload('billOfSale', e.target.files?.[0] || null)}
                  />
                </label>
                {documents.billOfSale.file && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {documents.billOfSale.file.name}</p>
                )}
              </div>

              {/* POD */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      documents.pod.uploaded ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <FaFileAlt className={`${documents.pod.uploaded ? 'text-green-600' : 'text-purple-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Proof of Delivery (POD) *</h5>
                      <p className="text-sm text-gray-500">Delivery confirmation document</p>
                    </div>
                  </div>
                  {documents.pod.uploaded ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheck /> Uploaded
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">Required</span>
                  )}
                </div>
                <label className="block">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors">
                    <FaUpload className="text-purple-600" />
                    <span className="text-purple-600 font-medium">Choose File</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => handleFileUpload('pod', e.target.files?.[0] || null)}
                  />
                </label>
                {documents.pod.file && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {documents.pod.file.name}</p>
                )}
              </div>
            </div>

            {/* Document Status Summary */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-2">Document Status:</h5>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className={`p-2 rounded ${documents.bol.uploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  BOL: {documents.bol.uploaded ? '✓ Uploaded' : '✗ Required'}
                </div>
                <div className={`p-2 rounded ${documents.billOfSale.uploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  Bill of Sale: {documents.billOfSale.uploaded ? '✓ Uploaded' : '✗ Required'}
                </div>
                <div className={`p-2 rounded ${documents.pod.uploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  POD: {documents.pod.uploaded ? '✓ Uploaded' : '✗ Required'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {load.status === 'delivered' && paymentStatus === 'due' ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Mark as Paid
              </button>
            ) : (
              <button
                onClick={handleMarkDelivered}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Mark as Paid</h3>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Load Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(load.amount || load.rate || 0)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>Select Payment Method</option>
                    <option>Bank Transfer</option>
                    <option>Check</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Transaction ID or reference number"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryComponent;

