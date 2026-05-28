const SLOT_HOURS = 0.5
const MINUTES_PER_HOUR = 60

function getDayBounds(techs) {
  if (techs.length === 0) {
    return { startHour: 0, endHour: 0 }
  }

  return techs.reduce(
    (bounds, tech) => ({
      startHour: Math.min(bounds.startHour, tech.shiftStart),
      endHour: Math.max(bounds.endHour, tech.shiftEnd),
    }),
    { startHour: techs[0].shiftStart, endHour: techs[0].shiftEnd },
  )
}

function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd
}

function isResourceBusy(assignments, resourceKey, resourceId, startHour, endHour) {
  return assignments.some((assignment) => {
    if (assignment[resourceKey] !== resourceId) {
      return false
    }

    return rangesOverlap(
      assignment.startHour,
      assignment.endHour,
      startHour,
      endHour,
    )
  })
}

function canAssignJob(job, bay, tech, assignments, startHour) {
  const endHour = startHour + job.durationMin / MINUTES_PER_HOUR

  if (bay.type !== job.requiredBayType) {
    return false
  }

  if (!tech.skills.includes(job.requiredSkill)) {
    return false
  }

  if (startHour < tech.shiftStart || endHour > tech.shiftEnd) {
    return false
  }

  if (isResourceBusy(assignments, 'bayId', bay.id, startHour, endHour)) {
    return false
  }

  return !isResourceBusy(assignments, 'techId', tech.id, startHour, endHour)
}

function findFirstValidAssignment(job, bays, techs, assignments, dayBounds) {
  const durationHours = job.durationMin / MINUTES_PER_HOUR
  const lastStartHour = dayBounds.endHour - durationHours

  for (
    let startHour = dayBounds.startHour;
    startHour <= lastStartHour;
    startHour += SLOT_HOURS
  ) {
    const endHour = startHour + durationHours

    for (const bay of bays) {
      for (const tech of techs) {
        if (canAssignJob(job, bay, tech, assignments, startHour)) {
          return {
            jobId: job.id,
            bayId: bay.id,
            techId: tech.id,
            startHour,
            endHour,
          }
        }
      }
    }
  }

  return {
    jobId: job.id,
    bayId: null,
    techId: null,
    startHour: null,
    endHour: null,
  }
}

function buildSchedule(bays, techs, jobs) {
  const dayBounds = getDayBounds(techs)
  const assignments = []

  for (const job of jobs) {
    const assignment = findFirstValidAssignment(
      job,
      bays,
      techs,
      assignments,
      dayBounds,
    )

    assignments.push(assignment)
  }

  return assignments
}

function getOptimizedJobOrder(bays, techs, jobs) {
  return jobs
    .map((job, index) => ({ job, index }))
    .sort((first, second) => {
      const firstQualifiedTechs = techs.filter((tech) =>
        tech.skills.includes(first.job.requiredSkill),
      ).length
      const secondQualifiedTechs = techs.filter((tech) =>
        tech.skills.includes(second.job.requiredSkill),
      ).length

      if (firstQualifiedTechs !== secondQualifiedTechs) {
        return firstQualifiedTechs - secondQualifiedTechs
      }

      const firstMatchingBays = bays.filter(
        (bay) => bay.type === first.job.requiredBayType,
      ).length
      const secondMatchingBays = bays.filter(
        (bay) => bay.type === second.job.requiredBayType,
      ).length

      if (firstMatchingBays !== secondMatchingBays) {
        return firstMatchingBays - secondMatchingBays
      }

      if (first.job.durationMin !== second.job.durationMin) {
        return second.job.durationMin - first.job.durationMin
      }

      const firstDueBy = first.job.dueBy ?? Number.POSITIVE_INFINITY
      const secondDueBy = second.job.dueBy ?? Number.POSITIVE_INFINITY

      if (firstDueBy !== secondDueBy) {
        return firstDueBy - secondDueBy
      }

      return first.index - second.index
    })
    .map(({ job }) => job)
}

export function buildBaselineSchedule(bays, techs, jobs) {
  return buildSchedule(bays, techs, jobs)
}

export function buildOptimizedSchedule(bays, techs, jobs) {
  return buildSchedule(bays, techs, getOptimizedJobOrder(bays, techs, jobs))
}

export function computeUtilization(schedule, bays, techs) {
  const dayBounds = getDayBounds(techs)
  const scheduledAssignments = schedule.filter(
    (assignment) =>
      assignment.bayId !== null &&
      assignment.techId !== null &&
      assignment.startHour !== null &&
      assignment.endHour !== null,
  )
  const scheduledMinutes = scheduledAssignments.reduce(
    (total, assignment) =>
      total + (assignment.endHour - assignment.startHour) * MINUTES_PER_HOUR,
    0,
  )
  const totalBayMinutes =
    bays.length * (dayBounds.endHour - dayBounds.startHour) * MINUTES_PER_HOUR
  const bayUtilizationPct =
    totalBayMinutes === 0 ? 0 : (scheduledMinutes / totalBayMinutes) * 100

  const perTechnicianUtilization = techs.map((tech) => {
    const techScheduledMinutes = scheduledAssignments
      .filter((assignment) => assignment.techId === tech.id)
      .reduce(
        (total, assignment) =>
          total + (assignment.endHour - assignment.startHour) * MINUTES_PER_HOUR,
        0,
      )
    const shiftMinutes = (tech.shiftEnd - tech.shiftStart) * MINUTES_PER_HOUR

    return {
      techId: tech.id,
      utilizationPct:
        shiftMinutes === 0 ? 0 : (techScheduledMinutes / shiftMinutes) * 100,
      scheduledMinutes: techScheduledMinutes,
      availableMinutes: shiftMinutes,
    }
  })

  return {
    bayUtilizationPct,
    scheduledJobs: scheduledAssignments.length,
    unscheduledJobs: schedule.length - scheduledAssignments.length,
    perTechnicianUtilization,
  }
}
