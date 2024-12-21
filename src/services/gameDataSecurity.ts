import allowedDomains from '@data/security/allowedDomains.json';
import type { UncivJSON } from '@localTypes/unciv';
import { URL } from 'node:url';

const allowedDomainsSet = new Set(allowedDomains);

export const isAllowedURL = (candidateURL: string): boolean => {
  if (!candidateURL) return false;

  let url: URL | null = null;
  try {
    url = new URL(candidateURL);
    if (
      url.protocol !== 'https:' ||
      (!allowedDomainsSet.has(url.hostname) &&
        !allowedDomains.some(domain => url!.hostname.endsWith(`.${domain}`)))
    ) {
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
export const gameDataSecurityModifier = (game: UncivJSON): boolean => {
  let hasModifications = false;

  // LinkAction security
  game.civilizations.forEach(civ => {
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
