import cron from 'node-cron';
import { getLatestReport, getRecentJobs, getSettings, updateSettings } from './db.ts';
import { runProspectDiscovery } from './researchEngine.ts';

let cronTask: ReturnType<typeof cron.schedule> | null = null;
let isJobRunning = false;
let nextScheduledRunTime: string | null = null;

export const initScheduler = () => {
  const settings = getSettings();
  setupCronSchedule(settings.dailyScheduleTime, settings.timezone, settings.cronEnabled);
};

export const setupCronSchedule = (dailyTime: string, timezone: string, enabled: boolean) => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }

  if (!enabled) {
    nextScheduledRunTime = null;
    return;
  }

  // Parse time "08:00" -> hour 8, minute 0
  const [hourStr, minuteStr] = dailyTime.split(':');
  const hour = parseInt(hourStr || '8', 10);
  const minute = parseInt(minuteStr || '0', 10);
  const cronExpression = `${minute} ${hour} * * *`;

  try {
    cronTask = cron.schedule(
      cronExpression,
      async () => {
        if (isJobRunning) return;
        isJobRunning = true;
        try {
          await runProspectDiscovery('daily_cron');
        } catch (err) {
          console.error('Scheduled daily prospecting run failed:', err);
        } finally {
          isJobRunning = false;
          calculateNextRunTime(hour, minute, timezone);
        }
      },
      {
        timezone: timezone || 'Europe/Madrid'
      }
    );

    calculateNextRunTime(hour, minute, timezone);
    console.log(`LeadHunter AI scheduler active: daily at ${dailyTime} (${timezone})`);
  } catch (err) {
    console.error('Failed to configure cron schedule:', err);
  }
};

function calculateNextRunTime(hour: number, minute: number, timezone: string) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  nextScheduledRunTime = next.toISOString();
}

export const triggerRunNow = async (): Promise<any> => {
  if (isJobRunning) {
    throw new Error('A research run is already in progress.');
  }
  isJobRunning = true;
  try {
    const job = await runProspectDiscovery('run_now');
    return job;
  } finally {
    isJobRunning = false;
  }
};

export const toggleScheduler = (enabled: boolean): boolean => {
  const settings = updateSettings({ cronEnabled: enabled });
  setupCronSchedule(settings.dailyScheduleTime, settings.timezone, settings.cronEnabled);
  return settings.cronEnabled;
};

export const getSchedulerStatus = () => {
  const settings = getSettings();
  const latestJob = getLatestReport();
  const recentJobs = getRecentJobs(5);

  return {
    isActive: settings.cronEnabled,
    isCurrentlyRunning: isJobRunning,
    scheduleTime: settings.dailyScheduleTime,
    timezone: settings.timezone,
    nextScheduledRun: settings.cronEnabled ? nextScheduledRunTime : null,
    lastRun: latestJob ? latestJob.completedAt || latestJob.startedAt : null,
    latestReport: latestJob,
    recentJobs
  };
};
