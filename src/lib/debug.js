module.exports = function debug() {
  if (process.env.NODE_ENV !== 'production') {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }
};
