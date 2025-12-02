"use client";

import { useState, useEffect } from "react";

export default function InterviewStart() {
  const fields: string[] = [
    "Data Science",
    "Machine Learning",
    "Computer Systems",
    "Computer Science",
  ];

  const [currentField, setCurrentField] = useState(fields[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentField((prev) => {
        const currentIndex = fields.indexOf(prev);
        const nextIndex = (currentIndex + 1) % fields.length;
        return fields[nextIndex];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fields]);

  return (
    <div className="flex flex-col bg-slate-100">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start" />

        <div className="navbar-center">
          <a className="text-2xl text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
            coach warmup
          </a>
        </div>

        <div className="navbar-end">
          <ul className="menu menu-horizontal px-1">
          </ul>
        </div>
      </div>
      <div className="flex flex-col grid-rows-5 gap-2.5 h-screen place-items-center">
        <h1 className="text-6xl font-semibold w-full text-center mt-40">
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%">
            career coach
          </span>
        </h1>
        <h2 className="w-full text-center text-gray-600 font-semibold text-2xl mt-8">
          A playful way to explore career possibilities with AI
        </h2>
        <a href="/CareerCoach" className="mt-5">
          <button className="btn btn-info px-20 py-6 rounded-xl">Start</button>
        </a>
      </div>
    </div>
  );
}
