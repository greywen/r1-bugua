export function calculateAge(birthdayString: string | Date): {
  years: number,
  months: number
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
    months
  };
}
