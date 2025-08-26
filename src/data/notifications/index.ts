import iconsYAML from './icons.yaml';
import messagesYAML from './messages.yaml';
import promotionsYAML from './promotions.yaml';

export const messages = messagesYAML;

export const icons = iconsYAML as {
  classic: string[];
  promotion: string[];
};

export const { promotions } = promotionsYAML as {
  promotions: {
    icon?: string;
    url: string;
    message: string;
  }[];
};

promotions.forEach(o => {
  o.message = o.message.trim();
});
