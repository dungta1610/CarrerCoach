import Link from "next/link";

export default function CareerCoachStart() {
  return (
    <div className="flex flex-col bg-slate-100">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start"></div>

        <div className="navbar-center">
          <a className="text-2xl text-transparent bg-clip-text bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%">
            career coach
          </a>
        </div>

        <div className="navbar-end">
          <ul className="menu menu-horizontal px-1">
            <li className="text-xl text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
              <Link href="/">Interview Warmup</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col grid-rows-5 gap-2.5 h-screen place-items-center">
        <h1 className="text-8xl font-semibold w-full text-center mt-40">
          career{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%">
            dreamer
          </span>
        </h1>
        <h2 className="w-full text-center text-gray-600 font-semibold text-2xl mt-8">
          A playful way to explore career possibilities with AI
        </h2>
        <a href="/CareerCoach/start" className="mt-5">
          <button className="btn btn-info px-20 py-6 rounded-xl">Start</button>
        </a>
      </div>
    </div>
  );
}
