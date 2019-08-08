import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Identicon from 'react-identicons';
import moment from 'moment';
import SimpleToolTip from './PlayTip';
import truncate from '../../Include/truncate'

/*
This component is a custom media card for each song.
*/

const styles = theme => ({
  card: {
    display: 'flex',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: '1 0 auto',
  },
  cover: {
    width: 151,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  playIcon: {
    height: 38,
    width: 38,
  },
});

function MediaControlCard(props) {
  const { classes } = props;
  const audio = `http://proofofplays.hopto.org:7777/api/audio/${props.audio}`
  return (
    <div className="player">
    <Card className={classes.card}>
      <div className={classes.details}>
        <CardContent className={classes.content}>
            <div className="title">
              <span className="identicon">
                <Identicon className={classes.controls}
                string={props.artist} size={40}/>
              </span>
              <SimpleToolTip
                data={truncate(props.title)}
                message={props.title}/>
              <div onClick={props.generateInvoice}>
                  <SimpleToolTip
                  data={props.playIcon}
                  message="Pay to play"/>
             </div>
	  </div>
            {props.paid === true &&
            <audio className="media" controls controlsList="nodownload">
              <source src={audio}
              type="audio/mpeg"/>
             Your browser does not support the audio element.
          </audio>
          }
            <hr/>
            <Typography variant="subtitle1" color="textSecondary">
            {props.explicit === true ? "Explicit" : "Clean"}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
          Added {moment(props.date).format('lll')}
          </Typography>
            {props.lndInvoice}
          <Typography variant="subtitle1" color="textSecondary">
            Artist: {props.artist}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Song Id: {props.songId}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Balance: {props.balance} satoshis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Plays: {props.plays}
            <hr/>
          </Typography>
          {props.passcode}
          <br/>
          {props.paymentRequest}
          <br/>
          {props.getPaid}
        </CardContent>
        </div>
    </Card>
    </div>
  );
}

MediaControlCard.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(MediaControlCard);
