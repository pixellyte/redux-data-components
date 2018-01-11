import React, { Component } from 'react';
import { connect } from 'react-redux';

class Sidebar extends Component {
    render() {
        return (
            <div className="sidebar">
                <div className="title">LOADING ELEMENTS</div>
                <ul>
                    {Object.keys(this.props)
                        .filter(key => this.props[key].state === 'LOADING')
                        .map(key => <li>{key}</li>)}
                </ul>
            </div>
        )
    }
}

export default connect(store => store)(Sidebar);