import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign, Calendar, User, Mail, Building, FileText, Loader2 } from 'lucide-react';
import { getPublicInvoice, createPaymentSession } from '../../axios/api/account.invoices';

interface Invoice {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    loadId: string;
    amount: string;
    currency: string;
    status: 'paid' | 'pending';
    invoiceDate: string;
    dueDate: string;
    paymentDate: string | null;
    invoiceUrl: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

const InvoicePayment: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const [searchParams] = useSearchParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'cancel' | null>(null);

    useEffect(() => {
        const status = searchParams.get('status');
        if (status) {
            setPaymentStatus(status as 'success' | 'cancel');
        }
    }, [searchParams]);

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    const fetchInvoice = async () => {
        console.log('🔍 InvoicePayment: fetchInvoice called');
        console.log('🔍 Invoice ID:', invoiceId);
        
        try {
            setLoading(true);
            console.log('📡 Making API call to get public invoice...');
            const response = await getPublicInvoice(invoiceId!);
            console.log('📡 API Response:', response);
            
            if (response && response.success) {
                console.log('✅ Invoice fetched successfully:', response.data);
                setInvoice(response.data);
            } else {
                console.log('❌ API returned error:', response?.message);
                setError(response?.message || 'Failed to fetch invoice');
            }
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            setError('Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!invoice) return;

        try {
            setPaymentLoading(true);
            const response = await createPaymentSession(invoice._id);
            
            if (response && response.success && response.url) {
                // Redirect to Stripe checkout
                window.location.href = response.url;
            } else {
                setError(response?.message || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError('Failed to process payment');
        } finally {
            setPaymentLoading(false);
        }
    };

    const formatCurrency = (amount: string, currency: string) => {
        const numAmount = parseFloat(amount);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(numAmount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                    <p className="text-gray-600">{error || 'The invoice you are looking for does not exist.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice Payment</h1>
                            <p className="text-gray-600 mt-1">Invoice #{invoice._id.slice(-8)}</p>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                invoice.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {invoice.status === 'paid' ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Paid
                                    </>
                                ) : (
                                    <>
                                        <Clock className="h-4 w-4 mr-1" />
                                        Pending
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Status Messages */}
                {paymentStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-green-800 font-medium">Payment Successful!</p>
                        </div>
                        <p className="text-green-700 mt-1">Your payment has been processed successfully.</p>
                    </div>
                )}

                {paymentStatus === 'cancel' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-yellow-500 mr-2" />
                            <p className="text-yellow-800 font-medium">Payment Cancelled</p>
                        </div>
                        <p className="text-yellow-700 mt-1">You can try again when you're ready.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Invoice Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Bill To</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-gray-900">{invoice.clientName}</span>
                                        </div>
                                        {invoice.clientEmail && (
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-600">{invoice.clientEmail}</span>
                                            </div>
                                        )}
                                        {invoice.clientCompany && (
                                            <div className="flex items-center">
                                                <Building className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-600">{invoice.clientCompany}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Invoice Info</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-gray-600">Issued: {formatDate(invoice.invoiceDate)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-gray-600">Due: {formatDate(invoice.dueDate)}</span>
                                        </div>
                                        {invoice.paymentDate && (
                                            <div className="flex items-center">
                                                <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-600">Paid: {formatDate(invoice.paymentDate)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                                    <p className="text-gray-600">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
                            
                            <div className="space-y-4">
                                {/* Amount */}
                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                    <span className="text-gray-600">Amount Due</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(invoice.amount, invoice.currency)}
                                    </span>
                                </div>

                                {/* Payment Button */}
                                {invoice.status === 'pending' && (
                                    <button
                                        onClick={handlePayment}
                                        disabled={paymentLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                    >
                                        {paymentLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-5 w-5 mr-2" />
                                                Pay Now
                                            </>
                                        )}
                                    </button>
                                )}

                                {invoice.status === 'paid' && (
                                    <div className="text-center py-4">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                        <p className="text-green-600 font-medium">Payment Complete</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Paid on {formatDate(invoice.paymentDate!)}
                                        </p>
                                    </div>
                                )}

                                {/* Security Notice */}
                                <div className="text-xs text-gray-500 text-center">
                                    <p>🔒 Secure payment powered by Stripe</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>If you have any questions about this invoice, please contact us.</p>
                </div>
            </div>
        </div>
    );
};

export default InvoicePayment;
