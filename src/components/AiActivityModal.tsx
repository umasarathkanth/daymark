import React from 'react';
import { X, Activity, CheckCircle2, ShieldCheck, Sparkles, Clock, Filter, Brain } from 'lucide-react';
import { AIActivityStep } from '../types';

interface AiActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activitySteps: AIActivityStep[];
}

export const AiActivityModal: React.FC<AiActivityModalProps> = ({
  isOpen,
  onClose,
  activitySteps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 relative max-h-[85vh] flex flex-col">
        <button
          id="close-activity-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pb-4 border-b border-stone-200">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Execution & Responsible AI Inspector</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            Real-time Agent Activity Pipeline
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Zero chain-of-thought exposure. Displays safe operational metadata: model routing, retrieval count, policy gates, and latency.
          </p>
        </div>

        {/* Execution Flow Steps */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {activitySteps.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No recent AI activity steps logged in this session.
            </div>
          ) : (
            activitySteps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="bg-[#FAF9F6] p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      step.status === 'success' 
                        ? 'bg-emerald-500' 
                        : step.status === 'filtered' 
                        ? 'bg-amber-500' 
                        : 'bg-stone-400'
                    }`} />
                    <span className="font-semibold text-xs text-stone-900">
                      {step.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.2 rounded bg-white text-stone-600 border border-stone-200">
                      {step.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap gap-2 text-[11px] text-stone-600">
                  {step.metadata.modelUsed && (
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 font-mono">
                      Model: {step.metadata.modelUsed}
                    </span>
                  )}
                  {step.metadata.executionTimeMs && (
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 font-mono">
                      Latency: {step.metadata.executionTimeMs}ms
                    </span>
                  )}
                  {step.metadata.memoriesRetrieved !== undefined && (
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                      Memories Retrieved: {step.metadata.memoriesRetrieved}
                    </span>
                  )}
                  {step.metadata.interventionSelected && (
                    <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      Intervention: {step.metadata.interventionSelected}
                    </span>
                  )}
                  {step.metadata.policyPassed !== undefined && (
                    <span className={`px-2 py-0.5 rounded border font-semibold ${
                      step.metadata.policyPassed
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}>
                      Policy: {step.metadata.policyPassed ? 'Passed' : 'Blocked (Guardrail)'}
                    </span>
                  )}
                </div>

                {step.metadata.notes && (
                  <div className="text-xs text-stone-600 italic bg-white p-2.5 rounded-lg border border-stone-200/60">
                    {step.metadata.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted & Protected by Firebase Security Rules</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
