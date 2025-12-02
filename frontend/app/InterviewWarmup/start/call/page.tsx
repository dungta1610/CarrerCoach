"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

const CallPage: React.FC = () => {
  const searchParams = useSearchParams();
  const selectedOption = searchParams.get("selectedOption") || "";
  const [llmResponse, setLLMResponse] = useState<string>("");

  const [llmCalled, setLLMCalled] = useState<boolean>(false);
  const [backgroundQuestions, setBackgroundQuestions] = useState<string[]>([]);
  const [situationQuestions, setsituationQuestions] = useState<string[]>([]);
  const [technicalQuestions, settechnicalQuestions] = useState<string[]>([]);

  // Store answers for each question
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  // Store AI feedback for each question
  const [feedback, setFeedback] = useState<{
    [key: string]: { score: number; advice: string };
  }>({});
  // Track which questions are being evaluated
  const [evaluating, setEvaluating] = useState<{ [key: string]: boolean }>({});

  const handleAnswerChange = (
    category: string,
    index: number,
    value: string
  ) => {
    const key = `${category}-${index}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitAnswer = async (
    category: string,
    index: number,
    question: string
  ) => {
    const key = `${category}-${index}`;
    const answer = answers[key];

    if (!answer || answer.trim() === "") {
      alert("Please provide an answer before submitting!");
      return;
    }

    setEvaluating((prev) => ({ ...prev, [key]: true }));

    try {
      // Call backend API to evaluate the answer
      const res = await fetch("http://localhost:8000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: answer }),
      });

      const data = await res.json();

      // Extract score and feedback from the response
      if (data.type === "evaluation") {
        setFeedback((prev) => ({
          ...prev,
          [key]: {
            score: parseInt(data.score) || 0,
            advice: data.feedback || "No feedback provided",
          },
        }));
      } else {
        // If AI didn't recognize it as an interview answer
        setFeedback((prev) => ({
          ...prev,
          [key]: {
            score: 5,
            advice:
              data.response ||
              "Please provide a more detailed answer to the interview question.",
          },
        }));
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setEvaluating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getLLMResponse = async () => {
    setLLMResponse("Loading...");
    const res = await fetch(
      `http://localhost:8000/api/generate-questions?job_title=${encodeURIComponent(
        selectedOption
      )}`,
      { method: "POST" }
    );

    const data = await res.json();

    const questions = Array.isArray(data) ? data : data.questions;

    setLLMResponse(
      Array.isArray(questions)
        ? questions.join("\n")
        : data.error ?? "No response"
    );

    setLLMCalled(true);
  };

  useEffect(() => {
    if (llmCalled) {
      const regex = /^\*?\s*\[(Background|Situation|Technical)]\s+(.+?)\s*$/gm;

      let match: RegExpExecArray | null;
      type Category = "Background" | "Situation" | "Technical";

      const bgques: string[] = [];
      const sitques: string[] = [];
      const tecques: string[] = [];

      while ((match = regex.exec(llmResponse)) !== null) {
        const category = match[1] as Category;
        const question = match[2].trim();

        switch (category) {
          case "Background":
            bgques.push(question);
            break;
          case "Situation":
            sitques.push(question);
            break;
          case "Technical":
            tecques.push(question);
            break;
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBackgroundQuestions(bgques);
      setsituationQuestions(sitques);
      settechnicalQuestions(tecques);
    }
  }, [llmResponse, llmCalled]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <div className="navbar bg-base-100 shadow-sm py-4 min-h-24">
        <div className="navbar-start">
          <div className="flex flex-col gap-1">
            <li className="btn btn-ghost text-3xl h-auto py-2">
              <Link href="/">
                interview{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
                  warmup
                </span>
              </Link>
            </li>
            <p className="text-base text-gray-600 pl-4 mb-4">
              Preparing for:{" "}
              <span className="font-semibold text-blue-600">
                {selectedOption}
              </span>
            </p>
          </div>
        </div>

        <div className="navbar-center"></div>

        <div className="navbar-end">
          <ul className="menu menu-horizontal px-1">
            <button
              className="btn btn-primary btn-lg rounded-4xl"
              onClick={() => getLLMResponse()}
            >
              Generate questions
            </button>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="tabs tabs-box tabs-border mt-8">
          <input
            type="radio"
            name="my_tabs_6"
            className="tab h-12 text-base font-medium text-gray-500 aria-checked:text-indigo-600 aria-checked:border-indigo-600"
            aria-label="Background"
            defaultChecked
          />
          <div className="tab-content p-6 w-full bg-transparent border-none">
            {backgroundQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No background questions yet
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {backgroundQuestions.map((q, idx) => {
                  const key = `Background-${idx}`;
                  const hasAnswer = answers[key]?.trim().length > 0;
                  const hasFeedback = feedback[key];
                  const isEvaluating = evaluating[key];

                  return (
                    <div
                      key={idx}
                      className="bg-linear-to-br from-red-50 to-red-50 rounded-2xl p-6 border border-red-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-red-500 text-white text-base font-bold rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            Background
                          </span>
                          <p className="text-base text-gray-800 font-medium leading-relaxed">
                            {q}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Answer:
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-lg border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
                          rows={4}
                          placeholder="Type your answer here..."
                          value={answers[key] || ""}
                          onChange={(e) =>
                            handleAnswerChange(
                              "Background",
                              idx,
                              e.target.value
                            )
                          }
                          disabled={!!hasFeedback}
                        />
                      </div>

                      {!hasFeedback && (
                        <button
                          className="mt-3 btn btn-primary btn-sm"
                          onClick={() =>
                            handleSubmitAnswer("Background", idx, q)
                          }
                          disabled={!hasAnswer || isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Evaluating...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </button>
                      )}

                      {hasFeedback && (
                        <div className="mt-4 bg-white rounded-lg p-4 border-l-4 border-red-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎯</span>
                            <h4 className="font-semibold text-gray-800">
                              AI Evaluation
                            </h4>
                            <span className="ml-auto badge badge-lg bg-red-500 text-white">
                              Score: {feedback[key].score}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {feedback[key].advice}
                          </p>
                          <button
                            className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                            onClick={() => {
                              setAnswers((prev) => ({ ...prev, [key]: "" }));
                              setFeedback((prev) => {
                                const newFeedback = { ...prev };
                                delete newFeedback[key];
                                return newFeedback;
                              });
                            }}
                          >
                            ↻ Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <input
            type="radio"
            name="my_tabs_6"
            className="tab h-12 text-base font-medium text-gray-500 aria-checked:text-indigo-600 aria-checked:border-indigo-600"
            aria-label="Situation"
          />
          <div className="tab-content p-6 w-full bg-transparent border-none">
            {situationQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No situation questions yet
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {situationQuestions.map((q, idx) => {
                  const key = `Situation-${idx}`;
                  const hasAnswer = answers[key]?.trim().length > 0;
                  const hasFeedback = feedback[key];
                  const isEvaluating = evaluating[key];

                  return (
                    <div
                      key={idx}
                      className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 text-white text-base font-bold rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            Situation
                          </span>
                          <p className="text-base text-gray-800 font-medium leading-relaxed">
                            {q}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Answer:
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                          rows={4}
                          placeholder="Type your answer here..."
                          value={answers[key] || ""}
                          onChange={(e) =>
                            handleAnswerChange("Situation", idx, e.target.value)
                          }
                          disabled={!!hasFeedback}
                        />
                      </div>

                      {!hasFeedback && (
                        <button
                          className="mt-3 btn btn-primary btn-sm"
                          onClick={() =>
                            handleSubmitAnswer("Situation", idx, q)
                          }
                          disabled={!hasAnswer || isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Evaluating...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </button>
                      )}

                      {hasFeedback && (
                        <div className="mt-4 bg-white rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎯</span>
                            <h4 className="font-semibold text-gray-800">
                              AI Evaluation
                            </h4>
                            <span className="ml-auto badge badge-lg bg-blue-500 text-white">
                              Score: {feedback[key].score}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {feedback[key].advice}
                          </p>
                          <button
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => {
                              setAnswers((prev) => ({ ...prev, [key]: "" }));
                              setFeedback((prev) => {
                                const newFeedback = { ...prev };
                                delete newFeedback[key];
                                return newFeedback;
                              });
                            }}
                          >
                            ↻ Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <input
            type="radio"
            name="my_tabs_6"
            className="tab h-12 text-base font-medium text-gray-500 aria-checked:text-indigo-600 aria-checked:border-indigo-600"
            aria-label="Technical"
          />
          <div className="tab-content p-6 w-full bg-transparent border-none">
            {technicalQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No technical questions yet
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {technicalQuestions.map((q, idx) => {
                  const key = `Technical-${idx}`;
                  const hasAnswer = answers[key]?.trim().length > 0;
                  const hasFeedback = feedback[key];
                  const isEvaluating = evaluating[key];

                  return (
                    <div
                      key={idx}
                      className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-green-500 text-white text-base font-bold rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            Technical
                          </span>
                          <p className="text-base text-gray-800 font-medium leading-relaxed">
                            {q}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Answer:
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-lg border border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all resize-none"
                          rows={4}
                          placeholder="Type your answer here..."
                          value={answers[key] || ""}
                          onChange={(e) =>
                            handleAnswerChange("Technical", idx, e.target.value)
                          }
                          disabled={!!hasFeedback}
                        />
                      </div>

                      {!hasFeedback && (
                        <button
                          className="mt-3 btn btn-primary btn-sm"
                          onClick={() =>
                            handleSubmitAnswer("Technical", idx, q)
                          }
                          disabled={!hasAnswer || isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Evaluating...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </button>
                      )}

                      {hasFeedback && (
                        <div className="mt-4 bg-white rounded-lg p-4 border-l-4 border-green-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎯</span>
                            <h4 className="font-semibold text-gray-800">
                              AI Evaluation
                            </h4>
                            <span className="ml-auto badge badge-lg bg-green-500 text-white">
                              Score: {feedback[key].score}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {feedback[key].advice}
                          </p>
                          <button
                            className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                            onClick={() => {
                              setAnswers((prev) => ({ ...prev, [key]: "" }));
                              setFeedback((prev) => {
                                const newFeedback = { ...prev };
                                delete newFeedback[key];
                                return newFeedback;
                              });
                            }}
                          >
                            ↻ Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
