function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
    key.onPress=null;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
        key.isPressed=true;
      key.isUp = false;
        if (key.onPress!=null) {
            key.onPress();
        }
        event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
        event.preventDefault();
    }
  };
    
    key.resetPress=function() {
        this.isPressed=false;
    }

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

function mouseClick(button) {
    var key = {};
    key.button=button;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
    key.onPress=null;
  //The `downHandler`
  key.downHandler = function(event) {
      if (event.which==key.button) {
          if (key.isUp && key.press) key.press();
      key.isDown = true;
        key.isPressed=true;
      key.isUp = false;
        if (key.onPress!=null) {
            key.onPress();
        }
          event.preventDefault();
      }
  };

  //The `upHandler`
  key.upHandler = function(event) {
      if(event.which==key.button) {
          if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
          event.preventDefault();
      }
  };
    
    key.resetPress=function() {
        this.isPressed=false;
    }

  //Attach event listeners
  window.addEventListener(
    "mousedown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "mouseup", key.upHandler.bind(key), false
  );
  return key;
}

function keyGroup(key1,key2) {
    var key={};
    key.one=keyboard(key1);
    key.two=keyboard(key2);
    key.isDown=function() {
        return (this.one.isDown||this.two.isDown);
    }
    key.isPressed=function() {
        return (this.one.isPressed||this.two.isPressed);
    }
    key.isUp=function() {
        return !this.isDown();
    }
    key.resetPress=function() {
        this.one.resetPress();
        this.two.resetPress();
    }
    return key;
}