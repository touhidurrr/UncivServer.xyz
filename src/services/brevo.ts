import { BrevoClient } from '@getbrevo/brevo';

const { BREVO_API_KEY = '' } = process.env;

export const brevo = BREVO_API_KEY ? new BrevoClient({ apiKey: BREVO_API_KEY }) : null;
