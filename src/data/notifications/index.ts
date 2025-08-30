import iconsYAML from './icons.yml';
import messagesYAML from './messages.yml';
import promotionsYAML from './promotions.yml';

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
