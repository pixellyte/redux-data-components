const action = type => `@@__DATA_COMPONENT_${type}`;

export const DATA_COMPONENT_REQUEST = action('REQUEST');
export const DATA_COMPONENT_LOADING = action('LOADING');
export const DATA_COMPONENT_RESPONSE = action('RESPONSE');
export const DATA_COMPONENT_INVALIDATE = action('INVALIDATE');
export const DATA_COMPONENT_ERROR = action('ERROR');
export const DATA_COMPONENT_RESET = action('RESET');