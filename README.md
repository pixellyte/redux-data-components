# Redux Data Components
Redux Data Components are React-like components that exist entirely
within the Redux store.  The components support lifecycle methods so that
data events within the store can trigger subsequent actions without running
afoul of the "don't dispatch while reducing" rule.

## MIGRATION NOTE:
Version 0.5 introduces minor breaking changes relative to earlier releases.  Before
updating, please review MIGRATION.md to understand the consequences of an upgrade.

## Why Data Components?
Redux provides a tidy way of managing application state one discrete action 
at a time, in a way that's easy to reason about, but omits a clean model abstraction
in ways that encourage poor separation of concerns.  Put into "MVC" terms, React is
your View, Redux and its associated reducers are your Controller, but for anything
you'd recognize as a Model, you're on your own. 

Most nontrivial React/Redux applications will mix application logic into view 
components, reduce data redundantly to extract different aspects of the same 
response, and implement their own asynchronous behaviors via Promises or async/await 
that run parallel to the more obvious and maintainable serial message-pump model 
provided by Redux.  The code you might otherwise aggregate into a model class ends up
scattered across multiple files in ways idiosyncratic to each project, making them 
harder to maintain and increasing ramp-up time for new developers.

Redux Data Components encourage creation of discrete object-oriented data model 
components that live in the Redux store, allowing for inheritance, composition
and relevant methods so that operations on data live alongside the data itself.
Data components also expose React-like lifecycle methods, and can dispatch actions
from within these methods in response to data events, without using the lifecycle
methods of your view components to mediate them.  With data components you can
implement the logic of your application entirely separately from the view, and then
treat the model layer as an API your view layer (or even multiple independent view
layers) can consume.

This module also provides AsyncFetchComponent, a pre-made data component that
automatically manages the state of an asynchronous fetch request, making robust
remote data handling as trivial as implementing a single fetch method.

A particular focus of Redux Data Components is efficient compatibility with
[redux-persist](https://github.com/rt2zz/redux-persist) for maintaining local
state between page loads.  The module does not depend on redux-persist directly,
and is agnostic to v4/v5 distinctions, though you might need to vary your approach
to implementing component lifecycle methods depending on which version you use. 

Finally, Redux Data Components allow for data sharing between multiple instances of
the same component in your Redux tree.  So if your app aggregates multiple independent
views that each depend on some of the same data, you can freely add the shared data
component to reducers for each view, and the first one to load the shared data
automatically makes it available to all other consumers.  This adds flexibility to
build self-contained and reusable components of application functionality that
nevertheless depend on shared data models that quietly cooperate amongst themselves
behind the scenes.   
 
## Usage

### Installing

Install using npm:

```
npm i redux-data-components
```

### Enabling the component store

*Prior to version 0.5, Redux Data Components required the use of middleware to
enable lifecycle methods.  The middleware is no longer supported and should be
removed from your legacy projects when upgrading.*

Data components are stored in a specialized auxiliary data store.  Create this store
and wire it to your own main redux store by calling the `enableComponentStore` method: 

```javascript
import rootReducer from './rootReducer';
import middleware from './middleware';
import { enableComponentStore } from 'redux-data-components'

const enhancers = applyMiddleware(middleware);
const store = createStore(rootReducer,{},enhancers);
enableComponentStore(store);
```

You may also apply middleware to the component store by passing one or more
middleware functions as additional arguments to `enableComponentStore`.

### Defining Components

#### Deriving a component

Derive your component class from BaseDataComponent (or a descendant class).

```javascript
import { BaseDataComponent } from 'redux-data-components'

class MyComponent extends BaseDataComponent {
}
```

#### Connecting the component

A data component must be "connected" to participate in the Redux store.  This defines
a reducer-wrapper function that manages the proxy reference that represents your
component in the main store.

```javascript
import { BaseDataComponent, connect } from 'redux-data-components'

class MyComponent extends BaseDataComponent {
}

export default connect("MyComponent", MyComponent);
```

The first argument is a default component identifier.  Originally this was inferred
from the class name, but minification could mangle these identifiers in application-breaking ways.
Old syntax is still accepted with a warning.

The `BaseDataComponent` class provides support for internal reducers, but provides
none of its own.  To extend the behavior of the component, there are a number of 
approaches available:

#### Option: Decorated reducer methods
If your project is configured with support for decorators, you may annotate a 
reducer method to register it.

```javascript
import { BaseDataComponent } from 'redux-data-components';
import { Reducer } from 'redux-data-components/lib/decorators';


class MyComponent extends BaseDataComponent {
    @Reducer('mydata')
    reduceMyData(state = 'DEFAULT', action) {
        //...
    }
}
```  

This will result in a "mydata" property on the data component instance.

#### Option: Completely replace the reducers

The set of reducers for the class is returned by the ```classReducers``` method.
You may implement this method to define the reducers for a class.  Note that
support for decorator-based reducers is built into BaseDataComponent's
implementation of this method.  Be sure to call `super.classReducers` as shown
below if you want to maintain this behavior.

Calling `super` is also used to aggregate reducers in a derived class, all
reducers defined in the superclass will be available in the descendant.

```javascript
import { BaseDataComponent, connect } from 'redux-data-components'

class MyComponent extends BaseDataComponent {
    classReducers() {
        return {
            ...super.classReducers(),
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

export default connect("MyComponent", MyComponent);
```

#### Option: Use the default data reducer

The most trivial BaseDataComponent descendant, `DataComponent` defines one reducer,
`data`, that by default does nothing but return `null`.
You may customize this behavior by implementing appropriate methods:

```javascript
import { DataComponent, connect } from 'redux-data-components';

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

export default connect("MyComponent", MyComponent);
```

Notice that ```reduceData``` is an inherited method we are overriding.  This means that, for
a reducer method defined as a class member, we can augment an existing reducer in a parent
class with new action handlers (or replacements for existing ones) by using ```super``` in 
the default case as seen above.

#### Accessing reduced data

The value exposed in our data store is an instance of the 
```DataComponent```-derived class.  Class reducer values are exposed as 
properties of the object.  In the example above, a React view component
might use ```this.props.my_component.data``` to get at the data value.

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

export default connect("MyComponent", MyComponent);
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

export default connect("MyComponent", MyComponent);
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

export default connect("MyComponent", MyComponent);
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
(default) componentIdentifier, they are linked to one another.  That is, the 
references in your store point to the same actual instance behind the scenes.
Actions targeted to one of them will affect both due to their shared identity.

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

As of v0.5, the actual data components are stored in a separate,
internally-maintained store, while the items in the main Redux store, 
as well as any nested component references in other components, are Proxy-based
references to the real components.  This allows tighter control of the 
persistence.  To enable persistence, you will add an instance of the 
`dataComponentReflector` reducer somewhere in your Redux tree.  The reflector 
will expose the data elements of your components in a serializable form and 
handle reconstituting the components in the component store when the reflector 
is rehydrated.

The dataComponentReflector can be configured to support both auto-rehydrated
and manually rehydrated configurations, and is entirely agnostic to the version
of redux-persist being used.

The configuration object recognizes the following options:

- **auto**: *(Boolean, default true)* Indicates whether the redux-persist
  implementation is configured for automatic rehydration.
- **key**: *(String, default 'root')* Provides the key for the persistence
  store in which the dataComponentReflector is mounted.  Ignored if **auto**
  is *true*.
- **path**: *(String or Array of String, default [])*  Indicates the path to
  the dataComponentReflector in the payload when rehydrating.  Defaults to 
  the root of the payload.  The path argument can be an array of key names or
  a slash ('/') separated string.  Ignored if **auto** is *true*.
  
In the overly elaborate example below, auto-rehydrate is presumed disabled.  
The `key` and `path` options allow the reflector reducer to locate its own data 
in the REHYDRATE payload.

```javascript
//rootReducer.js
import { combineReducers } from 'redux';
import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import { dataComponentReflector } from 'redux-data-components';
import MyComponent from './MyComponent';
import someReducer from './someReducer';


const persistConfig = {
    key: 'myPersistStore',
    storage
}

export default persistCombineReducers(persistConfig, {
    my_component: MyComponent,
    nested: combineReducers({
        someReducer,
        reflector: dataComponentReflector({
            auto: false,
            key: 'myPeristStore',
            path: ['nested', 'reflector']
        })
    })
})
```

Additionally, every data component has an ```updated_at``` timestamp, in
millisecond epoch time, that is updated every time a new component instance is
created in response to a data change, except in the case of a rehydrate (which
just restores the prior timestamp from storage in the expected way).  This timestamp
can be used to track the freshness of persisted data.

### Debugging Data Components

When debugging, you will notice that what appears in your store are
anonymous Proxy objects instead of the actual components.  These are bound to empty
objects ({}) instead of the target to prevent serialization via the (possibly
duplicated) proxies.  But the Proxy's get method forwards all calls to the correct
object, so the Proxy works as expected in place of the actual component.

Programmatically, `(Proxy).targetComponent` will return the actual component, though this
should practically never be necessary.  In the debugger, expand the Proxy's "Handler"
(*not* its "Target"), and note that the "target" member of the handler points to the
actual component instance.  This exists only for purposes of browsing in the debugger.