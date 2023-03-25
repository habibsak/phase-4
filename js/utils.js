Array.prototype.shuffle = function () {
  this.forEach(function (item, index, arr) {
    let other = Math.floor(Math.random() * arr.length);
    [arr[other], arr[index]] = [arr[index], arr[other]];
  });
  return this;
};

// Example usage
// let myArr = ['Mulder', 'Scully', 'Skinner'];
// myArr.shuffle();
// now myArr is shuffled.
