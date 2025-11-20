"use client";

import React, { useState, useEffect } from "react";

const MOCK_TASKS = [
  "Maintain and troubleshoot network infrastructure.",
  "Develop and implement software solutions.",
  "Provide technical support and guidance to end-users.",
  "Manage and secure IT assets and data.",
  "Collaborate with stakeholders to understand technology needs.",
];

const MOCK_SKILLS = [
  "Technical Support",
  "Network Administration",
  "System Maintenance",
  "Problem Solving",
  "User Training",
  "Data Management",
  "Cybersecurity Awareness",
  "Project Coordination",
];

export default function Start() {
  const [step, setStep] = useState("intro");
  const [modal, setModel] = useState("model");
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (step === "loading") {
      const timer = setTimeout(() => setStep("tasks"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleTaskToggle = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-4xl mx-auto transition-all duration-300">
      {(step === "org" ||
        step === "loading" ||
        step === "tasks" ||
        step === "skills") && (
        <div className="fixed top-10 left-10 md:left-20 text-left transition-all">
          <h3 className="text-2xl md:text-4xl font-bold text-gray-800">
            {role}
          </h3>
          {org && <h4 className="text-xl md:text-2xl text-gray-500">{org}</h4>}
        </div>
      )}

      {step === "intro" && (
        <div className="text-center space-y-6 fade-in">
          <div className="text-6xl animate-bounce">👋</div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
            To start, share a current or previous role:
          </h1>
          <button
            className="btn btn-primary mt-8 btn-lg rounded-full px-12"
            onClick={() => setStep("role")}
          >
            Let`s go
          </button>
        </div>
      )}

      {step === "role" && (
        <div className="w-full max-w-2xl space-y-6">
          <label className="text-3xl md:text-5xl font-bold text-gray-400 block mb-4">
            To start, share a current or previous role:
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Software Engineer"
            className="w-full text-4xl md:text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-200 text-gray-800 border-b-2 focus:border-blue-500 transition-colors"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && role && setStep("org")}
          />
          <div className="flex justify-end mt-8">
            <button
              disabled={!role}
              className="btn btn-primary px-10 rounded-full"
              onClick={() => setStep("org")}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "org" && (
        <div className="w-full max-w-2xl space-y-6 pt-20">
          {" "}
          <input
            autoFocus
            type="text"
            placeholder="Organization/Company (optinal)"
            className="w-full text-3xl md:text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-200 text-gray-500"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setStep("loading")}
          />
          <div className="flex gap-4 mt-8">
            <button className="btn btn-ghost" onClick={() => setStep("role")}>
              Back
            </button>
            <button
              className="btn btn-primary px-10 rounded-full"
              onClick={() => setStep("loading")}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mt-4">
            ✨ Generating insights...
          </p>
        </div>
      )}

      {step === "tasks" && (
        <div className="w-full pt-32 pb-10">
          <h2 className="text-xl text-gray-500 mb-6">
            Select all the tasks you performed as a(n) {role} (optional).
          </h2>
          <div className="flex flex-col gap-3">
            {MOCK_TASKS.map((task, idx) => (
              <div
                key={idx}
                onClick={() => handleTaskToggle(task)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-lg
                  ${
                    selectedTasks.includes(task)
                      ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md"
                      : "border-gray-100 bg-white hover:border-gray-200 text-gray-600"
                  }`}
              >
                {task}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <button className="btn btn-ghost" onClick={() => setStep("org")}>
              Back
            </button>
            <button
              className="btn btn-primary px-10 rounded-full"
              onClick={() => setStep("skills")}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "skills" && (
        <div className="w-full pt-32">
          <h2 className="text-xl text-gray-500 mb-6">
            Select at least 3 skills that apply to you.
          </h2>
          <div className="flex flex-wrap gap-3">
            {MOCK_SKILLS.map((skill, idx) => (
              <button
                key={idx}
                onClick={() => handleSkillToggle(skill)}
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all
                   ${
                     selectedSkills.includes(skill)
                       ? "bg-green-100 text-green-800 ring-2 ring-green-400"
                       : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                   }`}
              >
                {skill}
              </button>
            ))}
            <button className="px-6 py-3 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400">
              More skills +
            </button>
          </div>
          {selectedSkills.length < 3 && (
            <div className="text-red-500 text-lg font-semibold mt-6 text-center">
              Please select at least 3 skills to continue.
            </div>
          )}
          <div className="flex justify-between mt-12">
            <button className="btn btn-ghost" onClick={() => setStep("tasks")}>
              Back
            </button>
            <button
              className="btn btn-primary px-10 rounded-full"
              onClick={() => setStep("result")}
              disabled={selectedSkills.length < 3}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="flex flex-col w-full h-screen pt-10">
          <div className="bg-gray-50 p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="badge badge-accent badge-lg mb-4">
              CAREER IDENTITY STATEMENT
            </div>
            <p className="text-2xl md:text-3xl leading-relaxed text-gray-700">
              I am an <span className="font-bold text-indigo-600">{role}</span>{" "}
              professional dedicated to maintaining robust technological
              infrastructures. My core strengths lie in{" "}
              <span className="font-bold text-emerald-600">
                {selectedSkills.slice(0, 3).join(", ")}
              </span>
              ...
            </p>
          </div>
          <div className="mt-8 text-center">
            <button className="btn btn-info btn-wide rounded-full text-white text-lg">
              Explore paths 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
