import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { FileSpreadsheet, Download, Calendar, FileText, CheckCircle2, RefreshCcw } from 'lucide-react';

export default function Reports() {
  const { addToast } = useSpot();
  const [reportType, setReportType] = useState('Daily Patrol Summary');
  const [dateRange, setDateRange] = useState('Today');
  const [format, setFormat] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedReport({
        title: `${reportType} (${dateRange})`,
        generatedAt: new Date().toLocaleString(),
        format,
        size: format === 'PDF' ? '2.4 MB' : '840 KB',
        recordsCount: 142
      });
      addToast('Report Ready', `${reportType} compiled successfully.`, 'success');
    }, 1200);
  };

  return (
    <Layout
      title="Automated Security Report Generator"
      subtitle="Compile Daily, Weekly, Monthly Patrol Transcripts, PDF & Excel Export Engines"
    >
      <div className="max-w-4xl space-y-6">
        {/* Report Generator Controls */}
        <div className="card-spot space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" /> Export Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Report Type */}
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-spot"
              >
                <option>Daily Patrol Summary</option>
                <option>Weekly Attendance & Duty Audit</option>
                <option>Monthly Incident Log Report</option>
                <option>Guard Face Biometrics Audit</option>
                <option>SLA Compliance Statement</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Date Horizon</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-spot"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Date Range</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Target Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('PDF')}
                  className={`py-2 rounded-xl font-bold transition text-center border ${
                    format === 'PDF' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('Excel')}
                  className={`py-2 rounded-xl font-bold transition text-center border ${
                    format === 'Excel' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Excel (CSV)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary py-2.5 px-6 text-xs font-bold"
            >
              {isGenerating ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Compiling Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" /> Generate One-Click Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Report Result Preview */}
        {generatedReport && (
          <div className="card-spot border-blue-500/40 bg-blue-950/20 p-5 space-y-4 animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{generatedReport.title}</h4>
                  <div className="text-xs text-slate-400">Generated: {generatedReport.generatedAt} • {generatedReport.recordsCount} Records</div>
                </div>
              </div>

              <span className="badge-info text-xs font-bold">{generatedReport.format}</span>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-400">File Size: {generatedReport.size}</span>
              <button
                onClick={() => addToast('Download Started', `Downloading ${generatedReport.title} in ${generatedReport.format} format...`, 'success')}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                <Download className="h-4 w-4 mr-1" /> Download {generatedReport.format}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
