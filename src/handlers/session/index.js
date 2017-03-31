module.exports = {

  ['session.connect']: (context, payload) => {
    console.log('Got session.connect event with data:', payload);
  }

};
