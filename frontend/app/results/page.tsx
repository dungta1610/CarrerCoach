"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import jobData from "../../../../ITviec/job_data.json";

interface AnalysisData {
  extracted_role: string;
  skills: string[];
  experience_years: string;
  experience_summary: string;
  education: string;
  selectedSkills?: string[];
}

interface Job {
  job_url: string;
  job_name: string;
  company_name: string;
  job_description?: string;
  job_requirement?: string;
}

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [generatedCV, setGeneratedCV] = useState("");
  const [matchedJobs, setMatchedJobs] = useState<(Job & { matchScore: number })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("cvAnalysis");
    if (data) {
      const parsed = JSON.parse(data);
      setAnalysis(parsed);
      matchJobs(parsed);
    }
  }, []);

  const matchJobs = (analysisData: AnalysisData) => {
    const userSkills = (analysisData.selectedSkills || analysisData.skills).map(s => s.toLowerCase());
    const userRole = analysisData.extracted_role.toLowerCase();

    const jobsWithScores = jobData.map((job: Job) => {
      let score = 0;
      const jobText = `${job.job_name} ${job.job_description || ""} ${job.job_requirement || ""}`.toLowerCase();

      // Check skill matches
      userSkills.forEach(skill => {
        if (jobText.includes(skill)) score += 15;
      });

      // Check role match
      if (jobText.includes(userRole) || job.job_name.toLowerCase().includes(userRole)) {
        score += 25;
      }

      return { ...job, matchScore: Math.min(score, 100) };
    });

    const topJobs = jobsWithScores
      .filter(j => j.matchScore >= 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    setMatchedJobs(topJobs);
  };

  const generateCV = async () => {
    if (!analysis) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: analysis.extracted_role,
          skills: analysis.selectedSkills || analysis.skills,
          experience: analysis.experience_summary,
          education: analysis.education,
          achievements: [],
        }),
      });

      const data = await response.json();
      if (data.cv_markdown) {
        setGeneratedCV(data.cv_markdown);
      } else {
        alert("Failed to generate CV");
      }
    } catch (error) {
      console.error("CV Generation Error:", error);
      alert("Failed to generate CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Profile Data</h2>
          <p className="text-gray-600 mb-6">Please complete Phase 1 first.</p>
          <Link href="/CareerCoach/start" className="btn btn-primary rounded-full px-8">
            Go to Phase 1
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
            Recommendations
          </h1>
          <p className="text-gray-600">
            Generate your sample CV and explore current job opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CV Generation */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-lg font-bold text-blue-600">Sample CV</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              AI-Generated CV
            </h3>
            
            {!generatedCV ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-600 mb-6">
                  Generate a professional CV based on your profile
                </p>
                <button
                  onClick={generateCV}
                  disabled={loading}
                  className="btn btn-primary btn-lg rounded-full px-12"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    "Generate CV"
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 max-h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {generatedCV.split("\n").map((line, idx) => {
                      if (line.startsWith("# ")) {
                        return <h1 key={idx} className="text-2xl font-bold text-gray-800 mb-2 mt-4">{line.slice(2)}</h1>;
                      } else if (line.startsWith("## ")) {
                        return <h2 key={idx} className="text-xl font-bold text-gray-700 mt-4 mb-2">{line.slice(3)}</h2>;
                      } else if (line.startsWith("### ")) {
                        return <h3 key={idx} className="text-lg font-semibold text-gray-700 mt-3 mb-1">{line.slice(4)}</h3>;
                      } else if (line.startsWith("- ")) {
                        return <li key={idx} className="ml-6 text-gray-600 mb-1">{line.slice(2)}</li>;
                      } else if (line.includes("**")) {
                        const parts = line.split("**");
                        return <p key={idx} className="text-gray-700 mt-2">{parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}</p>;
                      } else if (line.trim()) {
                        return <p key={idx} className="text-gray-600 mb-1">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedCV], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "generated-cv.md";
                      a.click();
                    }}
                    className="btn btn-outline"
                  >
                    Download as Markdown
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
                        const { saveAs } = await import("file-saver");
                        
                        const children: any[] = [];
                        generatedCV.split("\n").forEach(line => {
                          if (line.startsWith("# ")) {
                            children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
                          } else if (line.startsWith("## ")) {
                            children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
                          } else if (line.startsWith("### ")) {
                            children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
                          } else if (line.startsWith("- ")) {
                            children.push(new Paragraph({ text: line.slice(2), bullet: { level: 0 } }));
                          } else if (line.trim()) {
                            children.push(new Paragraph({ text: line }));
                          }
                        });
                        
                        const doc = new Document({ sections: [{ children }] });
                        const blob = await import("docx").then(m => m.Packer.toBlob(doc));
                        saveAs(blob, "generated-cv.docx");
                      } catch (error) {
                        console.error("DOCX generation error:", error);
                        alert("Failed to generate DOCX. Please download as Markdown instead.");
                      }
                    }}
                    className="btn btn-primary"
                  >
                    Download as DOCX
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Job Opportunities */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-lg font-bold text-green-600">Job Opportunities</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              ITViec Matched Jobs
            </h3>

            {matchedJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600">No matching jobs found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {matchedJobs.map((job, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="font-bold text-gray-800">
                            {job.job_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{job.company_name}</span>
                        </div>
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
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Link href="/CareerCoach/start/result" className="btn btn-ghost btn-lg rounded-full">
            ← Back to Analysis
          </Link>
          <Link href="/" className="btn btn-primary btn-lg rounded-full">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
