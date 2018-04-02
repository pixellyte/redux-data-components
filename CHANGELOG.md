# Changelog

## v0.5.2
2 April 2018

Small enhancements:
- `dataComponentReflector` now accepts 'include' and 'exclude' options.  Each accepts
a single component identifier or Array of component identifiers.  This can be used for
whitelist/blacklist behavior for component persistence, but also for separate
reflectors (under separate redux-persist keys) to persist partial sets of data
components in different subtrees.

- 

## v0.5.1
30 March 2018

Minor fixes to 0.5.0 release:
- In `componentWillUpdate` and `componentDidUpdate`, the `updateType` argument will
  receive 'UPDATE' instead of 'UPDATED' for consistency with both the other values
  and the documentation.
- Corrections to README for consistency and clarity.

## v0.5.0
30 March 2018

#### Breaking Changes
 - Middleware is no longer required (or supported) to enable lifecycle methods for 
   data components.  Instead, use `enableComponentStore(store, ...middleware)` to 
   add support for data components to a project.  The optional middleware argument(s)
   allow passing (e.g.) logging middleware to track data component changes.  Data components
   declared in standard reducers will remain null unless the component store is enabled. 
 - The representation of components in the main data store are now proxy references
   to the actual shared components, but which will not serialize into storage.  To
   aid in debugging, the proxies expose a "target" member on the handler member that is
   visible in the debugger.  Additionally, the original object may be accessed 
   programmatically as `proxy.targetComponent`.

#### Fixes
 - Prior versions allowed multiple instances of the same component to share data
   in memory, but `redux-persist` was unaware of this, and wrote an independent
   copy of each instance into local storage.  For certain large data items, this
   could lead to hitting storage limits.  The "real" data components are now stored
   in a separate store, and accessed via proxy objects in the normal redux store.

#### Enhancements
 - Added changelog
 - Exchanged hand-rolled logger middleware for `redux-logger`.
 - If run without redux-persist, Minesweeper will initialize to a new game rather
   than an otherwise-impossible pseudo-win state.
 - `AsyncFetchComponent` now automatically detects and handles if `fetch` returns a
   Promise.  This allows it to return the result of `window.fetch` directly instead
   of adding `.then(response => response)` to your fetch methods.
 - Split up `DataComponent` into `BaseDataComponent`, which provides all the standard
   component functionality, and `DataComponent`, which adds the default `data` reducer and
   the `reset` action.
 - Option to use decorators to declare reducers and actions.  Decorating a class method
   with `@Reducer('propname')` will add the reducer to the class.  As decorators
   are an experimental feature, you will need `babel-plugin-transform-decorators-legacy`
   to compile them.  Existing methods for declaring class reducers are still supported.
   `@Action` is available for action methods, but does not currently serve as more than
   an annotation.  NOTE: support for annotated reducers is implemented in `BaseDataComponent`'s
   `classReducers` method.  If you override this method entirely (without call to `super`),
   annotated reducers will stop working.  
 
