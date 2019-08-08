import React from 'react';
import PayClient from '../../Axios/PayClient';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import clipboardImg from '../../Assets/clipboard-512.png';
import SnackBarComponent from '../notifications/SnackBar.component';

/*
This component has all the payment server information
*/

class Node extends React.Component {
  constructor(props){
    super(props);

    this.state = {
     info: [],
     value: '',
     copied: false,
     snackbar: false,
     message: ''
    }
  }
  // Get node info from the payment server
  componentDidMount() {
    PayClient.get()
    .then((response) => {
      this.setState({
        info: response.data
      })
    });
  }
  // Copy the node URI
  handleCopy = () => {
    this.setState({
      ...this.state,
      copied: true,
      snackbar: true,
      message: "URI copied successfully"
    });
  }
  // Close the snackbar
  handleClose = () => {
   this.setState({
     snackbar: false
   })
  }
 render() {
     const pubkey = `${this.state.info.identity_pubkey}`
     const uri = `${this.state.info.uris}`
   return (
    <>
    <div className="node-info">
      <p><strong>Node URI: </strong></p>
    <div>
    <input value={uri === null ? pubkey : uri}
      onChange={({target: {value}}) => this.setState({value, copied: false})} />

    <CopyToClipboard text={uri}
      onCopy={this.handleCopy}>
      <button>
        <img className="clipboard" src={clipboardImg} alt="copy"/>
      </button>
    </CopyToClipboard>

    {/* Inject snackbar */}
    <SnackBarComponent
      open={this.state.snackbar}
      handleClose={this.handleClose}
      message={this.state.message}/>
    </div>
    <br/>
    <p>
      <strong>Active Channels: </strong>
      {this.state.info.num_active_channels}
    </p>
    <p>
      <strong>Pending Channels: </strong>
      {this.state.info.num_pending_channels}
    </p>
    <p>
      <strong>Peers: </strong>
      {this.state.info.num_peers}
    </p>
    <p>
      <strong>Block Height: </strong>
      {this.state.info.block_height}
    </p>
    <p>Super Beta. Use responsibly! Thanks for testing!</p>
    <p>Note: You may need to open a channel to receive payouts</p>
    <p>Please use the Node URI above</p>
    <p>
      <strong>Feature requests/bug reports, email
        <a href="mailto:callmekurisu@gmail.com?subject=Proof of Plays Feature/Bug Request"> callmekurisu@gmail.com</a>
      </strong></p>
      <p align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://tiphub.io/user/1186002563/tip?site=github">
    <img src="https://tiphub.io/static/images/tip-button-dark.png" alt="Tip callmekurisu on TipHub" height="60"/>
    <br />
    My pubkey starts with <code>028eab9c</code>
  </a>
</p>
  </div>
  </>
   );
  }
}

export default Node;
