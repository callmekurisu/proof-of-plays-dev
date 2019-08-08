import React from "react";
import UploadIcon from "@material-ui/icons/CloudUpload";
import PopClient from "../../Axios/PopClient";
import SnackBarComponent from "../notifications/SnackBar.component";

/*
This component contains the form for uploading new audio and associated metadata
*/

class Upload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lyrics: "",
      title: "",
      artist: "",
      passcode: "",
      audio: "",
      autopay: "",
      macaroon: "",
      selection: "Waiting...",
      snackbar: false,
      message: ""
    };
  }
  // Get title
  titleChange = e => {
    this.setState({
      ...this.state,
      title: e.target.value
    });
  };
  // Get artist
  artistChange = e => {
    this.setState({
      ...this.state,
      artist: e.target.value
    });
  };
  // Get passcode
  passcodeChange = e => {
    this.setState({
      ...this.state,
      passcode: e.target.value
    });
  };
  // Get lyrics
  explicit = () => {
    this.setState({
      lyrics: "Explicit"
    });
  };
  // Get autopay URL
  autopayChange = e => {
    this.setState({
      autopay: e.target.value
    });
  };

  // Get macaroon
  macaroonChange = e => {
    this.setState({
      macaroon: e.target.value
    });
  };

  clean = () => {
    this.setState({
      lyrics: "Clean"
    });
  };

  // Handle audio upload
  uploadButton = e => {
    //build form data
    const formData = new FormData();
    const file = this.fileUpload.files[0];
    formData.append("track", file);
    formData.append("name", "name");

    PopClient.post("/api/audio", formData)
      .then(res => {
        if (res.status === 201) {
          this.setState({
            ...this.state,
            selection: "File staged for processing."
          });
        }
        this.setState({
          audio: res.data.id
        });
      })
      .catch(err => {
        //Set snackbar message to error
        this.setState({
          ...this.state,
          snackbar: true,
          message: "Upload unsuccessful (T_T)"
        });
      });
  };

  //Ok!! lets send the metadata to the server now!!

  submit = e => {
    e.preventDefault();
    //don't mutate state!!!
    let info = Object.assign({}, this.state);
    info.explicit = this.state.lyrics === "Explicit" ? true : false;
    //show processing message to calm the user
    this.setState({
      ...this.state,
      selection: "Processing..."
    });
    //don't need selection
    delete info.selection;
    PopClient.post("/api/meta", info)
      .then(res => {
        if (res.status === 200) {
          this.setState({
            snackbar: true,
            message: "Upload successful (^_^)"
          });
        }
      })
      .catch(err => {
        //Set snackbar message to error
        this.setState({
          ...this.state,
          snackbar: true,
          message: "Upload unsuccessful (T_T)"
        });
      });
    window.setTimeout(() => {
      //just waiting for the server
      window.location.assign("/ui/archive");
    }, 6000);
  };

  // Close the snackbar
  handleClose = () => {
    this.setState({
      snackbar: false
    });
  };
  render() {
    return (
      <>
        <form className="upload-form">
          <div className="form-row">
            <div className="col-md-4 mb-3">
              <label labelfor="validationDefault01">Title*</label>
              <input
                type="text"
                className="form-control"
                id="validationDefault01"
                placeholder="Song Title"
                onChange={this.titleChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="col-md-4 mb-3">
              <label labelfor="validationDefaultArtist">Artist*</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroupPrepend2">
                    @
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  id="validationDefaultArtist"
                  placeholder="Artist"
                  aria-describedby="inputGroupPrepend2"
                  onChange={this.artistChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="col-md-4 mb-3">
              <label labelfor="validationDefaultAutopay">
                Auto Pay URL
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://api.lightning.community/rest/index.html?shell#v1-invoices"
                >
                  {" "}
                  learn more
                </a>
              </label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroupPrepend2">
                    https://
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  id="validationDefaultUsername"
                  placeholder="https://YOURIP:8080/v1/invoices"
                  aria-describedby="inputGroupPrepend2"
                  onChange={this.autopayChange}
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="col-md-4 mb-3">
              <label labelfor="validationDefaultMacaroon">
                Invoice macaroon
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://api.lightning.community/rest/index.html?shell#v1-invoices"
                >
                  {" "}
                  learn more
                </a>
              </label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroupPrepend2">
                    hex string
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  id="validationDefaultMacaroon"
                  placeholder="948afjofi02829..."
                  aria-describedby="inputGroupPrepend2"
                  onChange={this.macaroonChange}
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="col-md-4 mb-3">
              <label labelfor="validationDefault03">Passcode*</label>
              <input
                type="password"
                className="form-control"
                id="validationDefault03"
                placeholder="Alphanumeric passcode for payouts"
                onChange={this.passcodeChange}
                required
              />
            </div>
          </div>
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Explicit Lyrics?*
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <p onClick={this.explicit}> Explicit </p>
              <p onClick={this.clean}> Clean </p>
            </div>
          </div>
          <br />
          <p>Lyrics: {this.state.lyrics} </p>
          <br />
          <h4>Audio upload: {this.state.selection}</h4>
          {this.state.selection !== "File staged for processing." &&
            this.state.selection !== "Processing..." && (
              <div className="form-group" id="uploading">
                {/* audio upload handling */}
                <input
                  type="file"
                  name="PoP"
                  encType="multipart/form-data"
                  ref={ref => (this.fileUpload = ref)}
                />
                {/* un-render button after submission
    to prevent spamming audio hosting service */}
                <span>
                  <UploadIcon onClick={this.uploadButton} />
                </span>
                <p>mp3 support only!</p>
              </div>
            )}
          <br />
          <br />
          {/* logic to prevent blank form submission */}
          {this.state.title !== "" &&
            this.state.artist !== "" &&
            this.state.selection === "File staged for processing." &&
            this.state.passcode !== "" &&
            this.state.lyrics !== "" &&
            this.state.audio !== "" && (
              <button
                className="btn btn-primary"
                type="submit"
                onClick={this.submit}
              >
                Submit
              </button>
            )}
        </form>
        {/* Inject snackbar for successful upload */}
        <SnackBarComponent
          open={this.state.snackbar}
          handleClose={this.handleClose}
          message={this.state.message}
        />
      </>
    );
  }
}

export default Upload;
