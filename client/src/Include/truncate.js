export const truncate = (str) => {
    let result = '';
    str.length > 10 ? 
      result = str.substring(0,10).concat("...") : 
      result = str;
    return result; 
  }

export default truncate;