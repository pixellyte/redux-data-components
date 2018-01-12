import React, { Component } from 'react';
import { connect } from 'react-redux';

class Panel extends Component {
    componentDidMount() {
        this.props.shared.request("because");
        this.props.own.request("why not");
    }

    isLoading() {
        const { shared, own } = this.props
        return (shared.state === 'LOADING' || own.state === 'LOADING'
            || shared.state === 'REQUESTED' || own.state === 'REQUESTED');
    }

    render() {
        const { shared, own } = this.props
        if(this.isLoading()) {
            return (
                <div className="panel">
                    <div className="content">...LOADING...</div>
                    <div className="controls">
                        <a onClick={() => shared.request()}>RELOAD SHARED VALUE</a>
                        <a onClick={() => own.request()}>RELOAD MY VALUE</a>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="panel">
                    <div className="content">{`${shared.data} + ${own.data} = ${shared.data + own.data}`}</div>
                    <div className="controls">
                        <a onClick={() => shared.request()}>RELOAD SHARED VALUE</a>
                        <a onClick={() => own.request()}>RELOAD MY VALUE</a>
                    </div>
                </div>
            );
        }
    }
}

function mapStateToProps(state, ownProps) {
    return { shared: state.shared, own: state[ownProps.instance] };
}

export default connect(mapStateToProps)(Panel);