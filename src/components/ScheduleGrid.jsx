const MINUTES_PER_HOUR = 60

const JOB_COLORS = [
  'bg-cyan-100 border-cyan-400 text-cyan-950',
  'bg-emerald-100 border-emerald-400 text-emerald-950',
  'bg-amber-100 border-amber-400 text-amber-950',
  'bg-rose-100 border-rose-400 text-rose-950',
  'bg-indigo-100 border-indigo-400 text-indigo-950',
  'bg-lime-100 border-lime-400 text-lime-950',
  'bg-sky-100 border-sky-400 text-sky-950',
  'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-950',
  'bg-orange-100 border-orange-400 text-orange-950',
  'bg-teal-100 border-teal-400 text-teal-950',
  'bg-violet-100 border-violet-400 text-violet-950',
  'bg-yellow-100 border-yellow-400 text-yellow-950',
  'bg-pink-100 border-pink-400 text-pink-950',
  'bg-blue-100 border-blue-400 text-blue-950',
  'bg-red-100 border-red-400 text-red-950',
]

function getDayBounds(technicians) {
  return technicians.reduce(
    (bounds, tech) => ({
      startHour: Math.min(bounds.startHour, tech.shiftStart),
      endHour: Math.max(bounds.endHour, tech.shiftEnd),
    }),
    {
      startHour: technicians[0]?.shiftStart ?? 0,
      endHour: technicians[0]?.shiftEnd ?? 0,
    },
  )
}

function formatHour(hour) {
  const hourPart = Math.floor(hour)
  const minutes = Math.round((hour - hourPart) * MINUTES_PER_HOUR)
  const suffix = hourPart >= 12 ? 'PM' : 'AM'
  const displayHour = hourPart % 12 === 0 ? 12 : hourPart % 12

  if (minutes === 0) {
    return `${displayHour} ${suffix}`
  }

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function getJobColor(jobType, jobTypes) {
  const index = jobTypes.indexOf(jobType)
  return JOB_COLORS[index % JOB_COLORS.length]
}

function makeLookup(items) {
  return new Map(items.map((item) => [item.id, item]))
}

function getHourMarkers(startHour, endHour) {
  const markers = []

  for (let hour = Math.ceil(startHour); hour <= endHour; hour += 1) {
    markers.push(hour)
  }

  return markers
}

function ScheduleBlock({ assignment, job, tech, jobTypes, startHour, totalHours }) {
  const left = ((assignment.startHour - startHour) / totalHours) * 100
  const width = ((assignment.endHour - assignment.startHour) / totalHours) * 100
  const colorClasses = getJobColor(job.type, jobTypes)

  return (
    <div
      className={`schedule-block absolute top-3 bottom-3 overflow-hidden rounded-md border-l-4 px-3 py-2 shadow-sm ring-1 ring-black/5 ${colorClasses}`}
      style={{ left: `${left}%`, width: `${width}%` }}
      title={`${job.type} - ${tech.name}, ${formatHour(
        assignment.startHour,
      )} to ${formatHour(assignment.endHour)}`}
    >
      <p className="truncate text-sm font-semibold leading-5">{job.type}</p>
      <p className="truncate text-xs leading-5 opacity-80">{tech.name}</p>
    </div>
  )
}

function OverflowTray({ assignments, jobsById }) {
  const unscheduled = assignments.filter((assignment) => assignment.bayId === null)

  if (unscheduled.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
        Overflow: no unscheduled jobs
      </div>
    )
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-5 py-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-amber-900">
        Overflow
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {unscheduled.map((assignment) => {
          const job = jobsById.get(assignment.jobId)

          return (
            <span
              key={assignment.jobId}
              className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 shadow-sm"
            >
              {job?.type ?? assignment.jobId}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Legend({ jobTypes }) {
  return (
    <div className="flex flex-wrap gap-2">
      {jobTypes.map((jobType) => (
        <div
          key={jobType}
          className={`rounded border px-2 py-1 text-xs font-medium shadow-sm ${getJobColor(
            jobType,
            jobTypes,
          )}`}
        >
          {jobType}
        </div>
      ))}
    </div>
  )
}

export function ScheduleGrid({ assignments, bays, jobs, technicians, title }) {
  const jobsById = makeLookup(jobs)
  const techsById = makeLookup(technicians)
  const jobTypes = [...new Set(jobs.map((job) => job.type))]
  const { startHour, endHour } = getDayBounds(technicians)
  const totalHours = Math.max(endHour - startHour, 1)
  const hourMarkers = getHourMarkers(startHour, endHour)
  const scheduledAssignments = assignments.filter(
    (assignment) => assignment.bayId !== null,
  )

  return (
    <section className="schedule-enter space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        </div>
        <Legend jobTypes={jobTypes} />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[10rem_1fr] border-b border-slate-200 bg-slate-100">
            <div className="px-4 py-3 text-sm font-semibold text-slate-600">
              Bay
            </div>
            <div className="relative h-12">
              {hourMarkers.map((hour) => {
                const left = ((hour - startHour) / totalHours) * 100

                return (
                  <div
                    key={hour}
                    className="absolute top-0 h-full border-l border-slate-300 pl-2 pt-3 text-xs font-semibold text-slate-500"
                    style={{ left: `${left}%` }}
                  >
                    {formatHour(hour)}
                  </div>
                )
              })}
            </div>
          </div>

          {bays.map((bay) => {
            const bayAssignments = scheduledAssignments.filter(
              (assignment) => assignment.bayId === bay.id,
            )

            return (
              <div
                key={bay.id}
                className="grid min-h-28 grid-cols-[10rem_1fr] border-b border-slate-200 last:border-b-0"
              >
                <div className="flex flex-col justify-center border-r border-slate-200 px-4 py-3">
                  <span className="text-base font-semibold text-slate-800">
                    {bay.name}
                  </span>
                  <span className="mt-1 text-xs uppercase tracking-normal text-slate-500">
                    {bay.type}
                  </span>
                </div>
                <div
                  className="relative min-h-28 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px)]"
                  style={{ backgroundSize: `${100 / totalHours}% 100%` }}
                >
                  {bayAssignments.map((assignment) => {
                    const job = jobsById.get(assignment.jobId)
                    const tech = techsById.get(assignment.techId)

                    if (!job || !tech) {
                      return null
                    }

                    return (
                      <ScheduleBlock
                        key={assignment.jobId}
                        assignment={assignment}
                        job={job}
                        tech={tech}
                        jobTypes={jobTypes}
                        startHour={startHour}
                        totalHours={totalHours}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <OverflowTray assignments={assignments} jobsById={jobsById} />
    </section>
  )
}
