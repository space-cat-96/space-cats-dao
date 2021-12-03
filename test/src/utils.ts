import faker from "faker";

const randomNumberInRange = (min = 100, max = 500) => {
  return Math.random() * (max - min) + min;
};

export const wait = async (time: number = randomNumberInRange()) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const getRandomText = (min = 5, max = 25) => {
  const count = Math.random() * (max - min) + min;
  const text = faker.lorem.words(count);
  return text;
};
