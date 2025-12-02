"use client";

import React, { useEffect, useState } from "react";

interface CVAnalysis {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  extracted_skills: string[];
  summary: string;
}

interface Job {
  job_name: string;
  company_name: string;
  job_url: string;
  job_description?: string;
  job_requirement?: string;
}

export default function ResultPage() {
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Get data from sessionStorage
    const analysisData = sessionStorage.getItem("cvAnalysis");
    const jobsData = sessionStorage.getItem("recommendedJobs");

    if (analysisData) {
      Promise.resolve().then(() => setCvAnalysis(JSON.parse(analysisData)));
    }

    if (jobsData) {
      Promise.resolve().then(() => setRecommendedJobs(JSON.parse(jobsData)));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Your CV Analysis Results
          </h1>
          <p className="text-gray-600">
            Here`s what we found and our recommendations for you
          </p>
        </div>

        {cvAnalysis ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
              <div className="badge badge-primary badge-lg mb-3">
                📊 CV Summary
              </div>
              <p className="text-lg text-gray-800 leading-relaxed">
                {cvAnalysis.summary}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-green-50 p-6 rounded-2xl border border-green-200 shadow-sm">
              <div className="badge badge-success badge-lg mb-3">
                ✅ Strengths
              </div>
              <ul className="list-disc list-inside space-y-2">
                {cvAnalysis.strengths?.map((strength: string, idx: number) => (
                  <li key={idx} className="text-gray-700">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
              <div className="badge badge-warning badge-lg mb-3">
                ⚠️ Areas to Improve
              </div>
              <ul className="list-disc list-inside space-y-2">
                {cvAnalysis.weaknesses?.map((weakness: string, idx: number) => (
                  <li key={idx} className="text-gray-700">
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
              <div className="badge badge-info badge-lg mb-3">
                💡 Recommendations
              </div>
              <ul className="list-decimal list-inside space-y-2">
                {cvAnalysis.improvements?.map(
                  (improvement: string, idx: number) => (
                    <li key={idx} className="text-gray-700 font-medium">
                      {improvement}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Recommended Jobs */}
            {recommendedJobs.length > 0 && (
              <div className="bg-linear-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
                <div className="badge badge-secondary badge-lg mb-4">
                  🎯 Recommended Companies & Roles
                </div>
                <p className="text-gray-600 mb-4">
                  Based on your skills and CV, these positions might be a great
                  fit:
                </p>
                <div className="space-y-3">
                  {recommendedJobs.map((job: Job, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">
                            {job.job_name}
                          </h4>
                          <p className="text-gray-600 mt-1">
                            🏢 {job.company_name}
                          </p>
                        </div>
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary rounded-full"
                        >
                          View Job
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <a
                href="/CareerCoach/start"
                className="btn btn-ghost btn-wide rounded-full text-lg"
              >
                Start Over
              </a>
              <a
                href="/InterviewWarmup/start"
                className="btn btn-success btn-wide rounded-full text-lg text-white"
              >
                Continue to Interview Prep
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No Analysis Data Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please upload your CV first to see the analysis results.
            </p>
            <a
              href="/CareerCoach/start"
              className="btn btn-primary rounded-full px-8"
            >
              Go to CV Upload
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
