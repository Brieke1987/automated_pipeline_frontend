import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, DollarSign, Calendar, BarChart3, Users, CreditCard, Search, RefreshCw, TrendingUp, Activity, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PaymentDashboard() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loanId, setLoanId] = useState('');
  const [snapshotDate, setSnapshotDate] = useState('');
  const [loanSnapshot, setLoanSnapshot] = useState(null);
  const [validationLogs, setValidationLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [snapshotError, setSnapshotError] = useState(null);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'logs') {
      fetchValidationLogs();
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payments?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanSnapshot = async () => {
    if (!loanId || !snapshotDate) {
      setSnapshotError('Please enter both loan ID and snapshot date');
      return;
    }

    setSnapshotLoading(true);
    setSnapshotError(null);
    setLoanSnapshot(null);

    try {
      const response = await fetch(`${API_URL}/api/loans/${loanId}/snapshots/${snapshotDate}`);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array response and single object response
        if (Array.isArray(data) && data.length > 0) {
          // Get the most recent snapshot (first in array since it's ordered DESC)
          const snapshot = data[0];
          setLoanSnapshot({
            loan_id: snapshot.loan_id,
            snapshot_date: snapshotDate,
            outstanding_balance: snapshot.outstanding_balance,
            total_paid: snapshot.total_paid || 0,
            payments_made: snapshot.payments_made || 0,
            principal_amount: snapshot.principal_amount || 24000, // Default from backend
            borrower_id: snapshot.borrower_id || 'N/A',
            loan_name: snapshot.loan_name || `Loan ${snapshot.loan_id}`
          });
        } else if (data && !Array.isArray(data)) {
          // Single object response
          setLoanSnapshot(data);
        } else {
          setSnapshotError('No snapshot data found for this loan and date');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSnapshotError(errorData.detail || `Failed to fetch snapshot: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching loan snapshot:', error);
      setSnapshotError('Network error: Failed to fetch loan snapshot');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const fetchValidationLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/validation-logs`);
      if (response.ok) {
        const data = await response.json();
        setValidationLogs(data);
      }
    } catch (error) {
      console.error('Error fetching validation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setUploadResult(data);
      
      if (data.status === 'success') {
        // Refresh data after successful upload
        if (activeTab === 'payments') {
          fetchPayments();
        }
      }
    } catch (error) {
      setUploadResult({
        status: 'error',
        message: 'Failed to upload file',
        validation: { 
          errors: [{ row: 0, field: 'network', message: error.message }],
          processed_rows: 0,
          valid_rows: 0
        }
      });
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PaymentReceivedEvent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'ShortPaymentEvent': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'OverPaymentEvent': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'MissedPaymentEvent': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PaymentReceivedEvent': return 'Payment Received';
      case 'ShortPaymentEvent': return 'Short Payment';
      case 'OverPaymentEvent': return 'Over Payment';
      case 'MissedPaymentEvent': return 'Missed Payment';
      default: return status || 'Unknown';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchLoanSnapshot();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Payment Data Pipeline</h1>
          </div>
          <p className="text-slate-600">Manage and analyze loan payment data with real-time insights</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50">
            <nav className="flex space-x-0">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Upload className="inline mr-2" size={16} />
                Upload Data
              </button>
              <button
                onClick={() => setActiveTab('snapshots')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'snapshots'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="inline mr-2" size={16} />
                Loan Snapshots
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="inline mr-2" size={16} />
                Payments
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="inline mr-2" size={16} />
                Upload Logs
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Upload Payment Data</h2>
                  <p className="text-slate-600">
                    Upload CSV or Excel files with payment data. Required columns: id, borrower_id, loan_id, date, currency, description, amount
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="mb-4">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                      </div>
                      <div className="text-lg font-medium text-slate-900 mb-2">
                        {file ? file.name : 'Choose a file to upload'}
                      </div>
                      <div className="text-sm text-slate-500">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV, XLSX, or XLS files up to 10MB'}
                      </div>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center text-sm text-blue-800">
                        <FileText className="mr-2" size={16} />
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2" size={16} />
                            Upload File
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Upload Result */}
                {uploadResult && (
                  <div className={`mt-8 p-6 rounded-xl border-2 ${
                    uploadResult.status === 'success' 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center mb-4">
                      {uploadResult.status === 'success' ? (
                        <CheckCircle className="text-emerald-600 mr-3" size={24} />
                      ) : (
                        <XCircle className="text-red-600 mr-3" size={24} />
                      )}
                      <div>
                        <span className={`font-semibold text-lg ${
                          uploadResult.status === 'success' ? 'text-emerald-800' : 'text-red-800'
                        }`}>
                          {uploadResult.message || (uploadResult.status === 'success' ? 'Upload Successful' : 'Upload Failed')}
                        </span>
                      </div>
                    </div>
                    
                    {uploadResult.validation && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900">
                              {uploadResult.validation.processed_rows || 0}
                            </div>
                            <div className="text-sm text-slate-600">Rows Processed</div>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-600">
                              {uploadResult.validation.valid_rows || 0}
                            </div>
                            <div className="text-sm text-slate-600">Valid Rows</div>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {uploadResult.payments_processed || 0}
                            </div>
                            <div className="text-sm text-slate-600">Payments Created</div>
                          </div>
                        </div>
                        
                        {uploadResult.validation.errors?.length > 0 && (
                          <div className="bg-white p-4 rounded-lg">
                            <div className="font-semibold text-red-700 mb-3 flex items-center">
                              <XCircle className="mr-2" size={18} />
                              Validation Errors ({uploadResult.validation.errors.length})
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {uploadResult.validation.errors.slice(0, 10).map((error, idx) => (
                                <div key={idx} className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
                                  <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                                </div>
                              ))}
                              {uploadResult.validation.errors.length > 10 && (
                                <div className="text-sm text-red-500 italic">
                                  ... and {uploadResult.validation.errors.length - 10} more errors
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {uploadResult.validation.warnings?.length > 0 && (
                          <div className="bg-white p-4 rounded-lg">
                            <div className="font-semibold text-amber-700 mb-3 flex items-center">
                              <AlertTriangle className="mr-2" size={18} />
                              Warnings ({uploadResult.validation.warnings.length})
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-2">
                              {uploadResult.validation.warnings.slice(0, 5).map((warning, idx) => (
                                <div key={idx} className="text-sm text-amber-600 p-2 bg-amber-50 rounded border border-amber-200">
                                  <span className="font-medium">Row {warning.row}:</span> {warning.message}
                                </div>
                              ))}
                              {uploadResult.validation.warnings.length > 5 && (
                                <div className="text-sm text-amber-500 italic">
                                  ... and {uploadResult.validation.warnings.length - 5} more warnings
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Loan Snapshots Tab */}
            {activeTab === 'snapshots' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Loan Balance Snapshots</h2>
                  <p className="text-slate-600">
                    Get a loan's balance snapshot at a specific point in time. Enter the loan ID and date to view historical loan data.
                  </p>
                </div>

                {/* Input Form */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label htmlFor="loanId" className="block text-sm font-medium text-slate-700 mb-2">
                        Loan ID
                      </label>
                      <input
                        id="loanId"
                        type="text"
                        value={loanId}
                        onChange={(e) => setLoanId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter loan ID (e.g., 12345)"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="snapshotDate" className="block text-sm font-medium text-slate-700 mb-2">
                        Snapshot Date
                      </label>
                      <input
                        id="snapshotDate"
                        type="date"
                        value={snapshotDate}
                        onChange={(e) => setSnapshotDate(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <button
                      onClick={fetchLoanSnapshot}
                      disabled={!loanId || !snapshotDate || snapshotLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {snapshotLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2" size={16} />
                          Get Snapshot
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {snapshotError && (
                  <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <XCircle className="text-red-600 mr-3" size={20} />
                      <div>
                        <span className="font-semibold text-red-800">Error</span>
                        <p className="text-red-700 mt-1">{snapshotError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Snapshot Results */}
                {loanSnapshot && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
                      <h3 className="text-xl font-semibold text-slate-900">
                        Loan Snapshot - {loanId}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Snapshot Date: {formatDate(snapshotDate)}
                      </p>
                    </div>
                    
                    <div className="p-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-700">
                            {formatCurrency(loanSnapshot.outstanding_balance)}
                          </div>
                          <div className="text-sm text-red-600 font-medium">Outstanding Balance</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                          <div className="text-2xl font-bold text-emerald-700">
                            {formatCurrency(loanSnapshot.total_paid || 0)}
                          </div>
                          <div className="text-sm text-emerald-600 font-medium">Total Paid</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-700">
                            {loanSnapshot.payments_made || 0}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">Payments Made</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                          <div className="text-2xl font-bold text-purple-700">
                            {formatCurrency(loanSnapshot.principal_amount || 0)}
                          </div>
                          <div className="text-sm text-purple-600 font-medium">Principal Amount</div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <FileText className="mr-2" size={18} />
                            Loan Details
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Loan ID:</span>
                              <span className="font-medium text-slate-900">{loanSnapshot.loan_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Loan Name:</span>
                              <span className="font-medium text-slate-900">{loanSnapshot.loan_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Snapshot Date:</span>
                              <span className="font-medium text-slate-900">{formatDate(loanSnapshot.snapshot_date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <Activity className="mr-2" size={18} />
                            Payment Status
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Payment Progress:</span>
                              <span className="font-medium text-slate-900">
                                {loanSnapshot.principal_amount > 0 
                                  ? `${Math.round(((loanSnapshot.total_paid || 0) / loanSnapshot.principal_amount) * 100)}%`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Payments (if available) */}
                      {loanSnapshot.recent_payments && loanSnapshot.recent_payments.length > 0 && (
                        <div className="mt-8 border-t pt-6">
                          <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                            <Clock className="mr-2" size={18} />
                            Recent Payments (as of snapshot date)
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {loanSnapshot.recent_payments.map((payment, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                  <div className="font-medium text-slate-900">{formatDate(payment.date)}</div>
                                  <div className="text-sm text-slate-600">{payment.description || 'Payment'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-slate-900">{formatCurrency(payment.amount)}</div>
                                  <div className={`text-xs px-2 py-1 rounded border ${getPaymentStatusColor(payment.status)}`}>
                                    {getStatusText(payment.status)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage Instructions */}
                {!loanSnapshot && !snapshotError && (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                    <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Snapshot Selected</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Enter a loan ID and date above to view the loan's balance snapshot at that point in time.
                    </p>
                    <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Snapshots show the loan's state as it was on the specified date, 
                        including balance, payments made, and recent payment history up to that point.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Recent Payments</h2>
                    <p className="text-slate-600">View and manage payment transactions</p>
                  </div>
                  <button
                    onClick={fetchPayments}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center"
                  >
                    <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600">Loading payments...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                    <CreditCard className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payments Found</h3>
                    <p className="text-slate-600">Upload some payment data to get started.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Payment Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Borrower/Loan
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {payments.map((payment, index) => (
                            <tr key={payment.id || index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-slate-900">
                                    Payment #{payment.payment_id || payment.id}
                                  </div>
                                  <div className="text-sm text-slate-500 truncate max-w-xs">
                                    {payment.description || 'Payment transaction'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-900">
                                  <div>Borrower: {payment.borrower_id}</div>
                                  <div>Loan: {payment.loan_id}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {formatDate(payment.payment_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">
                                  {formatCurrency(payment.amount)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {payment.currency || 'USD'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(payment.payment_status)}`}>
                                  {getStatusText(payment.payment_status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {payments.length >= 50 && (
                      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-600 text-center">
                          Showing latest 50 payments. Use filters to find specific transactions.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Upload Logs</h2>
                    <p className="text-slate-600">Track validation results and upload history</p>
                  </div>
                  <button
                    onClick={fetchValidationLogs}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center"
                  >
                    <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600">Loading validation logs...</p>
                  </div>
                ) : validationLogs.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                    <BarChart3 className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Upload Logs</h3>
                    <p className="text-slate-600">Upload some files to see validation logs here.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              File Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Upload Time
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Rows Processed
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Valid/Errors
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {validationLogs.map((log, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FileText className="mr-3 text-slate-400" size={16} />
                                  <span className="text-sm font-medium text-slate-900">
                                    {log.file_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {formatDate(log.upload_timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                                  log.validation_status === 'success' 
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                    : 'text-red-700 bg-red-50 border-red-200'
                                }`}>
                                  {log.validation_status === 'success' ? 'Success' : 'Failed'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {log.total_rows || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-3">
                                  <span className="text-emerald-600 font-medium">
                                    {log.valid_rows || 0} valid
                                  </span>
                                  {log.error_rows > 0 && (
                                    <span className="text-red-600 font-medium">
                                      {log.error_rows} errors
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
