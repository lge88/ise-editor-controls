
var THREE = require( 'three' );
// var StrokeRenderer = require( 'ise-stroke-renderer' );
var Emitter = require( 'emitter' );

module.exports = exports = EditorControls;
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

function EditorControls( camera, domElement ) {

  if ( !(this instanceof EditorControls) ) { return new EditorControls( camera, domElement ); }
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API
  Emitter( this );

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
    this.domElement.addEventListener( 'touchend', touchEnd, false );
  };

  this.stopListening = function() {
    if ( this.domElement ) {
      this.domElement.removeEventListener( 'contextmenu', onContextMenu );
      this.domElement.removeEventListener( 'mousedown', onMouseDown );
      this.domElement.removeEventListener( 'mousewheel', onMouseWheel );
      this.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel ); // firefox
      this.domElement.removeEventListener( 'touchstart', touchStart );
      this.domElement.removeEventListener( 'touchmove', touchMove );
      this.domElement.removeEventListener( 'touchend', touchEnd );
    }
  };

  // this.setTarget = this.focus;
  // this.getCamera = function() { return camera.clone(); };
  // this.getTarget = function() { return _target.clone(); };

  // var getObjectPosition = function( obj ) {
  //   return ( new THREE.Vector3 ).getPositionFromMatrix( obj.matrixWorld );
  // };

  // this.getTargetPosition = function() { return getObjectPosition( _target ); };
  // this.getCameraPosition = function() { return getObjectPosition( camera ); };

  // var getObjectAxis = function() {
  //   var axises = {
  //     x: new THREE.Vector3( 1, 0, 0 ),
  //     y: new THREE.Vector3( 0, 1, 0 ),
  //     z: new THREE.Vector3( 0, 0, 1 )
  //   };
  //   return function( obj, axis ) {
  //     var a = axises[ axis ];
  //     a || ( a = axises[ 'x' ] );
  //     return obj.localToWorld( a.clone() );
  //   };
  // }();

  // this.getTargetXAxis = function() { return getObjectAxis( _target, 'x' ); };
  // this.getTargetYAxis = function() { return getObjectAxis( _target, 'y' ); };
  // this.getTargetZAxis = function() { return getObjectAxis( _target, 'z' ); };
  // this.getCameraXAxis = function() { return getObjectAxis( camera, 'x' ); };
  // this.getCameraYAxis = function() { return getObjectAxis( camera, 'y' ); };
  // this.getCameraZAxis = function() { return getObjectAxis( camera, 'z' ); };

  var currentStroke = [];
  var currentStrokeId = -1;
  // var strokeRenderer = this.strokeRenderer = new StrokeRenderer( domElement );
  // strokeRenderer.start();

  function onContextMenu( event ) { event.preventDefault(); }

  // internals

  var scope = this;
  var vector = new THREE.Vector3();

  var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, SKETCH: 3 };
  var HOLD = false;
  var setHoldTimeOutId = null;

  var state = STATE.NONE;

  var center = new THREE.Vector3();
  var normalMatrix = new THREE.Matrix3();

  // events

  var changeEvent = { type: 'change' };

  this.focus = function ( target ) {

	center.getPositionFromMatrix( target.matrixWorld );
	camera.lookAt( center );

	scope.dispatchEvent( changeEvent );

  };

  this.getCenter = function() { return center.clone(); };
  this.setCenter = function( x, y, z ) {
    if ( x instanceof THREE.Vector3 ) {
      center = x.clone();
    } else {
      center = new THREE.Vector3( x || 0, y || 0, z || 0 );
    }
  };

  this.getCamera = function() { return camera; };
  this.setCamera = function( c ) { camera = c; };

  this.pan = function ( distance ) {

	normalMatrix.getNormalMatrix( camera.matrix );

	distance.applyMatrix3( normalMatrix );
	distance.multiplyScalar( vector.copy( center ).sub( camera.position ).length() * 0.001 );

	camera.position.add( distance );
	center.add( distance );

	scope.dispatchEvent( changeEvent );

  };

  this.zoom = function ( distance ) {

	normalMatrix.getNormalMatrix( camera.matrix );

	distance.applyMatrix3( normalMatrix );
	distance.multiplyScalar( vector.copy( center ).sub( camera.position ).length() * 0.001 );

	camera.position.add( distance );

	scope.dispatchEvent( changeEvent );

  };

  this.rotate = function ( delta ) {

	vector.copy( camera.position ).sub( center );

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

	camera.position.copy( center ).add( vector );

	camera.lookAt( center );

	scope.dispatchEvent( changeEvent );

  };

  // mouse

  function onMouseDown( event ) {

	if ( scope.enabled === false ) return;

	event.preventDefault();

    // left button to sketch
	if ( event.button === 0 ) {

	  // state = STATE.ROTATE;
	  state = STATE.SKETCH;

	} else if ( event.button === 1 ) {

	  // state = STATE.ZOOM;
	  state = STATE.PAN;

	} else if ( event.button === 2 ) {

	  // state = STATE.PAN;
	  state = STATE.ROTATE;

	}

	scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
	scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
	scope.domElement.addEventListener( 'mouseout', onMouseUp, false );

    scope.emit( 'sketchStart', { x: event.clientX, y: event.clientY } );
    // currentStrokeId = strokeRenderer.add( currentStroke );
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

	} else if ( state === STATE.SKETCH ) {

      mouseSketching( event );

    }

  }

  function mouseSketching( event ) {
    var p = { x: event.clientX, y: event.clientY };
    currentStroke.push( p );
    scope.emit( 'sketching', p );
  }

  function touchSketching( event ) {
    var t = event.touches[ 0 ];
    if ( t ) {
      var p = { x: t.clientX, y: t.clientY };
      currentStroke.push( p );
      scope.emit( 'sketching', p );
    }
  }

  function oneStroke() {
    // strokeRenderer.clear();
    scope.emit( 'oneStroke', currentStroke );
    currentStroke = [];
  }

  function onMouseUp( event ) {

	if ( scope.enabled === false ) return;

	scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
	scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
	scope.domElement.removeEventListener( 'mouseout', onMouseUp, false );

	state = STATE.NONE;

    oneStroke();
  }

  function onMouseWheel( event ) {

	if ( scope.enabled === false ) return;

    if ( state === STATE.PAN ) {
      return;
    }

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
  var rotateOrZoomThreshold = 25;

  function touchStart( event ) {

	if ( scope.enabled === false ) return;

	var touches = event.touches;

	switch ( touches.length ) {


	case 1:
      currentStrokeId = strokeRenderer.add( currentStroke );
	  prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
	  break;

    case 2:
	  var dx = touches[ 0 ].pageX - touches[ 1 ].pageX;
	  var dy = touches[ 0 ].pageY - touches[ 1 ].pageY;
      var cx = 0.5 * ( touches[ 0 ].pageX + touches[ 1 ].pageX );
	  var cy = 0.5 * ( touches[ 0 ].pageY + touches[ 1 ].pageY );
	  prevDistance = Math.sqrt( dx * dx + dy * dy ) * zoomSpeed;
	  prevTouch.set( cx, cy, 0 );
	  break;

    default:
	  prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
      break;
	}


  }

  function touchMove( event ) {

	if ( scope.enabled === false ) return;

	event.preventDefault();
	event.stopPropagation();

	var touches = event.touches;


	switch ( touches.length ) {

	case 1:
	  touch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
      touchSketching( event );
	  prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
	  break;

	case 2:
      var cx = 0.5 * ( touches[ 0 ].pageX + touches[ 1 ].pageX );
	  var cy = 0.5 * ( touches[ 0 ].pageY + touches[ 1 ].pageY );
	  touch.set( cx, cy, 0 );

      // figure out rotate or zoom:
      if ( touch.sub( prevTouch ).lengthSq() > rotateOrZoomThreshold ) {
	    scope.rotate( touch.sub( prevTouch ).multiplyScalar( - 0.005 ) );
      } else {
	    var dx = touches[ 0 ].pageX - touches[ 1 ].pageX;
	    var dy = touches[ 0 ].pageY - touches[ 1 ].pageY;
	    var distance = Math.sqrt( dx * dx + dy * dy ) * zoomSpeed;
	    scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
	    prevDistance = distance;
      }
	  prevTouch.set( cx, cy, 0 );
	  break;

	case 3:
	  touch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
	  scope.pan( touch.sub( prevTouch ).setX( - touch.x ) );
	  prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );
	  break;

	}

	// prevTouch.set( touches[ 0 ].pageX, touches[ 0 ].pageY, 0 );

  }

  function touchEnd( event ) {
    if ( scope.enabled === false ) return;
	state = STATE.NONE;
    oneStroke();
  }

  this.enable();

  return this;
};

EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
