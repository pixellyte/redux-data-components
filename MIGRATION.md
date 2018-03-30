# Migration Process

This document maintains a running log of migration steps, as needed, for upgrading
redux-data-components from an earlier release.  The sections are sequential: to update,
find the section that applies to your current version, apply the necessary changes in
that section, then proceed to the following sections until you've applied the section
that covers your target version.

## Pre-0.5 to 0.5

The 0.5 release includes the following changes:
1. Replace `dataComponentMiddleware` with a store wrapper, `enableComponentStore`.
1. More efficient redux-persist support

#### Why to update

Although previous releases efficiently supported multiple references to the same 
component, redux-persist was unaware of this arrangement, and persisted an independent
copy of each instance.  If you had multiple instances of a very large piece of data, 
you could overflow the local storage quota.
  
Version 0.5 fixes this by moving the actual data components into a separate store, then storing Proxy-based references to the components in the main
store.  Persistence is handled by adding a specialized reflector in the main store,
which is guaranteed to reflect exactly one copy of each component's data, and which
manages synchronizing the rehydrated reflection back into the component store.

#### Why not to update

The new architecture adds complexity that wasn't previously present, although the
interface for users should be almost identical.  The new release is slightly less 
convenient to debug, and there is a small chance of unexpected behaviors resulting 
from migration depending on the particulars of your application.  If you are not using
persistence, are not storing multiple instances of the same component in your tree, or 
are storing little enough data that you are not at risk of hitting storage limits, 
then you might consider remaining on 0.4.1.

#### Steps to update
1. Remove dataComponentMiddleware from your store initialization.  An analogue of
   this middleware is now automatically included in the component store, and not
   exposed or required in the main store.
   
2. Import `enableComponentStore` and call with your store:

    ```javascript
    import { createStore, applyMiddleware } from 'redux';
    import rootReducer from './rootReducer';
    import middleware from './middleware';
    import { enableComponentStore } from 'redux-data-components';
    
    const enhancers = applyMiddleware(...middleware);
    const store = createStore(rootReducer, {}, enhancers);
    enableComponentStore(store); 
    // NOTE: pass component store middleware (like loggers) as additional arguments to enableComponentStore.
    ```
3. (there are no changes to the implementation or mounting of your existing components)

4. IF USING PERSISTENCE: Add dataComponentReflector as a reducer:
    ```javascript
    // rootReducer.js
    // This example assumes disabled auto-merge in redux-persist.  See
    // README for documentation of further config options.  
    import { persistCombineReducers } from 'redux-persist';
    import storage from 'redux-persist/es/storage';
    import { dataComponentReflector } from 'redux-data-components';
 
    const persistConfig = {
       key: 'myRootKey',
       stateReconciler: false,
       storage
    };

 
    export default persistCombineReducers(persistConfig, {
       //...other_reducers,
       componentReflection: dataComponentReflector({
           auto: false, 
           key: 'myRootKey',
           path: ['componentReflection']
        })
    });
    ```
    
5.  You might see browser console errors on first load after updating.  This is
    normal due to changed structure of the storage.
    
#### How to debug with component references
When debugging after migration, you will notice that what appears in your store are
anonymous Proxy objects instead of the actual components.  These are bound to empty
objects ({}) instead of the target to prevent serialization via the (possibly
duplicated) proxies.  But the Proxy's get method forwards all calls to the correct
object, so the Proxy works as expected in place of the actual component.

Programmatically, `(Proxy).targetComponent` will return the actual component, though this
should practically never be necessary.  In the debugger, expand the Proxy's "Handler"
(*not* its "Target"), and note that the "target" member of the handler points to the
actual component instance.  This exists only for purposes of browsing in the debugger.