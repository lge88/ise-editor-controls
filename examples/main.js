var EditorControls = require( 'ise-editor-controls' );
var ISEViewport = require( 'ise-viewport' );
var randomCubes = require( 'three-random-cubes' );
var THREE = require( 'three' );
var StrokeRenderer = require( 'ise-stroke-renderer' );


window.onError = function( msg, url ) {
  document.getElementById( 'debug' ).textContent = msg;
}

document.getElementById( 'toggle-sketch' ).addEventListener( 'click', function() {
  controls.sketching = !controls.sketching;
  alert('toggle');
} );

// document.getElementById( 'toggle-sketch' ).addEventListener( 'mouseup', function() {
//   controls.sketching = false;
// } );


var viewport = ISEViewport( { container: document.getElementById( 'main' ), grid: true } );
var controls = new EditorControls( viewport.camera, viewport.container );
var strokeRenderer = new StrokeRenderer( viewport.canvas2D );
strokeRenderer.start();

var grid = viewport.grid;
// var mat = new THREE.Matrix4();
// mat.makeRotationX( Math.PI/2 );
// grid.geometry.applyMatrix( mat );
// grid.geometry.verticesNeedUpdate = true;
// grid.rotateX( Math.PI/2 );

// viewport.camera.position.set( 200, 200, 200 );

var p = new THREE.PlaneGeometry( 200, 200 );
var m = new THREE.MeshBasicMaterial( {
  color: 0xff0000
} );
var pp = new THREE.Mesh( p, m );
viewport.scene.add( pp );

var scene = viewport.scene;
var cubes = randomCubes( 100 ).map( function( c ) { scene.add( c ); return c; } );

var currentSketch = [];
var tid = null;
controls.on( 'sketchStart', function( p ) {
  clearTimeout( tid );
  strokeRenderer.add( currentSketch );
} );

controls.on( 'sketching', function( p ) {
  currentSketch.push( p );
} );

controls.on( 'oneStroke', function( p ) {
  tid = setTimeout( function() {
    strokeRenderer.clear();
  }, 1000 );
  currentSketch = [];
} );

function cube( w, h, t ) {
  var m = new THREE.Mesh(
    new THREE.CubeGeometry( w || 40, h || 40, t || 40 )
  );
  m.material.wireframe = false;
  return m;
};
