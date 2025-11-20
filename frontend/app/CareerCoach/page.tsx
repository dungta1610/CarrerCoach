export default function CareerCoachStart() {
  return (
    <div className="flex flex-col">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start"></div>

        <div className="navbar-center">
          <a className="text-xl text-transparent bg-clip-text bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%">
            career coach
          </a>
        </div>

        <div className="navbar-end">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a>Link</a>
            </li>
            <li>
              <details>
                <summary>Parent</summary>
                <ul className="bg-base-100 rounded-t-none p-2">
                  <li>
                    <a>Link 1</a>
                  </li>
                  <li>
                    <a>Link 2</a>
                  </li>
                </ul>
              </details>
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
