litepixel.js
=========

Litepixel.js is 2D Games library, it uses WebGL to accelerate rendering. It is similar to pixi.js but is build on top of litegl.js.

Usage
-----

Include the library and dependencies
```html
<script src="js/gl-matrix-min.js"></script>
<script src="js/litegl.js"></script>
<script src="js/litepixel.js"></script>
```

Create the Stage
```js
var stage = new LitePixel.Stage();
```


Create the renderer
```js
var renderer = new LitePixel.Renderer(window.innerWidth, window.innerHeight);
```

Attach to DOM
```js
document.body.appendChild(renderer.canvas);
```

Hook events
```js
```

Get user input
```js
gl.captureMouse();
renderer.context.onmousedown = function(e) { ... }
renderer.context.onmousemove = function(e) { ... }

gl.captureKeys();
renderer.context.onkey = function(e) { ... }
```

Add sprite
```js
player = Sprite.fromImage("astronaut.png");
player.position.set([240,300]);
player.scale.set([2, 2]);
stage.addChild(player);
```

Create main loop
```js
requestAnimationFrame(animate);
function animate() {
	requestAnimationFrame( animate );

	last = now;
	now = getTime();
	var dt = (now - last) * 0.001;
	renderer.render(stage);
	stage.update(dt);
}
```

Documentation
-------------
The doc folder contains the documentation. For info about [http://glmatrix.com](glMatrix) check the documentation in its website.

Utils
-----

It includes several commands in the utils folder to generate doc, check errors and build minifyed version.


Feedback
--------

You can write any feedback to javi.agenjo@gmail.com
