import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle, Lightbulb, Target, RefreshCw, Sparkles } from 'lucide-react';
import { getCashFlowInsights, type CashFlowInsightsResponse } from '../../../../axios/api/account.cashflow';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface CashFlowInsightsPageProps { }

const CashFlowInsightsPage: React.FC<CashFlowInsightsPageProps> = () => {
    const [loading, setLoading] = useState(false);
    const [insightsData, setInsightsData] = useState<CashFlowInsightsResponse['data'] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<number>(90);
    const [customDateRange, setCustomDateRange] = useState<{ start?: string; end?: string }>({});

    const primaryButtonStyle: React.CSSProperties = {
        background: FLEET_COLORS.gradient,
        color: '#fff',
        border: 'none',
        boxShadow: `0 12px 25px ${FLEET_COLORS.focusRing}`,
    };

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = { period };
            if (customDateRange.start) params.startDate = customDateRange.start;
            if (customDateRange.end) params.endDate = customDateRange.end;

            const response = await getCashFlowInsights(params);

            if (response.success && response.data) {
                setInsightsData(response.data);
            } else {
                setError(response.message || 'Failed to fetch cash flow insights');
            }
        } catch (err: any) {
            console.error('Error fetching cash flow insights:', err);
            setError(err.message || 'An error occurred while fetching insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'positive':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'negative':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen p-6 bg-[#EDF8FF]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">

                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>

                                    Cash Flow Insights
                                </h1>
                                <p className="text-gray-600 mt-1">AI-powered financial analysis and predictions</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchInsights}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                            style={primaryButtonStyle}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Loading...' : 'Refresh Insights'}
                        </button>
                    </div>

                    {/* Date Range Selector */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Period:</label>
                                <select
                                    value={period}
                                    onChange={(e) => {
                                        setPeriod(Number(e.target.value));
                                        setCustomDateRange({});
                                    }}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value={30}>Last 30 Days</option>
                                    <option value={60}>Last 60 Days</option>
                                    <option value={90}>Last 90 Days</option>
                                    <option value={180}>Last 6 Months</option>
                                    <option value={365}>Last Year</option>
                                    <option value={0}>Custom Range</option>
                                </select>
                            </div>
                            {period === 0 && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Start Date:</label>
                                        <input
                                            type="date"
                                            value={customDateRange.start || ''}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">End Date:</label>
                                        <input
                                            type="date"
                                            value={customDateRange.end || ''}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchInsights}
                                        disabled={loading || !customDateRange.start || !customDateRange.end}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Apply
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && !insightsData && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Analyzing cash flow data with AI...</p>
                        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="text-red-800 font-medium">Error: {error}</p>
                        </div>
                    </div>
                )}

                {/* Insights Data */}
                {insightsData && !loading && (
                    <div className="space-y-6">
                        {/* AI Summary Card */}
                        {insightsData.aiInsights && (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Sparkles className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">AI Analysis Summary</h2>
                                        <p className="text-sm text-gray-600">Powered by o3-mini</p>
                                    </div>
                                </div>

                                {/* Cash Flow Status */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-[#E3F2FD] rounded-lg p-4 border-2 border-blue-100">
                                        <div className="text-sm text-gray-600 mb-1">Current Cash Position</div>
                                        <div className={`text-2xl font-bold ${insightsData.aiInsights.summary.currentCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(insightsData.aiInsights.summary.currentCashPosition)}
                                        </div>
                                    </div>
                                    <div className="bg-[#E0F7FA] rounded-lg p-4 border-2 border-cyan-100">
                                        <div className="text-sm text-gray-600 mb-1">Cash Flow Status</div>
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(insightsData.aiInsights.summary.cashFlowStatus)}`}>
                                            {insightsData.aiInsights.summary.cashFlowStatus.charAt(0).toUpperCase() + insightsData.aiInsights.summary.cashFlowStatus.slice(1)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {insightsData.aiInsights.summary.daysCashOnHand} days cash on hand
                                        </div>
                                    </div>
                                    <div className="bg-[#FFEBEE] rounded-lg p-4 border-2 border-red-100">
                                        <div className="text-sm text-gray-600 mb-1">Total Obligations</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {formatCurrency(insightsData.aiInsights.summary.totalObligations)}
                                        </div>
                                    </div>
                                </div>

                                {/* Key Insights */}
                                {insightsData.aiInsights.insights && insightsData.aiInsights.insights.length > 0 && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                                            Key Insights
                                        </h3>
                                        <ul className="space-y-2">
                                            {insightsData.aiInsights.insights.map((insight, index) => (
                                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* AI Reasoning */}
                                {insightsData.aiInsights.reasoning && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-2">Analysis Reasoning</h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">{insightsData.aiInsights.reasoning}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Financial Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[#E8F5E9] rounded-lg p-6 border border-green-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(insightsData.totalRevenue)}</div>
                                <div className="text-xs text-gray-500 mt-1">{insightsData.paidInvoices.count} paid invoices</div>
                            </div>

                            <div className="bg-[#FFF8E1] rounded-lg p-6 border border-yellow-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Pending Invoices</span>
                                    <DollarSign className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(insightsData.pendingInvoices.totalAmount)}</div>
                                <div className="text-xs text-gray-500 mt-1">{insightsData.pendingInvoices.count} outstanding</div>
                            </div>

                            <div className="bg-[#FFEBEE] rounded-lg p-6 border border-red-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Total Expenses</span>
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(insightsData.totalExpenses)}</div>
                                <div className="text-xs text-gray-500 mt-1">Expense management</div>
                            </div>

                            <div className="bg-[#E3F2FD] rounded-lg p-6 border border-blue-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Total Payroll</span>
                                    <DollarSign className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(insightsData.totalPayroll)}</div>
                                <div className="text-xs text-gray-500 mt-1">Employee costs</div>
                            </div>
                        </div>

                        {/* Predictions */}
                        {insightsData.aiInsights?.predictions && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    Cash Flow Predictions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['next30Days', 'next60Days', 'next90Days'].map((periodKey) => {
                                        const prediction = insightsData.aiInsights?.predictions[periodKey as keyof typeof insightsData.aiInsights.predictions];
                                        if (!prediction) return null;

                                        return (
                                            <div key={periodKey} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                                                <div className="text-sm font-medium text-gray-700 mb-3">
                                                    {periodKey === 'next30Days' ? 'Next 30 Days' : periodKey === 'next60Days' ? 'Next 60 Days' : 'Next 90 Days'}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Projected Inflow:</span>
                                                        <span className="font-medium text-green-600">{formatCurrency(prediction.projectedInflow)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Projected Outflow:</span>
                                                        <span className="font-medium text-red-600">{formatCurrency(prediction.projectedOutflow)}</span>
                                                    </div>
                                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Net Cash Flow:</span>
                                                            <span className={`font-bold ${prediction.projectedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatCurrency(prediction.projectedCashFlow)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Confidence: {prediction.confidence}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Risks & Recommendations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Risks */}
                            {insightsData.aiInsights?.risks && insightsData.aiInsights.risks.length > 0 && (
                                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Risk Alerts
                                    </h3>
                                    <div className="space-y-3">
                                        {insightsData.aiInsights.risks.map((risk, index) => (
                                            <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-medium uppercase">{risk.severity} Risk</span>
                                                    <span className="text-xs font-medium">{risk.category}</span>
                                                </div>
                                                <p className="text-sm font-medium mb-1">{risk.description}</p>
                                                <p className="text-xs text-gray-700 mb-2">{risk.impact}</p>
                                                <p className="text-xs font-medium">Recommended: {risk.recommendedAction}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {insightsData.aiInsights?.recommendations && insightsData.aiInsights.recommendations.length > 0 && (
                                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Recommendations
                                    </h3>
                                    <div className="space-y-3">
                                        {insightsData.aiInsights.recommendations.map((rec, index) => (
                                            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-medium uppercase">{rec.priority} Priority</span>
                                                    <span className="text-xs font-medium">{rec.category}</span>
                                                </div>
                                                <p className="text-sm font-medium mb-1">{rec.recommendation}</p>
                                                <p className="text-xs text-gray-700 mb-2">{rec.rationale}</p>
                                                <p className="text-xs font-medium">Expected Impact: {rec.expectedImpact}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Opportunities */}
                        {insightsData.aiInsights?.opportunities && insightsData.aiInsights.opportunities.length > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                    Opportunities
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {insightsData.aiInsights.opportunities.map((opp, index) => (
                                        <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                            <div className="text-xs font-medium text-green-800 mb-1 uppercase">{opp.category}</div>
                                            <p className="text-sm font-medium text-gray-900 mb-2">{opp.description}</p>
                                            <p className="text-xs text-gray-700 mb-1">Potential Benefit: {opp.potentialBenefit}</p>
                                            <p className="text-xs font-medium text-green-700">Action: {opp.actionRequired}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Metrics */}
                        {insightsData.aiInsights?.keyMetrics && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Key Financial Metrics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">Collection Rate</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {typeof insightsData.aiInsights.keyMetrics.collectionRate === 'number'
                                                ? `${insightsData.aiInsights.keyMetrics.collectionRate.toFixed(1)}%`
                                                : `${insightsData.aiInsights.keyMetrics.collectionRate}%`}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">Avg Payment Delay</div>
                                        <div className="text-lg font-bold text-gray-900">{insightsData.aiInsights.keyMetrics.averagePaymentDelay} days</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">Expense Ratio</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {typeof insightsData.aiInsights.keyMetrics.expenseToRevenueRatio === 'number'
                                                ? `${insightsData.aiInsights.keyMetrics.expenseToRevenueRatio.toFixed(1)}%`
                                                : `${insightsData.aiInsights.keyMetrics.expenseToRevenueRatio}%`}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">Payroll Ratio</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {typeof insightsData.aiInsights.keyMetrics.payrollToRevenueRatio === 'number'
                                                ? `${insightsData.aiInsights.keyMetrics.payrollToRevenueRatio.toFixed(1)}%`
                                                : `${insightsData.aiInsights.keyMetrics.payrollToRevenueRatio}%`}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600 mb-1">Cash Cycle</div>
                                        <div className="text-lg font-bold text-gray-900">{insightsData.aiInsights.keyMetrics.cashConversionCycle} days</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Monthly Breakdown */}
                        {insightsData.monthlyBreakdown && insightsData.monthlyBreakdown.length > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    Monthly Cash Flow Breakdown
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payroll</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Cash Flow</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {insightsData.monthlyBreakdown.map((month, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthName}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.revenue)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.expenses)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(month.payroll)}</td>
                                                    <td className={`px-4 py-3 text-sm text-right font-medium ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(month.netCashFlow)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pending Invoices Aging */}
                        {insightsData.pendingInvoices && insightsData.pendingInvoices.totalAmount > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Pending Invoices Aging Analysis</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(insightsData.pendingInvoices.agingBreakdown).map(([bucket, data]) => (
                                        <div key={bucket} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="text-sm font-medium text-gray-700 mb-1">{bucket} Days</div>
                                            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.amount)}</div>
                                            <div className="text-xs text-gray-500 mt-1">{data.count} invoices</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Obligations */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Obligations (Next 30 Days)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Upcoming Expenses</div>
                                    <div className="text-2xl font-bold text-red-600">{formatCurrency(insightsData.upcomingExpenses)}</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Upcoming Payroll</div>
                                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(insightsData.upcomingPayroll)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashFlowInsightsPage;

