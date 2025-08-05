import { DISCORD_INVITE, SUPPORT_URL } from '@constants';
import { promotion } from '@data/notifications';
import { URL } from 'node:url';
import type { UncivGame } from '../models/uncivGame';

const allowedUrlSet = new Set([DISCORD_INVITE, SUPPORT_URL, ...promotion.map(p => p.url)]);

export const isAllowedURL = (candidateURL: string): boolean => {
  if (!candidateURL) return false;

  try {
    const { protocol } = new URL(candidateURL);
    if (protocol !== 'https:' || !allowedUrlSet.has(candidateURL)) {
      console.error(`[SecurityProvider] Insecure LinkAction URL: *${candidateURL}*`);
      return false;
    }
  } catch {
    console.error(`[SecurityProvider] Invalid LinkAction URL: *${candidateURL}*`);
    return false;
  }

  return true;
};

// run security checks and returns true if game data is modified
// game data should be modified in place
export const gameDataSecurityModifier = (game: UncivGame): boolean => {
  let hasModifications = false;

  // LinkAction security
  game.forEachCivilizations(civ => {
    if (!civ.notifications) return;

    civ.notifications.forEach(ntf => {
      if (!ntf.actions) return;

      ntf.actions.forEach(action => {
        if (!action.LinkAction) return;

        if (!isAllowedURL(action.LinkAction.url)) {
          hasModifications = true;
          delete action.LinkAction;
        }
      });
    });
  });

  return hasModifications;
};
