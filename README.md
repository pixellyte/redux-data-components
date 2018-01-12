# Redux Data Components
Redux Data Components are React-like components that exist entirely
within the Redux store.  The components support lifecycle methods so that
data events within the store can trigger subsequent actions without running
afoul of the "don't dispatch while reducing" rule.

## Why?
Redux provides a tidy way of managing application state one discrete action 
at a time, in a way that's easy to reason about.  But most nontrivial
applications will involve asynchronous data loads, resulting in use of 
redux-thunk and writing a lot of actions that look like this:

```javascript
function doTheThing() {
    return dispatch => {
        return Promise.resolve(() => {
            dispatch({ type: "DOING_THE_THING" });
            return fetchMyData();
        }).then(data => {
            dispatch({ type: "DID_THE_THING", data })
            return data;
        }).catch(exception => {
            dispatch({ type: "FAILED_THE_THING", exception })            
        })
    }
}
```

...followed by a corresponding lot of reducers that look like this:

```javascript
function thingDoingStatus(state = false, action) {
    switch(action.type) {
        case 'DOING_THE_THING':
            return true;
        case 'DID_THE_THING':
        case 'FAILED_THE_THING':
            return false;
        default:
            return state;
    }
}
```

...plus a bunch of other reducers for exposing aspects of the data we care about 
(thingDoingData, thingDoingException, etc).

Then your view component ends up looking like this:

```javascript
class MyComponent extends Component {
    componentDidMount() {
        this.props.dispatch(doTheThing());
    }
    
    componentWillReceiveProps(nextProps) {
        if(somePertinentChangeHappened(nextProps)) {
            this.props.dispatch(doTheThing());
        }
    }
    
    render() {
        const { thingDoingStatus } = this.props;
        /* ... */
    }
}
```

### And what's wrong with that?
A number of subtle problems start to creep in while using this pattern:
1. **State Bloat** A general rule of thumb in React is never to add state that can be
    inferred from props already available to the component.  The pattern above seems to
    encourage the opposite, adding new reducers for each aspect of the data we care about.

1. **Confusion of Concerns**  Suppose your component depends on three pieces of
    asynchronously-loaded data, A, B and C.  A and B are independent, but C depends on the
    combined result of A and B.  For instance, A is customer account state, B is customer 
    cart contents, and C is a set of messages determined by evaluating A and B together.

    The reducer for A doesn't have any knowledge of B or vice-versa, and you can't dispatch
    during the reduce anyway.  So you end up with one of a couple of suboptimal solutions:

    1.  **SUBOPTIMAL SOLUTION 1: Complicate your actions:**

        ```javascript
        function fetchA(currentA, currentB) {
            return dispatch => {
                return Promise.resolve(() => {
                    dispatch({ type: "DOING_THE_THING" });
                    return doTheActualFetchOfA();
                }).then(data => {
                    dispatch({ type: "DID_THE_THING", data })
                    if(data != currentA) {
                        dispatch(fetchC(data, currentB));
                    }
                    return data;
                }).catch(exception => {
                    dispatch({ type: "FAILED_THE_THING", exception })            
                })
            }        
        }
        ```
        
        Of course, we'd need to structure ```fetchB``` similarly.  This is ugly 
        because our fetch actions need access to data beyond what they're fetching, 
        and need to make application-logic decisions about the consequences of the
        data changing.  The complexity increases with the number of data elements that 
        contribute to the followup call, since adding a new data dependency of C 
        requires a change to ```fetchA```, ```fetchB``` and any other dependency that
        might trigger ```fetchC```.  Your ```fetchA``` method should do only that.
        
        Another side effect of this approach is the potential for long, nested promise
        chains to manage asynchronous workflows, foregoing the perfectly good message 
        pump Redux already provides in favor of a parallel mechanism that's harder to
        reason about, and which puts the onus on the developer to report progress back
        to Redux via timely dispatches as the promise progresses.
        
    1.  **SUBOPTIMAL SOLUTION 2: Complicate your views:**  

        ```javascript
        class MyComponent extends Component {
            /* ... */
            
            componentWillUpdate(nextProps) {
                if(nextProps.A != this.props.A || nextProps.B != this.props.B) {
                    dispatch(fetchC(nextProps.A, nextProps.B));
                }
            }
            
            /* ... */
        }
        ```
        
        This is ugly because we've mixed application logic into our view component, 
        using the React lifecycle methods as glue between independent properties 
        for no other reason than it lets us dispatch fetchC in response to a 
        data change.  This is a data concern, not a view concern, and should not live
        in our view classes.

1. **Diffusion of Responsibility** In the examples above, responsibility for
   maintaining C is not contained in any central location, but distributed among
   other components that are either contributors to or consumers of C.  This 
   makes changes to any of the components involved more complicated, and can be an
   annoyance for developers who must maintain this code.  Ideally, the
   consumers should have no interest in C beyond rendering its value correctly,
   and the contributors should have no interest at all.
   
In short, *something* should have centralized responsibility for C, including the 
responsibility to watch for changes in A and B and to trigger a refresh of C 
only when needed.  That something should not be a part of a view class, except to the
extent that mounting a particular view is an event that might depend on an up-to-date
value of C.

### A Solution: Redux Data Components
Redux Data Components provide solutions to all these issues and more.
 
 - Data Components provide React-like lifecycle methods, and access to the store's
   dispatch method.  It is legal to dispatch actions from these methods, giving an
   option for triggering new actions on the basis of changes in data, without putting
   that logic in components it doesn't properly belong to.
    
   The components provide a React-like interface for the sake of familiarity, but do
   not depend on or use React itself in any way, making data components appropriate
   for any Redux-backed application, whatever the rendering technology.
   
 - Data Components can be nested, similar to combineReducers, but such that a component's
   lifecycle methods have access to the current state values of the reducers that comprise
   it, allowing for constructive composition of well-encapsulated units of application
   functionality.  Constituent reducers may be class members of the data component, 
   imported standard reducer functions, or other data components.
   
 - Reduction of data components is efficient: to prevent unnecessary instance churn, all
   constituent reducers are run first against the existing instance, and then a new data
   component instance is generated only if one or more of the constituents has changed.
   As a result, object identity (===) can be used to test for changes in a data component.
   
 - Support for [redux-persist](https://github.com/rt2zz/redux-persist) is baked-in (without
   an explicit dependency), although with a caveat:  you will want to use v5 or later of
   redux-persist, and use the PersistGate feature for React applications.  Otherwise, any
   view components that depend on data components might trigger loads during their initial
   render before the REHYDRATE action occurs, resulting in loads of data that might already
   be fresh in local storage.
   
 - Data Component classes may inherit from one another, allowing construction
   of more complex components.  Lifecycle methods are called along the entire ancestor
   chain, so you can define ```componentWillUpdate``` on your component without worrying about
   obscuring necessary behavior in an ancestor's implementation of the same method, and
   without explicitly invoking ```super.componentWillUpdate```.
   
 - Using class instances for managing data allows for implementation of transform methods
   that live with the data itself, rather than in transform-only reducers or in the logic
   of a view component.
   
 - Likewise, data component classes can expose action generator methods appropriate for the
   class.  The result is that the data layer of your application begins to resemble an API,
   backed by Redux, that your view layer consumes.
   
 - The Data Components module includes AsyncFetchComponent, a Data Component that provides
   a standard interface for fetching an external resource.  Extend this component and provide
   a ```fetch()``` method that returns the data from your fetch.  
   
   AsyncFetchComponent provides four built-in internal reducers:  
    - ```data``` contains the data returned from a successful fetch.  
    - ```state``` tracks the load state with a number of values (STALE, REQUESTED, LOADING, ERROR, FRESH).  
    - ```error``` member tracks the error result in case the state becomes ERROR.
    - ```args``` arguments passed to ```request``` or ```forceReload``` are captured here and passed to ```fetch```.
   
   Using an AsyncFetchComponent is a solution to the problem of writing the same boilerplate 
   action for different endpoints day after day.  Implement the meat of the fetch, and all 
   the magic of robustly integrating that fetch into Redux is handled for you.  Your view 
   component will be able to look at the properties on the component and know exactly how to 
   render (e.g. a loading spinner when ```state``` is LOADING, or exception information when 
   ```state``` is ERROR).
   
 - AsyncFetchComponents share data by default.  This is useful for shared/static application
   data cases where multiple components depend on a resource that should be loaded only once.
   Derive your data component from AsyncFetchComponent, and have as many components as you
   like depend on it, or even on multiple instances of the same component.  The first component
   to request the resource triggers a load, and the results (including state management) apply
   by default to all instances of the same component, though this behavior can be customized.
   
   
 
## Usage

### Installing

Install using npm:

```
npm i redux-data-components
```

### Middleware

Redux Data Components depend on a middleware component.  This middleware enables the lifecycle
methods and dispatch access for data components.  Add to your project like any other
middleware:

```javascript
import rootReducer from './rootReducer';
import { dataComponentMiddleware } from 'redux-data-components'

const middleware = applyMiddleware(dataComponentMiddleware);
const store = createStore(
    rootReducer,
    {},
    middleware
);
```

### Defining Components

#### Deriving a component

Derive your component class from DataComponent (or a descendant class).

```javascript
import { DataComponent } from 'redux-data-components'

class MyComponent extends DataComponent {
}
```

#### Connecting the component

A data component must be "connected" to participate in the Redux store.  This defines
a reducer-wrapper function that manages the data component.

```javascript
import { DataComponent, connect } from 'redux-data-components'

class MyComponent extends DataComponent {
}

export default connect(MyComponent);
```

#### Option: Use the default data reducer

The base DataComponent defines one reducer, ```data```, that by default does nothing
but return default state, ```null``` by default.  You may customize its behavior by 
implementing appropriate methods:

```javascript
import { DataComponent, connect } from 'redux-data-components'

class MyComponent extends DataComponent {
    defaultState() {
        return 0
    }
    
    reduceData(state, action) {
        switch(action.type) {
            case 'INCREMENT':
                return state + 1
            case 'DECREMENT':
                return state - 1
            default:
                return super.reduceData(state, action);
        }
    }
}

export default connect(MyComponent);
```

Notice that ```reduceData``` is an inherited method we are overriding.  This means that, for
a reducer method defined as a class member, we can augment an existing reducer in a parent
class with new action handlers (or replacements for existing ones) by using ```super``` in 
the default case as seen above.

#### Option: Completely replace the reducers

The set of reducers for the class is returned by the ```classReducers``` method.  We may
override this method to skip using the default implementation for ```data```.

```javascript
import { DataComponent, connect } from 'redux-data-components'

class MyComponent extends DataComponent {
    classReducers() {
        return {
            my_counter: this.reduceMyCounter
        }
    }
    
    reduceMyCounter(state = 0, action) {
        switch(action.type) {
            case 'INCREMENT':
                return state + 1;
            case 'DECREMENT':
                return state - 1;
            default:
                return state;
        }
    }
}

export default connect(MyComponent);
```

#### Option: Add additional reducers

You can use ```super``` to add reducers to a derived data component.  This component will
have both data *and* status reducers:

```javascript
import { DataComponent, connect } from 'redux-data-components'

class MyComponent extends DataComponent {

    defaultState() { 
        return 0;
    }
    
    classReducers() {
        return {
            ...super.classReducers(),
            status: this.reduceStatus
        }
    }
    
    reduceData(state, action) {
        switch(action.type) {
            case 'INCREMENT':
                return state + 1
            case 'DECREMENT':
                return state - 1
            default:
                return super.reduceData(state, action);
        }    
    }
    
    reduceStatus(state = 'EVEN', action) {
        switch(action.type) {
            case 'BECAME_EVEN':
                return 'EVEN';
            case 'BECAME_ODD':
                return 'ODD';
            default:
                return state;
        }
    }
}
```

#### Accessing reduced data

The value exposed in our data store is an instance of the 
```DataComponent```-derived class.  Class reducer values are exposed as 
properties of the object.  In the example above, a React view component
might use ```this.props.my_component.status``` to get at the status value.

Lifecycle methods will likewise access ```this.status``` (and/or 
```[previous|next].status``` in the case of ```component[Did|Will]Update```).
This is the basis for building more complex behaviors driven by store events.

> **NOTE:** It may have occurred to you by now that it seems possible to
> access property values and other data component attributes from inside 
> reducers.  It may have further occurred to you that this is a really bad idea,
> enabling reducers with side effects and non-parameter dependencies.  
> 
> In order to discourage such awfulness, reducer methods are not bound to the
> component instance, but to a more restricted ```ReducerContext``` object that
> provides the features that are kosher to access from a reducer.  In general, 
> this means that methods may be called (including super calls), but neither 
> dispatch nor reduced instance data are available, and attempts to modify 
> ```this``` during a reduce will throw an exception.

#### Add lifecycle methods

Data Components support the following lifecycle methods:
- ```componentDidMount()```

  Called on store initialization.
  
- ```componentWillUpdate(newInstance, updateReason)```

   Called on old data component instance before an action results in a
   change somewhere in the component.  The ```updateReason``` parameter
   can take one of three values: UPDATE, REHYDRATE or RESET.
   
- ```componentDidUpdate(oldInstance, updateReason)```

   Called on new data component instance after an action results in a
   change somewhere in the component.  The ```updateReason``` parameter
   can take one of three values: UPDATE, REHYDRATE or RESET.
   
- ```componentWillRehydrate()```

   Called on old data component instance before a redux-persist REHYDRATE
   action restores its contents.  Convenience method equivalent to defining
   componentWillUpdate and filtering for ```updateReason === 'REHYDRATE'```.

- ```componentDidRehydrate()```

   Called on new data component instance after a redux-persist REHYDRATE
   action restores its contents.  Convenience method equivalent to defining
   componentDidUpdate and filtering for ```updateReason === 'REHYDRATE'```.

- ```componentWillReset()```

   Called on old data component instance before a data component RESET
   action restores its contents to the default initial state.  Convenience 
   method equivalent to defining componentWillUpdate and filtering for 
   ```updateReason === 'RESET'```.

- ```componentDidReset()```

   Called on new data component instance after a data component RESET
   action restores its contents to the default initial state.  Convenience 
   method equivalent to defining componentDidUpdate and filtering for 
   ```updateReason === 'RESET'```.

Lifecycle methods can be used to respond to changes in data.

```javascript
import { DataComponent, connect } from 'redux-data-components'
  
class MyComponent extends DataComponent {
    componentDidUpdate(oldInstance) {
        if(oldInstance.data != this.data) {
            if(this.data % 2 == 0) {
                this.props.dispatch({ type: 'BECAME_EVEN' })
            } else {
                this.props.dispatch({ type: 'BECAME_ODD' })
            }
        }
    }
  
    defaultState() { 
        return 0;
    }
    
    classReducers() {
        return {
            ...super.classReducers(),
            status: this.reduceStatus
        }
    }
    
    reduceData(state, action) {
        switch(action.type) {
            case 'INCREMENT':
                return state + 1
            case 'DECREMENT':
                return state - 1
            default:
                return super.reduceData(state, action);
        }    
    }
    
    reduceStatus(state = 'EVEN', action) {
        switch(action.type) {
            case 'BECAME_EVEN':
                return 'EVEN';
            case 'BECAME_ODD':
                return 'ODD';
            default:
                return state;
        }
    }
}
```

#### Define actions

We can create methods on the data component class to act as action generators
for the convenience of consumers.

```javascript
import { DataComponent, connect } from 'redux-data-components'
  
class MyComponent extends DataComponent {
    componentDidUpdate(oldInstance) {
        if(oldInstance.data != this.data) {
            if(this.data % 2 == 0) {
                this.becomeEven()
            } else {
                this.becomeOdd()
            }
        }
    }
  
    defaultState() { 
        return 0;
    }
    
    classReducers() {
        return {
            ...super.classReducers(),
            status: this.reduceStatus
        }
    }
    
    reduceData(state, action) {
        switch(action.type) {
            case 'INCREMENT':
                return state + 1
            case 'DECREMENT':
                return state - 1
            default:
                return super.reduceData(state, action);
        }    
    }
    
    reduceStatus(state = 'EVEN', action) {
        switch(action.type) {
            case 'BECAME_EVEN':
                return 'EVEN';
            case 'BECAME_ODD':
                return 'ODD';
            default:
                return state;
        }
    }
    
    increment() {
        this.props.dispatch({ type: 'INCREMENT' });
    }
    
    decrement() {
        this.props.dispatch({ type: 'DECREMENT' });
    }
 
    becomeEven() {
        this.props.dispatch({ type: 'BECAME_EVEN' });
    }
  
    becomeOdd() {
        this.props.dispatch({ type: 'BECAME_ODD' });
    }
}
```

The base ```DataComponent``` class provides one built-in action method, 
```reset```.  This dispatches the data component RESET action, which causes the
component to be re-initialized to completely default state, just as it is on 
page load.  Note that in this instance ```componentDidMount``` will not be called
again, so any initialization in that method should be moved to a separate method
that is also called from ```componentDidReset```.

#### Scope actions to specific components

The ```DataComponent``` class defines a ```componentIdentifier``` method.  This
returns a string identifying a component.  By default it returns the classname
of the component.  For this reason, any instance of ```MyComponent``` by default
be linked to every other via this identifier.  

Actions are targeted to a particular component by adding 
```component: <identifier>``` to the action.  Use the ```isTargetFor``` method
as a convenient way to test an action against the current component.

```javascript
import { DataComponent, connect } from 'redux-data-components'
  
class MyComponent extends DataComponent {
    componentDidUpdate(oldInstance) {
        if(oldInstance.data != this.data) {
            if(this.data % 2 == 0) {
                this.becomeEven()
            } else {
                this.becomeOdd()
            }
        }
    }
  
    defaultState() { 
        return 0;
    }
    
    classReducers() {
        return {
            ...super.classReducers(),
            status: this.reduceStatus
        }
    }
    
    reduceData(state, action) {
        switch(action.type) {
            case 'INCREMENT':
                return this.isTargetFor(action) ? state + 1 : state;
            case 'DECREMENT':
                return this.isTargetFor(action) ? state - 1 : state;
            default:
                return super.reduceData(state, action);
        }    
    }
    
    reduceStatus(state = 'EVEN', action) {
        switch(action.type) {
            case 'BECAME_EVEN':
                return this.isTargetFor(action) ? 'EVEN' : state;
            case 'BECAME_ODD':
                return this.isTargetFor(action) ? 'ODD' : state;
            default:
                return state;
        }
    }
    
    increment() {
        this.props.dispatch({
            type: 'INCREMENT',
            component: this.componentIdentifier()             
        });
    }
    
    decrement() {
        this.props.dispatch({
            type: 'DECREMENT',
            component: this.componentIdentifier()             
        });
    }
 
    becomeEven() {
        this.props.dispatch({ 
            type: 'BECAME_EVEN', 
            component: this.componentIdentifier() 
        });
    }
  
    becomeOdd() {
        this.props.dispatch({ 
            type: 'BECAME_ODD', 
            component: this.componentIdentifier() 
        });
    }
}
```
The result of this is that every instance of MyComponent will respond to the
same actions, so they will always have the same value.  We can, of course, 
provide an overridden ```componentIdentifier``` method to provide a string 
that segregates instances as we see fit.  Alternately, supplying an ```id```
in the class options when instantiating the component (see below) will change 
the instance's componentIdentifier, separating it from other components.

### Adding Components to the Redux Store

You could, in principle, use a DataComponent as your root reducer.
Alternately, you can use them in combineReducers as you would ordinary
reducers:

```javascript
import { combineReducers } from 'redux'
import ordinaryReducer from '../reducers/ordinaryReducer'
import MyComponent from '../data_components/MyComponent'

export default combineReducers({
    ordinary: ordinaryReducer,
    my_component: MyComponent
});
```
You may mix and match ordinary reducers and data components as you like.  To
Redux, the data component just looks like a normal reducer function.

#### Linked components and data sharing

You can put multiple instances of MyComponent in the same tree:

```javascript
import { combineReducers } from 'redux'
import ordinaryReducer from '../reducers/ordinaryReducer'
import MyComponent from '../data_components/MyComponent'

export default combineReducers({
    ordinary: ordinaryReducer,
    my_component_1: MyComponent,
    my_component_2: MyComponent
});
```

In this example, because my_component_1 and my_component_2 share the same
(default) componentIdentifier, they are linked to one another.  Actions targeted to
one of them will affect both due to their shared identity.

#### Class options and unlinking components

It is possible to override the default linking behavior by providing unique ids 
as "class options," a set of options supplied when declaring the data component.
These are a freeform options object (pass whatever you like) and interpretation 
of specific options is up to the individual class.  The ```id``` option is used 
by the base ```DataComponent``` class to override the default componentIdentifier:

```javascript
export default combineReducers({
    ordinary: ordinaryReducer,
    my_component_1: MyComponent({ id: 'INSTANCE_A' }),
    my_component_2: MyComponent({ id: 'INSTANCE_B' })
});
```

The my_component_1 and my_component_2 items are now unlinked and operate
independently.  You can explicitly link instances by providing the same id:

```javascript
export default combineReducers({
    ordinary: ordinaryReducer,
    my_component_1: MyComponent({ id: 'INSTANCE_A' }),
    my_component_2: MyComponent({ id: 'INSTANCE_B' }),
    my_component_3: MyComponent({ id: 'INSTANCE_B' })
});
```

The second and third instances are now linked, while the first is independent.  

Using explicit identifiers is useful if you create a general data component class 
that can be entirely configured using class options, although in that case it might 
be a good idea to override the componentIdentifier method itself to generate an 
appropriately unique component id automatically.

### Aggregating components

Lifecycle methods for components have full access to the current state of all class
reducers, which can be used to trigger actions.  Combined with component linking, this
provides a powerful way to express common dependencies in unrelated components.

```javascript
class CommonDataDependency extends AsyncFetchComponent {
    fetch() {
        return /*...get my common data here...*/;   
    }
}
 
class ComponentOne extends DataComponent {
    classReducers() {
        return {
            ...super.classReducers(),            
            common: CommonDataDependency
        }
    }
    
    componentDidMount() {
        this.common.request();
    }   
}
 
class ComponentTwo extends DataComponent {
    classReducers() {
        return {
            ...super.classReducers(),
            common: CommonDataDependency
        }
    }
    
    componentDidMount() {
        this.common.request();
    }       
}
 
const rootReducer = combineReducers({
    component_1: ComponentOne,
    component_2: ComponentTwo
})
```

In this example, the fetch method for ```CommonDataDependency``` will be called
exactly once, and the result will be applied to both instances.  The
```componentDidMount``` method for ```ComponentOne``` will kick off a request for
the data, but when ```ComponentTwo``` mounts, and also requests the data, the
shared-by-default nature of data components means the action will not trigger a
second load.  The component knows the data is already loading due to an earlier
action, and both ```ComponentOne``` and ```ComponentTwo``` can use the
```componentWillUpdate``` lifecycle method to detect when the common data has
changed and react appropriately.

### Persistence Support

Data Components have built-in support for persistence via redux-persist in various
ways.  The ```componentWillRehydrate``` lifecycle method, and 'REHYDRATE' reason for
```componentWillUpdate``` are obvious examples.

Less obvious is the behind-the-scenes support that restores data component instances
to their correct class identities after a rehydrate (redux-persist only stores raw
objects).  

Additionally, every data component has an ```updated_at``` timestamp, in
millisecond epoch time, that is updated every time a new component instance is
created in response to a data change, except in the case of a rehydrate (which
just restores the prior timestamp from storage in the expected way).  This timestamp
can be used to track the freshness of persisted data.

Finally, the ```ReducerContext``` object (which stands in for the data component
when reducing) provides a ```rehydrateItem``` helper method, to be used in responding
to a rehydrate action.  The reducer context already tracks an instance's path in the
redux store, so you can handle rehydration of subcomponents:

```javascript
import { REHYDRATE } from 'redux-persist/constants'
 
class MyComponent extends DataComponent {
    classReducers() {
        return { stuff: this.reduceStuff };
    }
     
    reduceStuff(state = 'some default stuff', action) {
        switch(action.type) {
            case REHYDRATE:
                return this.rehydrateItem(action.payload, 'stuff');
            default:
                return state;        
        }
    }
}
```

The default ```data``` reducer does this automatically, as do built-in reducers
in ```AsyncFetchComponent```.  Reducers you add from scratch should handle this
themselves if you need persistence support.