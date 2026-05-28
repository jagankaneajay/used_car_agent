import { useState } from 'react'
import { ScheduleGrid } from './components/ScheduleGrid'
import { bays, jobs, technicians } from './data/seed'
import {
  buildBaselineSchedule,
  buildOptimizedSchedule,
  computeUtilization,
} from './lib/scheduler'

function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

function formatPoints(value) {
  return `${value.toFixed(1)} pts`
}

function MetricTile({ label, value, detail }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-base text-slate-500">{detail}</p> : null}
    </div>
  )
}

function TechnicianUtilization({ utilization, technicians }) {
  const techniciansById = new Map(technicians.map((tech) => [tech.id, tech]))

  return (
    <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
        Technician utilization
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {utilization.perTechnicianUtilization.map((techUtilization) => {
          const tech = techniciansById.get(techUtilization.techId)
          const topUtilized = techUtilization.utilizationPct >= 90

          return (
            <div
              key={techUtilization.techId}
              className={`rounded-md border px-3 py-3 ${
                topUtilized
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {tech?.name ?? techUtilization.techId}
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  {formatPercent(techUtilization.utilizationPct)}
                </p>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {tech?.skills.join(', ') ?? 'Technician'}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    topUtilized ? 'bg-emerald-600' : 'bg-cyan-700'
                  }`}
                  style={{
                    width: `${Math.min(
                      techUtilization.utilizationPct,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const [activeView, setActiveView] = useState('baseline')
  const [animationTick, setAnimationTick] = useState(0)
  const baselineSchedule = buildBaselineSchedule(bays, technicians, jobs)
  const optimizedSchedule = buildOptimizedSchedule(bays, technicians, jobs)
  const baselineUtilization = computeUtilization(
    baselineSchedule,
    bays,
    technicians,
  )
  const optimizedUtilization = computeUtilization(
    optimizedSchedule,
    bays,
    technicians,
  )
  const activeSchedule =
    activeView === 'baseline' ? baselineSchedule : optimizedSchedule
  const activeUtilization =
    activeView === 'baseline' ? baselineUtilization : optimizedUtilization
  const utilizationDelta =
    optimizedUtilization.bayUtilizationPct -
    baselineUtilization.bayUtilizationPct
  const activeTitle =
    activeView === 'baseline' ? 'Baseline Schedule' : 'Optimized Schedule'

  function showSchedule(view) {
    setActiveView(view)
    setAnimationTick((tick) => tick + 1)
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-cyan-800">
              Fixed operations
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              BayFlow — Service Bay Scheduling
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-md border border-cyan-800 bg-cyan-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
              type="button"
              onClick={() => showSchedule('optimized')}
            >
              Optimize Schedule
            </button>
            <div className="flex rounded-md border border-slate-300 bg-white p-1 shadow-sm">
              <button
                className={`rounded px-4 py-2 text-sm font-semibold transition ${
                  activeView === 'baseline'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                type="button"
                onClick={() => showSchedule('baseline')}
              >
                Baseline
              </button>
              <button
                className={`rounded px-4 py-2 text-sm font-semibold transition ${
                  activeView === 'optimized'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                type="button"
                onClick={() => showSchedule('optimized')}
              >
                Optimized
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
          <div className="rounded-md border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-slate-500">
                  Bay utilization
                </p>
                <p className="mt-2 text-6xl font-semibold text-slate-950">
                  {formatPercent(activeUtilization.bayUtilizationPct)}
                </p>
              </div>
              {activeView === 'optimized' ? (
                <div className="rounded-md bg-emerald-100 px-4 py-3 text-emerald-950">
                  <p className="text-lg font-semibold">
                    ↑ {formatPoints(utilizationDelta)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-emerald-800">
                    vs baseline
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 px-4 py-3 text-slate-600">
                  <p className="text-sm font-semibold">Baseline view</p>
                  <p className="mt-1 text-xs font-medium">
                    {formatPercent(optimizedUtilization.bayUtilizationPct)} optimized
                  </p>
                </div>
              )}
            </div>
          </div>

          <MetricTile
            label="Scheduled"
            value={activeUtilization.scheduledJobs}
            detail={`${jobs.length} total jobs`}
          />
          <MetricTile
            label="Unscheduled"
            value={activeUtilization.unscheduledJobs}
            detail={activeView === 'optimized' ? 'after optimization' : 'baseline'}
          />
        </div>

        <TechnicianUtilization
          technicians={technicians}
          utilization={activeUtilization}
        />

        <ScheduleGrid
          key={`${activeView}-${animationTick}`}
          assignments={activeSchedule}
          bays={bays}
          jobs={jobs}
          technicians={technicians}
          title={activeTitle}
        />
      </section>
    </main>
  )
}

export default App
