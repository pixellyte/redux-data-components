const action = type => `@@__DATA_COMPONENT_${type}`;

export const DATA_COMPONENT_PROBE = action('PROBE');
export const DATA_COMPONENT_REGISTER = action('REGISTER');
export const DATA_COMPONENT_UPDATE = action('UPDATE');
export const DATA_COMPONENT_REQUEST = action('REQUEST');
export const DATA_COMPONENT_LOADING = action('LOADING');
export const DATA_COMPONENT_RESPONSE = action('RESPONSE');
export const DATA_COMPONENT_INVALIDATE = action('INVALIDATE');
export const DATA_COMPONENT_ERROR = action('ERROR');
export const DATA_COMPONENT_RESET = action('RESET');
export const DATA_COMPONENT_REHYDRATE = action('REHYDRATE');
export const DATA_COMPONENT_REFLECTOR_REHYDRATED = action('REFLECTOR_REHYDRATED');
export const DATA_COMPONENT_REFRESH_PROXIES = action('REFRESH_PROXIES');