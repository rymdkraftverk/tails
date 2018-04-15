import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import LockerRoom from './LockerRoom'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {

  }

  render() {
    return (
      <div>
        <LockerRoom />
      </div>
    );
  }
}

export default App;
