import React, { Component } from 'react';
import { Button } from 'reactstrap';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import clipboardImg from '../../Assets/clipboard-512.png';
import SnackBarComponent from '../notifications/SnackBar.component';
import joule from '../../Assets/joule.png';
const QRCode = require('qrcode.react');

/*
This component contains the paywall to protect each song
*/

class Invoice extends Component {
  constructor(props){
    super(props);
      this.state = {
        value: '',
        copied: false,
        snackbar: false,
        message: '',
        payment: '',
        error: '',
        isLoading: ''
      }
  }

  handleCopy = () => {
    this.setState({
      ...this.state,
      copied: true,
      snackbar: true,
      message: "Payment request copied successfully"
    });
    setTimeout(() => {
      this.setState({
        ...this.state,
        snackbar: false
      })
    }, 3000)
  }
render() {
  return(
    <div>
      {this.props.getSongId}
    <Dialog className="invoice"
      open={this.props.open}
      onClose={this.props.close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle className="invoice" id="alert-dialog-title">
        PoP Invoice
      </DialogTitle>
      <DialogContent>
      <DialogContentText className="invoice">
        Song ID #: {this.props.songId}
     </DialogContentText>
     <DialogContentText className="invoice">
         Amount: {this.props.amount} satoshi
        </DialogContentText>
        <br/>
      <QRCode className="invoice" value={this.props.invoice} />
      <br/>
      <p className="invoice">
        Payment Request: {this.props.invoice}
        <CopyToClipboard text={this.props.invoice}
          onCopy={this.handleCopy}>
          <button>
              <img className="clipboard" src={clipboardImg} alt="copy"/>
          </button>
        </CopyToClipboard>
        <img className="joule" src={joule} alt="Joule link" onClick={this.props.webln}/>
      </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={this.props.close} color="primary">
            Close
        </Button>
      </DialogActions>
    </Dialog>
    {/* Inject snackbar */}
    <SnackBarComponent
      open={this.state.snackbar}
      handleClose={this.handleClose}
      message={this.state.message}/>
  </div>
    );
  };
}

export default Invoice
