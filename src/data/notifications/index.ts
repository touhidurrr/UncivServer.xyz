import iconsTOML from './icons.toml';
import messagesJSON from './messages.json';
import promotionsTOML from './promotions.toml';

export const messages = messagesJSON;
export const icons = iconsTOML as {
  classic: string[];
  promotion: string[];
};
export const { promotions } = promotionsTOML as {
  promotions: {
    icon?: string;
    url: string;
    message: string;
  }[];
};
