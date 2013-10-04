var EditorControls = require( 'ise-editor-controls' );
var ISEViewport = require( 'ise-viewport' );
var randomCubes = require( 'three-random-cubes' );
var THREE = require( 'three' );
var StrokeRenderer = require( 'ise-stroke-renderer' );

var viewport = ISEViewport();
var controls = new EditorControls( viewport.camera, viewport.container );
var strokeRenderer = new StrokeRenderer( viewport.canvas2D );
strokeRenderer.start();

var scene = viewport.scene;
var cubes = randomCubes( 100 ).map( function( c ) { scene.add( c ); return c; } );

var currentSketch = [];
var tid = null;
controls.on( 'sketchStart', function( p ) {
  // currentSketch = [];
  clearTimeout( tid );
  strokeRenderer.add( currentSketch );
  // var c = cube();
  // c.position.y = p.x;
  // c.position.z = p.y;
  // scene.add( c );
} );

controls.on( 'sketching', function( p ) {
  currentSketch.push( p );
  // var c = cube();
  // c.position.y = p.x;
  // c.position.z = p.y;
  // scene.add( c );
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
