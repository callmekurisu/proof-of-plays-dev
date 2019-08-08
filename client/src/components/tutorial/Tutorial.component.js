import React from 'react';
import Video from '../../Assets/pop.mp4';

class Tutorial extends React.Component {

/*
This component contains a native HTML5 video with site tutorial
*/
 render() { 
   return (
    <video className= "tutorial container-fluid player col col-sm-6 col-md-6 col-lg-6" controls>
      <source src={Video} type="video/mp4"/>
      Your browser does not support the video tag.
     </video>
   );
  }
}

export default Tutorial;