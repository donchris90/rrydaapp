import type { CheckInStatus } from '../api/auth';
import type { DailyReward } from '../components/profile/DailyRewardModal';

// Used only when the backend doesn't send rewardSchedule (see CheckInStatus).
// Mirrors users/check-in-rules.ts: 10 coins per streak day, capped at day 7.
const FALLBACK_SCHEDULE = [10, 20, 30, 40, 50, 60, 70];

// Draws the 7-day check-in calendar from the server's status. Nothing here is
// stored on the device: which days are claimed, and today's reward, all
// follow from `streak` and `alreadyCheckedInToday`.
//
// The window is the block of 7 streak days that contains today, so a long
// streak keeps showing the current week (D8–D14, D15–D21, ...). Reward
// amounts stop growing at day 7, so later windows are all the capped amount.
export function buildCheckInWeek(status: CheckInStatus): DailyReward[] {
  const schedule = status.rewardSchedule?.length === 7 ? status.rewardSchedule : FALLBACK_SCHEDULE;
  const todayDay = status.alreadyCheckedInToday ? status.streak : status.streak + 1;
  const windowStart = Math.floor((todayDay - 1) / 7) * 7;

  return Array.from({ length: 7 }, (_, i) => {
    const day = windowStart + i + 1;
    return {
      day,
      coins: schedule[Math.min(day, 7) - 1],
      isClaimed: day < todayDay || (day === todayDay && status.alreadyCheckedInToday),
      isCurrent: day === todayDay,
    };
  });
}
