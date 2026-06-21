import { corsHeaders } from '../constants';

export const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

export const success = (data, status = 200) => jsonResponse({ success: true, data }, status);
export const error = (message, status = 400) => jsonResponse({ success: false, error: message }, status);
