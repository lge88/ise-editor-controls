
var THREE = require( 'three' );

module.exports = exports = EditorControls;
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

function EditorControls( object, domElement ) {

  if ( !(this instanceof EditorControls) ) { return new EditorControls( object, domElement ); }
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API

  this.enabled = false;

  this.enable = function() {
    if ( this.domElement && !this.enabled ) {
      this.listenTo( this.domElement );
      this.enabled = true;
    }
  };

  this.disable = function() {
    this.stopListening();
    this.enabled = false;
  };

  this.listenTo = function( domElement ) {
    this.domElement = domElement;
    this.domElement.addEventListener( 'contextmenu', onContextMenu, false );
    this.domElement.addEventListener( 'mousedown', onMouseDown, false );
    this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    this.domElement.addEventListener( 'touchstart', touchStart, false );
    this.domElement.addEventListener( 'touchmove', touchMove, false );
  };

  this.stopListening = function() {
    if ( this.domElement ) {
      this.domElement.removeEventListener( 'contextmenu', onContextMenu );
      this.domElement.removeEventListener( 'mousedown', onMouseDown );
      this.domElement.removeEventListener( 'mousewheel', onMouseWheel );
      this.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel ); // firefox
      this.domElement.removeEventListener( 'touchstart', touchStart );
      this.domElement.removeEventListener( 'touchmove', touchMove );
    }
  };

  function onContextMenu( event ) { event.preventDefault(); }

  // internals

  var scope = this;
  var vector = new THREE.Vector3();

  var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
  var state = STATE.NONE;

  var center = new THREE.Vector3();
  var normalMatrix = new THREE.Matrix3();

  // events

  var changeEvent = { type: 'change' };

  this.focus = function ( target ) {

	center.getPositionFromMatrix( target.matrixWorld );
	object.lookAt( center );

	scope.dispatchEvent( changeEvent );

  };

  this.pan = function ( distance ) {

	normalMatrix.getNormalMatrix( object.matrix );

	distance.applyMatrix3( normalMatrix );
	distance.multiplyScalar( vector.copy( center ).sub( object.position ).length() * 0.001 );

	object.position.add( distance );
	center.add( distance );

	scope.dispatchEvent( changeEvent );

  };

  this.zoom = function ( distance ) {

	normalMatrix.getNormalMatrix( object.matrix );

	distance.applyMatrix3( normalMatrix );
	distance.multiplyScalar( vector.copy( center ).sub( object.position ).length() * 0.001 );

	object.position.add( distance );

	scope.dispatchEvent( changeEvent );

  };

  this.rotate = function ( delta ) {

	vector.copy( object.position ).sub( center );

	var theta = Math.atan2( vector.x, vector.z );
	var phi = Math.atan2( Math.sqrt( vector.x * vector.x + vector.z * vector.z ), vector.y );

	theta += delta.x;
	phi += delta.y;

	var EPS = 0.000001;

	phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

	var radius = vector.length();

	vector.x = radius * Math.sin( phi ) * Math.sin( theta );
	vector.y = radius * Math.cos( phi );
	vector.z = radius * Math.sin( phi ) * Math.cos( theta );

	object.position.copy( center ).add( vector );

	object.lookAt( center );

	scope.dispatchEvent( changeEvent );

  };

  // mouse

  function onMouseDown( event ) {

	if ( scope.enabled === false ) return;

	event.preventDefault();

	if ( event.button === 0 ) {

	  state = STATE.ROTATE;

	} else if ( event.button === 1 ) {

	  state = STATE.ZOOM;

	} else if ( event.button === 2 ) {

	  state = STATE.PAN;

	}

	scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
	scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
	scope.domElement.addEventListener( 'mouseout', onMouseUp, false );

  }

  function onMouseMove( event ) {

	if ( scope.enabled === false ) return;

	event.preventDefault();

	var movementX = event.movementX || event.webkitMovementX || event.mozMovementX || event.oMovementX || 0;
	var movementY = event.movementY || event.webkitMovementY || event.mozMovementY || event.oMovementY || 0;

	if ( state === STATE.ROTATE ) {

	  scope.rotate( new THREE.Vector3( - movementX * 0.005, - movementY * 0.005, 0 ) );

	} else if ( state === STATE.ZOOM ) {

	  scope.zoom( new THREE.Vector3( 0, 0, movementY ) );

	} else if ( state === STATE.PAN ) {

	  scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

	}

  }

  function onMouseUp( event ) {

	if ( scope.enabled === false ) return;

	scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
	scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
	scope.domElement.removeEventListener( 'mouseout', onMouseUp, false );

	state = STATE.NONE;

  }

  function onMouseWheel( event ) {

	// if ( scope.enabled === false ) return;

	var delta = 0;

	if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

	  delta = - event.wheelDelta;

	} else if ( event.detail ) { // Firefox

	  delta = event.detail * 10;

	}

	scope.zoom( new THREE.Vector3( 0, 0, delta ) );

  }

  // touch

  var touch = new THREE.Vector3();
  var prevTouch = new THREE.Vector3();
  var prevDistance = null;
  var zoomSpeed = 4;

  function touchStart( event ) {

	if ( scope.enabled === false ) return;

	var touches = event.touches;

	switch ( touches.length ) {

	case 2:
	  var dx = touches[ 0 ].pageX - touches[ 1 ].pageX;
	  var dy = touches[ 0 ].pageY - touches[ 1 ].pageY;
	  prevDistance = Math.sqrt( dx * dx + dy * dy ) * zoomSpeed;
	  break;

	}

	prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );

  }

  function touchMove( event ) {

	if ( scope.enabled === false ) return;

	event.preventDefault();
	event.stopPropagation();

	var touches = event.touches;

	touch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );

	switch ( touches.length ) {

	case 1:
	  scope.rotate( touch.sub( prevTouch ).multiplyScalar( - 0.005 ) );
	  break;

	case 2:
	  var dx = touches[ 0 ].pageX - touches[ 1 ].pageX;
	  var dy = touches[ 0 ].pageY - touches[ 1 ].pageY;
	  var distance = Math.sqrt( dx * dx + dy * dy ) * zoomSpeed;
	  scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
	  prevDistance = distance;
	  break;

	case 3:
	  scope.pan( touch.sub( prevTouch ).setX( - touch.x ) );
	  break;

	}

	prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );

  }

  this.enable();

  return this;
};

EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
