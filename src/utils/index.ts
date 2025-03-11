import { FourPillars } from "@/app/types";
import { Lunar } from "lunar-typescript";

export function calculateAge(birthdayString: string | Date): {
  years: number;
  months: number;
} {
  const birthday = new Date(birthdayString);
  const today = new Date();

  let years = today.getFullYear() - birthday.getFullYear();
  let months = today.getMonth() - birthday.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birthday.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < birthday.getDate()) {
    months--;
  }

  return {
    years,
    months,
  };
}

export const getChineseHour = (date: Date): string => {
  const hour = date.getHours();
  const hourMap: { [key: number]: string } = {
    23: '子时',
    0: '子时',
    1: '丑时',
    2: '丑时',
    3: '寅时',
    4: '寅时',
    5: '卯时',
    6: '卯时',
    7: '辰时',
    8: '辰时',
    9: '巳时',
    10: '巳时',
    11: '午时',
    12: '午时',
    13: '未时',
    14: '未时',
    15: '申时',
    16: '申时',
    17: '酉时',
    18: '酉时',
    19: '戌时',
    20: '戌时',
    21: '亥时',
    22: '亥时',
  };
  return hourMap[hour] || '';
};

export function calculateFourPillars(dateTime: string | Date): FourPillars {
  const date = new Date(dateTime);
  const lunar = Lunar.fromDate(date);

  const year = lunar.getYearInGanZhi();
  const month = lunar.getMonthInGanZhi();
  const day = lunar.getDayInGanZhi();
  const hour = lunar.getTimeInGanZhi();

  return {
    year,
    month,
    day,
    hour,
  };
}
