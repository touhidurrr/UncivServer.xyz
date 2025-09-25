interface BMCWebhookBaseEvent {
  type: `${string}.${string}`;
  live_mode: boolean;
  attempt: number;
  created: number;
  event_id: number;
  data: BMCWebhookBaseEventData;
}

interface BMCWebhookBaseEventData {
  id: number;
  amount: number;
  object: string;
  status: string;
  currency: string;
  supporter_name: string;
  supporter_id: number;
  supporter_email: string;
}

interface BMCWebhookDonationCreatedEvent extends BMCWebhookBaseEvent {
  type: 'donation.created';
  data: BMCWebhookDonationCreatedEventData;
}

interface BMCWebhookDonationCreatedEventData extends BMCWebhookBaseEventData {
  object: 'payment';
  status: 'succeeded';
  message: string;
  refunded: 'false';
  created_at: number;
  note_hidden: 'true' | 'false';
  refunded_at: null;
  support_note: string | null;
  support_type: 'Supporter';
  supporter_name_type: 'default';
  transaction_id: string;
  application_fee: string;
  total_amount_charged: string;
  coffee_count: number;
  coffee_price: number;
}

interface BMCWebhookMonthlySupportBaseEvent extends BMCWebhookBaseEvent {
  type: `recurring_donation.${string}`;
  data: BMCWebhookMonthlySupportBaseEventData;
}

interface BMCWebhookMonthlySupportBaseEventData extends BMCWebhookBaseEventData {
  object: 'recurring_donation';
  paused: 'true' | 'false';
  status: 'active' | 'canceled';
  canceled: 'true' | 'false';
  psp_id: string;
  duration_type: 'month';
  note_hidden: boolean;
  support_note: string | null;
  current_period_start: number;
  current_period_end: number;
  started_at: number;
  canceled_at: number | null;
}

interface BMCWebhookMonthlySupportStartedEvent extends BMCWebhookMonthlySupportBaseEvent {
  type: 'recurring_donation.started';
  data: BMCWebhookMonthlySupportStartedEventData;
}

interface BMCWebhookMonthlySupportStartedEventData extends BMCWebhookMonthlySupportBaseEventData {
  paused: 'false';
  status: 'active';
  canceled: 'false';
  canceled_at: null;
}

interface BMCWebhookMonthlySupportUpdatedEvent extends BMCWebhookMonthlySupportBaseEvent {
  type: 'recurring_donation.updated';
  data: BMCWebhookMonthlySupportUpdatedEventData;
}

interface BMCWebhookMonthlySupportUpdatedEventData extends BMCWebhookMonthlySupportBaseEventData {
  paused: 'true';
  status: 'active';
  canceled: 'false';
  supporter_feedback: string;
  canceled_at: number;
  cancel_at_period_end: 'true';
}

interface BMCWebhookMonthlySupportCancelledEvent extends BMCWebhookMonthlySupportBaseEvent {
  type: 'recurring_donation.cancelled';
  data: BMCWebhookMonthlySupportCancelledEventData;
}

interface BMCWebhookMonthlySupportCancelledEventData extends BMCWebhookMonthlySupportBaseEventData {
  paused: 'false';
  status: 'canceled';
  canceled: 'true';
  canceled_at: number;
  supporter_feedback: 'CANCELLED_BY_CREATOR';
}

interface BMCWebhookMembershipBaseEvent extends BMCWebhookBaseEvent {
  type: `membership.${string}`;
  data: BMCWebhookMembershipBaseEventData;
}

interface BMCWebhookMembershipBaseEventData extends BMCWebhookBaseEventData {
  object: 'membership';
  paused: 'true' | 'false';
  status: 'active' | 'canceled';
  canceled: 'true' | 'false';
  psp_id: string;
  duration_type: 'month';
  membership_level_id: number;
  membership_level_name: string;
  started_at: number;
  canceled_at: number | null;
  note_hidden: boolean;
  support_note: string | null;
  current_period_end: number;
  current_period_start: number;
}

interface BMCWebhookMembershipStartedEvent extends BMCWebhookMembershipBaseEvent {
  type: 'membership.started';
  data: BMCWebhookMembershipStartedEventData;
}

interface BMCWebhookMembershipStartedEventData extends BMCWebhookMembershipBaseEventData {
  paused: 'false';
  status: 'active';
  canceled: 'false';
  canceled_at: null;
}

interface BMCWebhookMembershipUpdatedEvent extends BMCWebhookMembershipBaseEvent {
  type: 'membership.updated';
  data: BMCWebhookMembershipUpdatedEventData;
}

interface BMCWebhookMembershipUpdatedEventData extends BMCWebhookMembershipBaseEventData {
  paused: 'true';
  status: 'active';
  canceled: 'false';
  canceled_at: number;
  supporter_feedback: string;
  cancel_at_period_end: 'true';
}

interface BMCWebhookMembershipCancelledEvent extends BMCWebhookMembershipBaseEvent {
  type: 'membership.cancelled';
  data: BMCWebhookMembershipCancelledEventData;
}

interface BMCWebhookMembershipCancelledEventData extends BMCWebhookMembershipBaseEventData {
  paused: 'false';
  status: 'canceled';
  canceled: 'true';
  canceled_at: number;
  supporter_feedback: 'CANCELLED_BY_CREATOR';
}

export type BMCWebhookEvent =
  | BMCWebhookDonationCreatedEvent
  | BMCWebhookMonthlySupportStartedEvent
  | BMCWebhookMonthlySupportUpdatedEvent
  | BMCWebhookMonthlySupportCancelledEvent
  | BMCWebhookMembershipStartedEvent
  | BMCWebhookMembershipUpdatedEvent
  | BMCWebhookMembershipCancelledEvent;
