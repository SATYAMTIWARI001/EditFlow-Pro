import React, { useState } from "react";
import { ParticipantRecord } from "../types";
import { Search, CheckCircle, AlertCircle, Award, Calendar, FileText, Landmark } from "lucide-react";

interface VerificationPageProps {
  history: ParticipantRecord[];
  onSelectRecordName: (name: string, record: ParticipantRecord) => void;
}

export default function VerificationPage({ history, onSelectRecordName }: VerificationPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedRecord, setSearchedRecord] = useState<ParticipantRecord | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!searchQuery.trim()) {
      setSearchedRecord(null);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    
    // Find record by ID or Name (case insensitive)
    const result = history.find(
      (r) => r.certificateId.toLowerCase() === query || r.name.toLowerCase() === query
    );
    setSearchedRecord(result || null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="verification-page-root">
      
      {/* Search Input Box Card */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm h-fit">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Certificate Verification</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Verify the authenticity of digital credentials issued by CertifyAI. Enter the unique Certificate Verification ID (e.g. GSA-2026-XXXX) or the participant's full name.
        </p>

        <form onSubmit={handleSearch} className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="GSA-2026-3021 or Satyam Tiwari"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Verify Credential
          </button>
        </form>

        {/* Quick hint for preloaded demo records */}
        <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo Credentials for test</p>
          <div className="space-y-1.5 text-[11px]">
            {history.slice(0, 3).map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSearchQuery(r.certificateId);
                  setSearchedRecord(r);
                  setSearched(true);
                }}
                className="w-full text-left font-mono p-1 px-1.5 bg-white dark:bg-slate-900 border hover:border-blue-300 dark:hover:border-blue-900 rounded text-slate-600 dark:text-slate-400 block truncate transition-all"
              >
                {r.certificateId} - {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      <div className="lg:col-span-2 space-y-6">
        {searched ? (
          searchedRecord ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fadeIn">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">AUTHENTIC CREDENTIAL VERIFIED</h3>
                    <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold mt-0.5">This certificate is genuine and active in registry.</p>
                  </div>
                </div>

                <div className="px-3.5 py-1 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 rounded-full text-xs font-bold w-fit">
                  Verified Active
                </div>
              </div>

              {/* Data Grid details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recipient Name</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <Award className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Event / Qualification</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.event}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <Landmark className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Institution / College</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.college}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Issue Date</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Credential ID</p>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.certificateId}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-xl border border-slate-50 dark:border-slate-850">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Registry Issue Time</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{searchedRecord.generatedAt}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => onSelectRecordName(searchedRecord.name, searchedRecord)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Load in Template Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 shadow-sm text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">CREDENTIAL NOT FOUND</h3>
                <p className="text-xs text-slate-400 mt-1">We couldn't locate any registry matches for "{searchQuery}". Check for spelling typos.</p>
              </div>
            </div>
          )
        ) : (
          /* General History Registry List */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Certificate Registry Logs ({history.length})</h3>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/80 max-h-[400px] overflow-y-auto">
              {history.map((record) => (
                <div key={record.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400 rounded-lg">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.name}</p>
                      <p className="text-[10px] text-slate-400">{record.event} ({record.college})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                      {record.certificateId}
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery(record.certificateId);
                        setSearchedRecord(record);
                        setSearched(true);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Verify Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
