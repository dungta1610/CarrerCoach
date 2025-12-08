"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Start() {
  const router = useRouter();
  const [step, setStep] = useState("upload");
  const [cvText, setCvText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [manualRole, setManualRole] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualSkillsInput, setManualSkillsInput] = useState("");

  const handleFileUpload = async (file: File) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("http://localhost:8000/api/upload-cv", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.error) {
        alert(`Error: ${uploadData.error}`);
        setAnalyzing(false);
        return;
      }

      setCvText(uploadData.cv_text);

      const analysisRes = await fetch("http://localhost:8000/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: uploadData.cv_text }),
      });

      const analysisData = await analysisRes.json();
      if (analysisData.error) {
        alert(`Analysis Error: ${analysisData.error}`);
        setAnalyzing(false);
        return;
      }

      setExtractedSkills(analysisData.skills || []);
      setExtractedTasks(analysisData.recommended_tasks || []);
      setAnalysisResult(analysisData);
      setStep("skills");
    } catch (error) {
      console.error("CV Upload Error:", error);
      alert("Failed to upload CV. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleTaskToggle = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const handleSelectAllSkills = () => {
    if (selectedSkills.length === extractedSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills([...extractedSkills]);
    }
  };

  const handleManualInput = () => {
    if (!manualRole) {
      alert("Please enter your current role");
      return;
    }
    const skills = manualSkillsInput.split(",").map(s => s.trim()).filter(s => s);
    setExtractedSkills(skills.length > 0 ? skills : ["Communication", "Problem Solving", "Teamwork"]);
    setExtractedTasks(["Manage projects", "Collaborate with teams", "Deliver results"]);
    setAnalysisResult({
      extracted_role: manualRole,
      skills: skills,
      experience_years: "Not specified",
      experience_summary: "Manual entry - no CV uploaded",
      education: "Not specified",
      strengths: ["Self-motivated", "Quick learner"],
      weaknesses: ["Limited documented experience"],
      learning_path: {
        immediate: ["Build a professional CV"],
        short_term: ["Gain relevant certifications"],
        long_term: ["Expand professional network"]
      },
      recommended_tasks: ["Manage projects", "Collaborate with teams"]
    });
    setStep("skills");
  };

  const handleContinueToResult = () => {
    localStorage.setItem("cvAnalysis", JSON.stringify({
      ...analysisResult,
      selectedSkills,
      selectedTasks,
    }));
    router.push("/CareerCoach/start/result");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
      {step === "upload" && (
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% mb-4">
              Career Coach
            </h1>
            <p className="text-xl text-gray-600">
              Upload your CV or enter your information manually
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <label
                htmlFor="cv-upload"
                className="btn btn-primary btn-lg rounded-full px-12 cursor-pointer"
              >
                Upload CV
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Supported: PDF, DOC, DOCX, PNG, JPG
              </p>
              
              <div className="divider">OR</div>
              
              <button
                onClick={() => setStep("manual")}
                className="btn btn-outline btn-lg rounded-full px-12"
              >
                Enter Manually
              </button>
            </div>
          </div>

          {analyzing && (
            <div className="mt-8 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-lg text-gray-600 mt-4">
                Analyzing your CV with AI...
              </p>
            </div>
          )}
        </div>
      )}

      {step === "manual" && (
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Enter Your Information
            </h2>
            <p className="text-gray-600">
              Fill in your professional details
            </p>
          </div>

          <div className="space-y-6 bg-white p-8 rounded-2xl shadow-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                placeholder="e.g., Google, Microsoft"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills (Optional - comma separated)
              </label>
              <textarea
                value={manualSkillsInput}
                onChange={(e) => setManualSkillsInput(e.target.value)}
                placeholder="e.g., JavaScript, Python, Leadership, Project Management"
                className="textarea textarea-bordered w-full h-24"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("upload")}
                className="btn btn-ghost btn-lg rounded-full flex-1"
              >
                Back
              </button>
              <button
                onClick={handleManualInput}
                className="btn btn-primary btn-lg rounded-full flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "skills" && (
        <div className="w-full pt-20 pb-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Select Your Skills
            </h2>
            <p className="text-gray-600">
              {analysisResult?.experience_summary === "Manual entry - no CV uploaded" 
                ? "Select or add skills that best describe you" 
                : "We found these skills in your CV. Select the ones you want to highlight."}
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              {selectedSkills.length} / {extractedSkills.length} selected
            </p>
            <button
              onClick={handleSelectAllSkills}
              className="btn btn-sm btn-outline"
            >
              {selectedSkills.length === extractedSkills.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {extractedSkills.map((skill, idx) => (
              <button
                key={idx}
                onClick={() => handleSkillToggle(skill)}
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all ${
                  selectedSkills.includes(skill)
                    ? "bg-blue-500 text-white ring-2 ring-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("tasks")}
            className="btn btn-lg px-20 py-6 rounded-full w-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all text-white border-none bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%"
            disabled={selectedSkills.length === 0}
          >
            Continue to Tasks
          </button>
        </div>
      )}

      {step === "tasks" && (
        <div className="w-full pt-20 pb-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Select Relevant Tasks
            </h2>
            <p className="text-gray-600">
              Choose the tasks that best match your experience (optional).
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {extractedTasks.map((task, idx) => (
              <div
                key={idx}
                onClick={() => handleTaskToggle(task)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTasks.includes(task)
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {task}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep("skills")}
              className="btn btn-ghost btn-lg rounded-full flex-1"
            >
              Back
            </button>
            <button
              onClick={handleContinueToResult}
              className="btn btn-lg px-20 py-6 rounded-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all text-white border-none bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%"
            >
              View Analysis Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
