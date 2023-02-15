type Position = { x?: number; y?: number };

type TechAction = {
  class: 'com.unciv.logic.civilization.TechAction';
  techName: string;
};

type LocationAction = {
  class: 'com.unciv.logic.civilization.LocationAction';
  locations: Position[];
};

type DiplomacyAction = {
  class: 'com.unciv.logic.civilization.DiplomacyAction';
  otherCivName: string;
};

type CityAction = {
  class: 'com.unciv.logic.civilization.CityAction';
  city: Position;
};

export type Action = TechAction | LocationAction | DiplomacyAction | CityAction;
