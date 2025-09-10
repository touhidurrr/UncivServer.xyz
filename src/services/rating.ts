import { DISPLAY_Z, INITIAL_MU, INITIAL_SIGMA, MIN_RATING } from '@constants';
import { type Options, type Rating, rate } from 'openskill';

const OPTIONS = {
  mu: INITIAL_MU,
  sigma: INITIAL_SIGMA,
} satisfies Options;

export const calculateRating = (ratings: Rating[]) =>
  rate(
    ratings.map(r => [r]),
    OPTIONS
  ).map(([{ mu, sigma }]) => {
    let cur = mu - DISPLAY_Z * sigma;
    if (mu < MIN_RATING) mu = MIN_RATING;
    if (cur < MIN_RATING) cur = MIN_RATING;
    return { cur, mu, sigma };
  });
