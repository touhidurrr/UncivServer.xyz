import allowedDomains from '@data/security/allowedDomains.json';
import type { UncivJSON } from '@localTypes/unciv';
import { URL } from 'node:url';

const allowedDomainsSet = new Set(allowedDomains);

export function gameDataSecurityProvider(game: UncivJSON): UncivJSON {
  // LinkAction security
  game.civilizations.forEach(civ => {
    if (!civ.notifications) return;

    civ.notifications.forEach(ntf => {
      if (!ntf.actions) return;

      ntf.actions.forEach(action => {
        if (!action.LinkAction) return;

        let url: URL | null = null;
        try {
          url = new URL(action.LinkAction.url);
          if (
            url.protocol !== 'https:' ||
            !allowedDomainsSet.has(url.hostname) ||
            !allowedDomains.some(domain => url!.hostname.endsWith(`.${domain}`))
          ) {
            console.error(`[SecurityProvider] Insecure LinkAction URL: ${action.LinkAction.url}`);
            delete action.LinkAction;
          }
        } catch {
          console.error(`[SecurityProvider] Invalid LinkAction URL: ${action.LinkAction!.url}`);
          delete action.LinkAction;
        }
      });
    });
  });

  return game;
}
