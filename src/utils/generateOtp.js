export const generateOTP = () => {
  const randomInt = Math.floor(Math.random() * 100000);
  const paddedNumber = randomInt.toString().padStart(5, "0");
  return paddedNumber;
};
