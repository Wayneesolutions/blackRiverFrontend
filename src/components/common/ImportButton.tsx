import { useRef, useState } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle, SkipForward } from "lucide-react";

interface ImportError {
  row: number;
  reason: string;
  data?: Record<string, any>;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
  total: number;
  message?: string;
}

interface TemplateColumn {
  header: string;
  example: string;
  required?: boolean;
}

interface ImportButtonProps {
  onImport: (file: File) => Promise<ImportResult>;
  templateColumns: TemplateColumn[];
  templateFileName?: string;
  accept?: string;
  label?: string;
  roles?: string[];
}

function downloadTemplate(columns: TemplateColumn[], fileName: string) {
  const header = columns.map(c => c.header).join(',');
  const example = columns.map(c => `"${c.example}"`).join(',');
  const csv = `${header}\n${example}\n`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadErrorReport(errors: ImportError[], fileName: string) {
  if (!errors.length) return;
  const cols = ['Row', 'Reason', ...Object.keys(errors[0].data || {})];
  const header = cols.join(',');
  const rows = errors.map(e => {
    const rowData = [e.row, `"${e.reason}"`, ...Object.values(e.data || {}).map(v => `"${v}"`)];
    return rowData.join(',');
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportButton({
  onImport,
  templateColumns,
  templateFileName = 'import_template.csv',
  accept = '.csv,.xlsx,.xls',
  label = 'Import'
}: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setLoading(true);
    setResult(null);

    try {
      const res = await onImport(file);
      setResult(res);
      setShowModal(true);
    } catch {
      setResult({ success: false, imported: 0, skipped: 0, errors: [], total: 0, message: 'Upload failed. Please try again.' });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowTemplate(true)}
          title="Download template"
          className="w-10 h-10 border border-theme rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title={`${label} from CSV or Excel`}
          className="w-10 h-10 border border-theme rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Template info modal */}
      {showTemplate && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/75 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-theme">
              <h3 className="font-semibold text-primary">Import Template</h3>
              <button onClick={() => setShowTemplate(false)} className="text-secondary hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-secondary">Download the template, fill it in, then upload. Required columns are marked with *.</p>
              <div className="overflow-x-auto rounded-lg border border-theme">
                <table className="w-full text-xs">
                  <thead className="bg-[rgba(255,255,255,0.04)]">
                    <tr>
                      <th className="text-left px-3 py-2 text-secondary font-medium">Column</th>
                      <th className="text-left px-3 py-2 text-secondary font-medium">Example</th>
                      <th className="text-left px-3 py-2 text-secondary font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {templateColumns.map(col => (
                      <tr key={col.header}>
                        <td className="px-3 py-2 text-primary font-mono">{col.header}{col.required ? ' *' : ''}</td>
                        <td className="px-3 py-2 text-secondary">{col.example}</td>
                        <td className="px-3 py-2">{col.required ? <span className="text-red-500 text-xs font-medium">Required</span> : <span className="text-secondary text-xs">Optional</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-theme">
              <button
                onClick={() => setShowTemplate(false)}
                className="flex-1 px-4 py-2 text-sm border border-theme rounded-lg text-secondary hover:bg-card transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { downloadTemplate(templateColumns, templateFileName); setShowTemplate(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[var(--accent-navyblue)] text-white rounded-lg font-medium hover:opacity-90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/75 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-theme">
              <h3 className="font-semibold text-primary">Import Result</h3>
              <button onClick={() => setShowModal(false)} className="text-secondary hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!result.success && !result.imported ? (
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800">{result.message || 'Import failed.'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="text-green-600 mx-auto mb-1" size={20} />
                    <div className="text-2xl font-bold text-green-700">{result.imported}</div>
                    <div className="text-xs text-green-600 font-medium">Imported</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <SkipForward className="text-blue-500 mx-auto mb-1" size={20} />
                    <div className="text-2xl font-bold text-blue-700">{result.skipped}</div>
                    <div className="text-xs text-blue-600 font-medium">Skipped</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="text-red-500 mx-auto mb-1" size={20} />
                    <div className="text-2xl font-bold text-red-700">{result.errors.length}</div>
                    <div className="text-xs text-red-600 font-medium">Errors</div>
                  </div>
                </div>

                <p className="text-xs text-secondary text-center">
                  Processed {result.total} row(s) total. Skipped rows already exist in the system.
                </p>

                {/* Error list */}
                {result.errors.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2">Failed rows:</div>
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-theme p-2">
                      {result.errors.map((e, i) => (
                        <div key={i} className="text-xs flex gap-2">
                          <span className="text-secondary font-mono w-10 flex-shrink-0">Row {e.row}</span>
                          <span className="text-red-600">{e.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 p-4 border-t border-theme">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-theme rounded-lg text-secondary hover:bg-card transition-colors"
              >
                Close
              </button>
              {result.errors.length > 0 && (
                <button
                  onClick={() => downloadErrorReport(result.errors, 'import_errors.csv')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Error Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
