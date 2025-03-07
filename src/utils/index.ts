export function calculateAge(birthdayString: string | Date): string {
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

  return `${years}岁${months}个月`;
}
