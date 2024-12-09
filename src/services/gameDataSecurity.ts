import allowedDomains from '@data/security/allowedDomains.json';
import type { UncivJSON } from '@localTypes/unciv';
import { URL } from 'node:url';

const allowedDomainsSet = new Set(allowedDomains);

export function isAllowedURL(candidateURL: string): boolean {
  if (!candidateURL) return false;

  let url: URL | null = null;
  try {
    url = new URL(candidateURL);
    if (
      url.protocol !== 'https:' ||
      (!allowedDomainsSet.has(url.hostname) &&
        !allowedDomains.some(domain => url!.hostname.endsWith(`.${domain}`)))
    ) {
      console.error(`[SecurityProvider] Insecure LinkAction URL: ${candidateURL}`);
      return false;
    }
  } catch {
    console.error(`[SecurityProvider] Invalid LinkAction URL: ${candidateURL}`);
    return false;
  }

  return true;
}

export function gameDataSecurityModifier(game: UncivJSON): UncivJSON {
  // LinkAction security
  game.civilizations.forEach(civ => {
    if (!civ.notifications) return;

    civ.notifications.forEach(ntf => {
      if (!ntf.actions) return;

      ntf.actions.forEach(action => {
        if (!action.LinkAction) return;

        if (!isAllowedURL(action.LinkAction.url)) {
          delete action.LinkAction;
        }
      });
    });
  });

  return game;
}
