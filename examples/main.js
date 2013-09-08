var EditorControls = require( 'ise-editor-controls' );
var ISEViewport = require( 'ise-viewport' );
var randomCubes = require( 'three-random-cubes' );

var viewport = ISEViewport();
var controls = new EditorControls( viewport.camera, viewport.container );

var scene = viewport.scene;
var cubes = randomCubes( 100 ).map( function( c ) { scene.add( c ); return c; } );
