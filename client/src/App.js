import React, { Component } from 'react';
import './App.css';
import Navbar from './components/layout/Navbar';
import Home from './components/player/Home.component'
import Player from './components/player/Container';
import Upload from './components/upload/Upload'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './Include/bootstrap';
import Tutorial from './components/tutorial/Tutorial.component';
import NodeInfo from './components/node/Node.component';
class App extends Component {
  render() {
    return (
      <>
      <Navbar/>
      <Router>
        <Switch>
          {/* Switch route to the home page */}
          <Route path="/ui/home" component={Home} />
          {/* Switch route to the archive page */}
          <Route path="/ui/archive" component={Player} />
          {/* Switch route to the upload page */}
          <Route path="/ui/upload" component={Upload} />
          {/* Switch route to the tutorial page */}
          <Route path="/ui/how-it-works" component={Tutorial} />
          {/* Switch route to the node info page */}
          <Route path="/ui/node-info" component={NodeInfo} />
          {/* Default route to the home page */}
          <Route component={Player} />
        </Switch>
      </Router>
      </>
    );
  }
}

export default App;