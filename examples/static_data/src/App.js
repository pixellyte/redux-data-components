import React, { Component } from 'react';
import { connect } from 'react-redux';
import './App.css';
import Sidebar from "./view/Sidebar";
import Panel from "./view/Panel";

class App extends Component {
  render() {
    return (
      <div className="App">
          <Sidebar />
          <div className="content">
              <Panel instance="a" />
              <Panel instance="b" />
              <Panel instance="c" />
              <Panel instance="d" />
              <Panel instance="e" />
              <Panel instance="f" />
              <Panel instance="g" />
              <Panel instance="h" />
              <Panel instance="i" />
              <Panel instance="j" />
              <Panel instance="k" />
              <Panel instance="l" />
          </div>
      </div>
    );
  }
}

export default connect(store => store)(App);
