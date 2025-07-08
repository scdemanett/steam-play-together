import { sendGTMEvent } from '@next/third-parties/google';

// Define valid GTM event parameter types
type GTMEventValue = string | number | boolean | string[] | number[] | boolean[] | undefined;
type GTMEventParameters = Record<string, GTMEventValue>;

/**
 * Send a custom event to Google Tag Manager
 * @param event - The event name
 * @param parameters - Additional event parameters
 */
export const trackEvent = (event: string, parameters?: GTMEventParameters) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GTM_ID) {
    sendGTMEvent({ event, ...parameters });
  }
};

/**
 * Track page views (useful for SPA navigation)
 * @param page_title - The page title
 * @param page_location - The page URL
 */
export const trackPageView = (page_title: string, page_location?: string) => {
  trackEvent('page_view', {
    page_title,
    page_location: page_location || window.location.href,
  });
};

/**
 * Track user interactions (button clicks, form submissions, etc.)
 * @param action - The action performed
 * @param category - The category of the interaction
 * @param label - Additional label for the interaction
 * @param value - Numeric value associated with the interaction
 */
export const trackInteraction = (
  action: string,
  category?: string,
  label?: string,
  value?: number
) => {
  trackEvent('interaction', {
    event_category: category || 'engagement',
    event_label: label,
    action,
    value,
  });
};

/**
 * Track custom game-related events for your Steam app
 * @param game_action - The game-related action
 * @param game_id - The Steam game ID
 * @param game_name - The game name
 * @param additional_params - Any additional parameters
 */
export const trackGameEvent = (
  game_action: string,
  game_id?: string,
  game_name?: string,
  additional_params?: GTMEventParameters
) => {
  trackEvent('game_event', {
    game_action,
    game_id,
    game_name,
    ...additional_params,
  });
};

/**
 * Track friend-related events
 * @param friend_action - The friend-related action
 * @param friend_count - Number of friends involved
 * @param additional_params - Any additional parameters
 */
export const trackFriendEvent = (
  friend_action: string,
  friend_count?: number,
  additional_params?: GTMEventParameters
) => {
  trackEvent('friend_event', {
    friend_action,
    friend_count,
    ...additional_params,
  });
};

/**
 * Track errors for debugging and monitoring
 * @param error_message - The error message
 * @param error_category - The category of error
 * @param fatal - Whether the error is fatal
 */
export const trackError = (
  error_message: string,
  error_category?: string,
  fatal?: boolean
) => {
  trackEvent('exception', {
    description: error_message,
    error_category: error_category || 'javascript',
    fatal: fatal || false,
  });
}; 