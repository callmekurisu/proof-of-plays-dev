import React from 'react';
import PopClient from '../../Axios/PopClient';
import PayClient from '../../Axios/PayClient';
import PlayerComponent from './Player.component';
import PlayIcon from '@material-ui/icons/PlayCircleFilledRounded';
import { InputGroup, InputGroupAddon, Input } from 'reactstrap';
import Invoice from './Invoice';
import SnackBarComponent from '../notifications/SnackBar.component';
import LightningIcon from '@material-ui/icons/OfflineBolt';
import LockIcon from '@material-ui/icons/Lock';
import { requestProvider } from 'webln';
/*
This component will grab all meta data and pass as props to the media player
*/
export class Home extends React.Component {
 constructor(props){
   super(props);
   this.state = {
     meta: [],
     paid: false,
     invoice: '',
     songId: '',
     hash: '',
     openInvoice: false,
     passcode: '',
     paymentRequest: '',
     error: 'Could not generate invoice',
     snackbar: false,
     message: '',
     playing: false
   }
 }
  // Load metadata
  componentDidMount(){
    // Fetch metadata
    PopClient.get('/api/meta/home/popular')
      .then((response) => {
        this.setState({
          ...this.state,
          meta: response.data
        })
    })
  }
  // LND invoice generation and payment
  generateInvoice = (songId) => {
    if(this.state.playing === false){
    PayClient.get(`invoice/pop-popular/1000`)
      .then((response) => {
        this.setState({
          ...this.state,
          invoice: response.data.invoice,
          hash: response.data.hash,
          openInvoice: true
        })
      }).catch(err => {
          console.log(this.state.error);
        })
      setTimeout(()=>{
        PayClient.get(`listen/${this.state.invoice}`)
          .then((response) => {
            if(response.status === 200) {
              this.setState({
                ...this.state,
                paid: true,
                openInvoice: false,
                songId: songId
            })
            // Success! Send off songId to increase plays/payouts
            PopClient.post(`/api/meta/popular/increase/${songId}`)
            PopClient.post(`/api/meta/plays/${songId}`)
          } else {
          this.setState({
            ...this.state,
            paid: false,
            openInvoice: false
          })
        }
      }).catch(err => {
          console.log(this.state.error);
          })
        }, 5000)
      } else {
        window.location.reload();
        }
      };

  //Close button on paywall
  handlePayClose = () => {
    this.setState({ openInvoice: false });
  };
  // Get passode from media player input
  getPasscode = (e) => {
    this.setState({
      ...this.state,
      passcode: e.target.value
    })
  }
  // Get lightning network payment request from media player input
  getPaymentRequest = (e) => {
    this.setState({
      ...this.state,
      paymentRequest: e.target.value
    })
  }
  // Send payment for associated track
  sendPayment = (songId) => {
    const data = {
      passcode: this.state.passcode,
      pr: this.state.paymentRequest
    }

    PopClient.post(`/api/meta/payout/${songId}`, data)
      .then(res => {
        if (res.status === 200) {
          this.setState({
            snackbar: true,
            message: 'Payout successful (^_^)'
          })
        }
      })
      .catch(() => {
        this.setState({
          snackbar: true,
          message: 'Payout unsuccessful (T_T)'
        })
      })
  }

  // Close the snackbar
  handleClose = () => {
    this.setState({
      snackbar: false
    })
  }
// try and use Joule
weblnPay = async () => {
  this.setState({
    isLoading: true,
    payment: null,
    error: null,
  });
  try {
    const webln = await requestProvider();
    const weblnPay = await webln.sendPayment(this.state.invoice);
    this.setState({ weblnPay });
  } catch(error) {
    this.setState({ error });
  }
  this.setState({ isLoading: false });
};
  render() {
    return (
    <>
    <div className="container-fluid player col col-sm-6 col-md-6 col-lg-3">
    {/* Map all audio metadata from db to individual media players */}
      {
        this.state.meta.map(info =>
          <PlayerComponent
            key={info._id}
            title={info.title}
            artist={info.artist}
            pubkey={info.pubkey}
            plays={info.plays}
            date={info.date}
            explicit={info.explicit}
            balance={info.balance}
            songId={info._id}
            // only set audio for paid song
            audio={info._id === this.state.songId ? info.audio : ''}
            paid={this.state.paid}
            playIcon={<PlayIcon/>}
            generateInvoice={()=>
              // Generate LND invoice and pass song id for processing
              this.generateInvoice(info._id)}
            lndInvoice={
              <Invoice
                invoice={this.state.invoice}
                open={this.state.openInvoice}
                amount={1000}
                close={this.handlePayClose}
                songId={info._id}
                webln={this.weblnPay}
                />}
            paymentRequest={
              <InputGroup>
                <InputGroupAddon addonType="prepend" ><LightningIcon/></InputGroupAddon>
                <Input placeholder="payment request"
                onChange={this.getPaymentRequest}/>
              </InputGroup>
            }
            passcode={
              <InputGroup>
                <InputGroupAddon addonType="prepend" ><LockIcon/></InputGroupAddon>
                <Input type="password" placeholder="passcode"
                onChange={this.getPasscode}/>
              </InputGroup>
            }
            getPaid = {
              <button className='btn btn-primary'
              onClick={()=>
                // Send info to servers for processing
                this.sendPayment(info._id)}>
              Get Paid
              </button>
            }
          />
            )
          }
      </div>
      {/* Inject snackbar */}
     <SnackBarComponent
       open={this.state.snackbar}
       handleClose={this.handleClose}
       message={this.state.message}/>
    </>
    )
  }
}

export default Home;
