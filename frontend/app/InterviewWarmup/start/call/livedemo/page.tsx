"use client";

import React from "react";
import Link from "next/link";

export default function LiveDemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="navbar bg-base-100 shadow-sm py-4 min-h-24">
        <div className="navbar-start">
          <Link
            href="/InterviewWarmup/start/call"
            className="btn btn-ghost text-2xl"
          >
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
              ← Back to Questions
            </span>
          </Link>
        </div>

        <div className="navbar-center">
          <h1 className="text-2xl font-bold text-gray-800">Live Demo</h1>
        </div>

        <div className="navbar-end"></div>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Live Interview Demo
            </h2>
            <p className="text-gray-600">
              Watch how to effectively answer interview questions
            </p>
          </div>

          {/* Video placeholder */}
          <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center mb-6">
            <div className="text-center">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500">Video demo will be displayed here</p>
            </div>
          </div>

          {/* Demo features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Tips & Tricks
              </h3>
              <p className="text-sm text-gray-600">
                Learn best practices for interview answers
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Real Examples
              </h3>
              <p className="text-sm text-gray-600">
                See actual interview responses
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-1">Quick Guide</h3>
              <p className="text-sm text-gray-600">Get started in minutes</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/InterviewWarmup/start/call"
              className="btn btn-primary rounded-full px-8"
            >
              Start Practicing
            </Link>
            <button className="btn btn-outline rounded-full px-8">
              Watch Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
