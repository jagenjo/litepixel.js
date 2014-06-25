//packer version
var global = typeof(window) != "undefined" ? window : self;
var log = console.log.bind(console);

var LitePixel = {
	last_uid: 0,
	resources: {},

	generateUID: function() { return this.last_uid++; } 
};

Blend = {};
Blend.NORMAL = 0;
Blend.ADD = 1;
Blend.MULTIPLY = 2;
Blend.SCREEN = 3;


/* Sprite *******************/
function Sprite(texture)
{
	this._ctor(texture);
}

Sprite.prototype._ctor = function(texture)
{
	this.uid = LitePixel.generateUID();
	this.position = vec3.create();
	this.scale = vec2.fromValues(1,1);
	this.scroll_factor = vec2.fromValues(1,1); //parallax
	this.size = vec2.fromValues(0,0);
	this.color = vec4.fromValues(1,1,1,1);
	this.rotation = 0;
	this._bounding = vec4.create();
	if(texture)
	{
		this.texture = texture;
		this.size[0] = texture.width;
		this.size[1] = texture.height;
	}

	this.flipX = false;
	this.blendMode = Blend.NORMAL;

	this.spritesheet = false;

	this.entities = [];
}

Object.defineProperty(Sprite.prototype, 'opacity', {
	get: function() { return this.color[3]; },
	set: function(v) { return this.color[3] = v; }
});

Object.defineProperty(Sprite.prototype, 'x', {
	get: function() { return this.position[0]; },
	set: function(v) { return this.position[0] = v; }
});

Object.defineProperty(Sprite.prototype, 'y', {
	get: function() { return this.position[1]; },
	set: function(v) { return this.position[1] = v; }
});

Object.defineProperty(Sprite.prototype, 'z', {
	get: function() { return this.position[2]; },
	set: function(v) { return this.position[2] = v; }
});

Sprite.prototype.configure = function(o)
{
	for(var i in o)
	{
		if(this[i] && this[i].constructor == Float32Array)
			this[i].set( o[i] );
		else
			this[i] = o[i]; //easy clone
	}

	if(o.src)
		this.setImage(o.src);
}

Sprite.prototype.addChild = function( entity )
{
	this.entities.push(entity);
	entity._stage = this._stage;
	entity._parent = this;
}

Sprite.prototype.useSpriteSheet = function(frame_width, frame_height)
{
	this.spritesheet = true;
	this.frame_size = vec2.fromValues(frame_width, frame_height);
	this.frame = 0;
}

Sprite.prototype.addAnimation = function(name, frames)
{
	if(!this.animations) this.animations = {};
	this.animations[name] = frames;
	if(!this.current_animation)
		this.current_animation = frames;
}

Sprite.prototype.playAnimation = function(name)
{
	if(this.current_animation != name)
		this._current_frame = 0;
	this.current_animation = name;
	this._anim = this.animations[name];

}

Sprite.prototype.setImage = function(url)
{
	var self = this;
	this.texture = LitePixel.resources[ url ];
	if(this.texture)
	{
		this.size[0] = this.texture.width;
		this.size[1] = this.texture.height;
		return;
	}

	ResourcesManager.load(url, function(url, texture) { 
		self.size[0] = texture.width;
		self.size[1] = texture.height;
		self.texture = texture; 
	});
}

Sprite.fromImage = function( url )
{
	var sp = new Sprite();
	sp.setImage(url);
	return sp;
}

Sprite.prototype.propagate = function(name, params)
{
	for(var i in this.entities)
	{
		var e = this.entities[i];
		if(e[name])
			e[name].apply(e,params);
		if(e.entities && e.entities.length)
			e.propagate(name,params);
	}
}


LitePixel.Sprite = Sprite;



function Sprite3D()
{
	this._ctor();
	this._model_matrix = mat4.create();
}

Sprite3D.prototype.configure = function(data)
{
	Sprite.prototype.configure.call( this, data );

	//extra
	this.flip_normals = true;
	this.two_sided = true;
	this._mesh = GL.Mesh.cube({size:20});
}

Sprite3D.prototype.rotate = function(angle, axis)
{
	 mat4.rotate(this._model_matrix, this._model_matrix, angle * DEG2RAD, axis);
}

Sprite3D.prototype.render = function( renderer )
{
	if(this.texture)
		this.texture.bind(0);

	renderer.getEntityMatrix( this, temp_mat4 );
	mat4.multiply( temp_mat4, temp_mat4, this._model_matrix );
	renderer.checkBlending(this);

	mat4.multiply( renderer.mvp_matrix, renderer.vp_matrix, temp_mat4 );
	renderer._uniforms.u_mvp = renderer.mvp_matrix;
	renderer._uniforms.u_color.set( this.color );

	if(this.two_sided)	
		gl.disable( gl.CULL_FACE );
	else
		gl.enable( gl.CULL_FACE );
	if(this.flip_normals)  gl.frontFace( gl.CW );

	gl.enable( gl.DEPTH_TEST );
	renderer.texture3d_shader.uniforms( renderer._uniforms ).draw( this._mesh );

	if(this.flip_normals) gl.frontFace( gl.CCW );
	if(this.two_sided) gl.enable( gl.CULL_FACE );

	if( this._stage.depth_test )
		gl.enable( gl.DEPTH_TEST );
	else
		gl.disable( gl.DEPTH_TEST );
	gl.disable( gl.CULL_FACE );
}

extendClass(Sprite3D, Sprite);

//***************************

function Particles()
{
	this._ctor();

	this.max = 100;
	this.particles = [];
}

Particles.prototype.render = function(renderer)
{
	if(!this._mesh)
		this.createMesh();

	if(!this.particles.length)
		return;
}

Particles.prototype.createMesh = function()
{
	var vertices = new Float32Array( this.max * 2 );	
	var extra = new Float32Array( this.max * 2 );

	var mesh = new GL.Mesh();
	mesh.addBuffer("vertices2D", null, 0, vertices, gl.STREAM_DRAW );
	mesh.addBuffer("extra2", null, 0, extra, gl.STREAM_DRAW );

	this._mesh = mesh;
}

Particles.prototype.updateMesh = function(dt)
{
	if(!this.mesh)
		return;

	var vertices = this.mesh.vertexBuffers["vertices2D"];
	var extra = this.mesh.vertexBuffers["extra2"];

	for(var i in this.particles)
	{
		var p = this.particles[i];
		//TODO

	}
}


Particles.prototype.update = function(dt)
{
	this.updateMesh();
}

extendClass(Particles, Sprite);


/* Stage *******************************/
function Stage(bgcolor)
{
	this.bgcolor = vec4.fromValues(0,0,0,1);
	this.time = 0;
	this.depth_test = false;
	if(bgcolor)
		this.bgcolor.set(bgcolor);
	else if(bgcolor === null)
		this.bgcolor = null;

	this.entities = [];
}

Stage.prototype.addChild = function( entity )
{
	this.entities.push(entity);
	entity._stage = this;
}

Stage.prototype.getEntity = function( id )
{
	for(var i = 0; i < this.entities.length; ++i)
		if(this.entities[i].id == id)
			return this.entities[i];
	return null;
}


Stage.prototype.getEntitiesAtPos = function(x,y, result)
{
	result = result || [];
	for(var i = 0; i < this.entities.length; ++i)
	{
		var ent = this.entities[i];
		//TODO		
	}
}

Stage.prototype.query = function(q)
{
	return new Query(q,this);
}

Stage.prototype.update = function(dt)
{
	this.propagate("update",[dt, this.time]);
	this.time += dt;
}

//Extend
Stage.prototype.propagate = Sprite.prototype.propagate;


Stage.prototype.load = function(url, on_complete)
{
	var self = this;
	ResourcesManager.loadFile(url, function(name, data)
	{
		var current_layer = null;
		var canvas = LitePixel.last_canvas;
		var width, height;
		if(canvas)
		{
			width = canvas.width;
			height = canvas.height;
		}

		var lines = data.split("\n");
		for(var i in lines)
		{
			var line = lines[i].trim();
			if(!line) continue;
			if(line[0] == "#") continue; //comment
			var pos = line.indexOf(" ");
			var first = line.slice(0, pos);
			var rest = line.slice(pos+1);
			switch (first)
			{
				case "layer":
					current_layer = new Sprite();
					current_layer.id = rest;
					self.addChild(current_layer);
					break;
				case "sprite":
					var sprite = new Sprite();
					var data = eval("("+rest+")");
					sprite.configure(data);
					(current_layer || self).addChild(sprite);
					break;
				default:
					if( global[ first ] ) //there is a class with that name
					{
						var entity = new global[first]();
						var data = eval("("+rest+")");
						if(entity.configure)
							entity.configure(data);
						(current_layer || self).addChild(entity);
					}
			}
		}

		if(on_complete) on_complete();

		function read(line)
		{
			var o = {};
			var tokens = line.split(" ");
			o.type = tokens[0];
			for(var i = 1; i < tokens.length; ++i)
			{
				var tuple = tokens[i].split("=");
				if(tuple.length == 1)
					o[tuple[0]]=true;
				else
					o[tuple[0]]=tuple[1];
			}
			return o;
		}
	});
}

LitePixel.Stage = Stage;



/* Query *********************/
function Query(q, stage)
{
	this.result = [];
	for(var i in stage.entities)
	{
		var ent = stage.entities[i];
		if(q[0] == "." && ent.className == q.substr(1))
			this.result.push(ent);
	}
}

Query.prototype.action = function(callback)
{
	this.result.forEach(callback)
}


/* Camera *******************************/
function Camera()
{
	this.position = vec2.create(); //defines the bottom left corner of the camera in stage coordinates
	this.scale = 1;
	this.bounds = vec4.create();

	this.max_scale = 10;
	this.min_scale = 0.1;

	this.focal_distance = 0;
}

Camera.prototype.setBounds = function(minx,miny,maxx,maxy)
{
	this.bounds[0] = minx;
	this.bounds[1] = miny;
	this.bounds[2] = maxx;
	this.bounds[3] = maxy;
}

Camera.prototype.canvasToStage = function(x,y, result)
{
	result = result || vec2.create();
	//TODO
}

Camera.prototype.setZoom = function(value, x,y, canvas)
{
	if(x === undefined)
		x = canvas ? canvas.width * 0.5 : 0;
	if(y === undefined)
		y = canvas ? canvas.height * 0.5 : 0;

	var center = this.convertCanvasToStage( x,y );

	this.scale = value;

	if(this.scale > this.max_scale)
		this.scale = this.max_scale;
	else if(this.scale < this.min_scale)
		this.scale = this.min_scale;
	
	var new_center = this.convertCanvasToStage( x,y );

	this.position[0] -= new_center[0] - center[0];
	this.position[1] -= new_center[1] - center[1];
}

Camera.prototype.centerIn = function(entity, canvas)
{
	this.position[0] = entity.position[0] - canvas.width * 0.5 / this.scale;
	this.position[1] = entity.position[1] - canvas.height * 0.5 / this.scale;
}


Camera.prototype.convertStageToCanvas = function(x,y, result)
{
	result = result || vec2.create();
	result[0] = (x - this.position[0]) * this.scale;
	result[1] = (y - this.position[1]) * this.scale;
	return result;
}

Camera.prototype.convertCanvasToStage = function(x,y, result)
{
	result = result || vec2.create();

	result[0] = this.position[0] + x / this.scale ;
	result[1] = this.position[1] + y / this.scale ;

	return result;
}


/* Renderer ************/
var temp_mat4 = mat4.create();
var temp_vec2 = vec3.create();
var temp_vec3 = vec3.create();
var temp_vec4 = vec3.create();

function Renderer(w,h,canvas)
{
	if(canvas && typeof(canvas) == "string")
		canvas = document.querySelector(canvas);

	Renderer._instance = this;
	this.smoothing = true;
	this.premultiply_alpha = true;

	var gl = GL.create({width:w,height:h, alpha:false, canvas: canvas});
	this.canvas = gl.canvas;
	gl.captureMouse(true);
	gl.captureKeys(true);
	this.context = gl;

	LitePixel.last_canvas = this.canvas; //could be useful

	//create matrices
	this.view_matrix = mat4.create();
	this.proj_matrix = mat4.create();
	this.vp_matrix = mat4.create();
	this.mvp_matrix = mat4.create();
	this.tex_matrix = mat3.create();
	this.matrix_stack = new Float32Array(16*16);
	this.stack_top = this.matrix_stack.subarray(0,16);
	mat4.identity(this.stack_top);

	this.offset = vec2.create();
	this.scale = 1;
	this.round_offset = true; //applies a rounding to the offset values before rendering (to avoid temporal aliasing in 3d meshes

	mat4.ortho( this.proj_matrix, 0, gl.canvas.width, 0, gl.canvas.height, -100, 100 );
	mat4.multiply( this.vp_matrix, this.proj_matrix, this.view_matrix );

	//uniforms
	this.ambient_color = vec4.fromValues(1,1,1,1);
	this._uniforms = {
		u_mvp: this.vp_matrix,
		u_color: this.ambient_color,
		u_texmatrix: this.tex_matrix,
		u_texture: 0
	};

	//texture bind in slot 0
	this.current_texture = null;

	//create meshes
	this.plane_mesh = GL.Mesh.plane2D({size:1});

	//create shaders
	this.texture_shader = new Shader('\
			precision highp float;\
			attribute vec2 a_vertex2D;\
			attribute vec2 a_coord;\
			varying vec2 v_coord;\
			uniform mat3 u_texmatrix;\
			uniform mat4 u_mvp;\
			void main() {\
				v_coord = (u_texmatrix * vec3(a_coord,1.0)).xy;\
				gl_Position = u_mvp * vec4(a_vertex2D,0.0,1.0);\
			}\
			', '\
			precision highp float;\
			varying vec2 v_coord;\
			uniform sampler2D u_texture;\
			uniform vec4 u_color;\
			void main() {\
			   vec4 color = u_color * texture2D(u_texture, v_coord);\
			   if(color.a < 0.01) \
					discard; \
			   gl_FragColor = color;\
			}\
		');

	//create shaders
	this.texture3d_shader = new Shader('\
			precision highp float;\
			attribute vec3 a_vertex;\
			attribute vec2 a_coord;\
			varying vec2 v_coord;\
			uniform mat3 u_texmatrix;\
			uniform mat4 u_mvp;\
			void main() {\
				v_coord = (u_texmatrix * vec3(a_coord,1.0)).xy;\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\
			}\
			', '\
			precision highp float;\
			varying vec2 v_coord;\
			uniform sampler2D u_texture;\
			uniform vec4 u_color;\
			void main() {\
			   vec4 color = u_color * texture2D(u_texture, v_coord);\
			   if(color.a < 0.01) \
					discard; \
			   gl_FragColor = color;\
			}\
		');
}

Renderer._instance = null;

Renderer.prototype.render = function(stage, camera)
{
	this.computeCameraMatrices( camera );

	//smooth
	/*
	if(0)
	{
		if(!this._old_vp_matrix)
			this._old_vp_matrix = mat4.clone(this.vp_matrix);
		else
		{
			for(var i = 0; i < this.vp_matrix.length; i++)	
				this.vp_matrix[i] = this.vp_matrix[i] * 0.01 + 0.99 * this._old_vp_matrix[i];
			this._old_vp_matrix.set( this.vp_matrix );
		}
	}
	*/

	this.current_texture = null;

	if(stage.bgcolor)
	{
		gl.clearColor( stage.bgcolor[0], stage.bgcolor[1], stage.bgcolor[2], stage.bgcolor[3]);
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	}

	gl.depthFunc( gl.LEQUAL );
	gl[ stage.depth_test ? "enable" : "disable" ]( gl.DEPTH_TEST );

	gl.disable( gl.CULL_FACE );
	gl.enable ( gl.BLEND );
	gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

	stage.entities.forEach( this.renderEntity.bind(this) );
}

Renderer.prototype.computeCameraMatrices = function(camera)
{
	if(camera)
	{
		/*
		mat4.ortho( this.proj_matrix, 
					camera.position[0], camera.position[0] + (this.canvas.width / camera.scale),
					camera.position[1], camera.position[1] + (this.canvas.height / camera.scale),
					-1, 1 );
		*/
		this.offset.set(camera.position);
		this.scale = camera.scale;

		if( camera.focal_distance )
		{
			var fov = 2 * Math.atan( this.canvas.height / ( camera.focal_distance * 2 ) );
			mat4.perspective( this.proj_matrix, fov, this.canvas.width / this.canvas.height, 0.01, camera.focal_distance * 2 );
			mat4.lookAt( this.view_matrix, [this.canvas.width*0.5,this.canvas.height*0.5, camera.focal_distance],[this.canvas.width*0.5,this.canvas.height*0.5,0],[0,1,0] );
		}
		else
		{
			mat4.identity( this.view_matrix );
			mat4.ortho( this.proj_matrix, 
						0, this.canvas.width,
						0, this.canvas.height,
						-100, 100 );
		}
		mat4.multiply( this.vp_matrix, this.proj_matrix, this.view_matrix );
	}
	else
	{
		this.offset[0] = this.offset[1] = 0.0;
		this.scale = 1.0;
		mat4.identity( this.view_matrix );
		mat4.ortho( this.proj_matrix, 0, this.canvas.width, 0, this.canvas.height, -1, 1 );
		mat4.multiply( this.vp_matrix, this.proj_matrix, this.view_matrix );
	}
}

Renderer.prototype.renderEntity = function(entity)
{
	if(entity.render)
		return entity.render(this);

	if(!entity.texture && !entity.entities.length)
		return;

	this.getEntityMatrix( entity, temp_mat4 );

	if(entity.texture)
		this.renderSprite(temp_mat4, entity);

	if(entity.entities)
		entity.entities.forEach( this.renderEntity.bind(this) );
}

//compute the entity matrix from its TRS
Renderer.prototype.getEntityMatrix = function(entity, matrix)
{
	mat4.identity( matrix );

	var offsetx =  this.offset[0];
	var offsety =  this.offset[1];
	if(this.round_offset)
	{
		offsetx = Math.round(offsetx);
		offsety = Math.round(offsety);
	}

	//translate
	temp_vec3[0] = (entity.position[0] - offsetx  * entity.scroll_factor[0]) * this.scale;
	temp_vec3[1] = (entity.position[1] - offsety * entity.scroll_factor[0]) * this.scale;
	temp_vec3[2] = entity.position[2];
	mat4.translate( matrix, matrix, temp_vec3 );

	//rotate
	mat4.rotateZ( matrix, matrix, entity.rotation * DEG2RAD );

	//scale
	temp_vec3[0] = entity.scale[0] * (this.scale);
	temp_vec3[1] = entity.scale[1] * (this.scale);
	temp_vec3[2] = entity.scale[0];
	mat4.scale( matrix, matrix, temp_vec3 );
}

Renderer.prototype.checkBlending = function(entity)
{
	//blend mode
	switch(entity.blendMode)
	{
		case 1:	gl.blendFunc( gl.SRC_ALPHA, gl.ONE ); break;
		case 2: gl.blendFunc( gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA ); break;
		case 3: gl.blendFunc( gl.SRC_ALPHA, gl.ONE ); break;
		case 0:
		default:
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	}
}

//mostly atlas things
Renderer.prototype.renderSprite = function(model, entity)
{
	var w = entity.texture.width;
	var h = entity.texture.height;

	if(entity.spritesheet)
	{
		w = entity.frame_size[0];
		h = entity.frame_size[1];
	}

	//transform stack here
	//TODO

	//sprite size
	temp_vec3[0] = w;
	temp_vec3[1] = h;
	if(entity.flipX)
		temp_vec3[0]*=-1;
	mat4.scale( temp_mat4, temp_mat4, temp_vec3 );

	mat4.multiply( this.mvp_matrix, this.vp_matrix, temp_mat4 );
	this._uniforms.u_mvp = this.mvp_matrix;
	this._uniforms.u_color.set( entity.color );

	if(this.current_texture != entity.texture)
	{
		entity.texture.bind(0);
		this.current_texture = entity.texture;
	}

	this.checkBlending(entity);
	if(entity.no_depth_write)
		gl.depthMask( false );

	if(entity.spritesheet)
	{
		mat3.identity( this.tex_matrix );

		//adapt texture matrix
		var horizontal_frames = entity.texture.width / entity.frame_size[0]; 
		var animation = entity._anim;
		var frame = animation[ (entity._current_frame|0) % animation.length ];
		temp_vec2[0] = (frame % horizontal_frames) * w / entity.texture.width; 
		temp_vec2[1] = (frame / horizontal_frames)|0 * h / entity.texture.height;
		mat3.translate( this.tex_matrix, this.tex_matrix, temp_vec2 );
		temp_vec2[0] = w / entity.texture.width; 
		temp_vec2[1] = h / entity.texture.height;
		mat3.scale( this.tex_matrix, this.tex_matrix, temp_vec2 );

		//mat3.translate( this.texture_matrix, this.texture_matrix, [x, y] );
		//render
		this.texture_shader.uniforms( this._uniforms ).draw( this.plane_mesh );
		mat3.identity( this.tex_matrix );
	}
	else
	{
		this.texture_shader.uniforms( this._uniforms ).draw( this.plane_mesh );
	}

	if(entity.no_depth_write)
		gl.depthMask( true );

}

LitePixel.Renderer = Renderer;



/* ResourcesManager ******************/


ResourcesManager = {
	path: "",
	_loading: {},
	_num_loading: 0,

	load: function(list, on_complete )
	{
		if( list.constructor == String)
			list = [list];

		var to_load = list.length;
		for(var i in list)
			this.loadFile( list[i], function(url, file) { 
				to_load--;
				if(to_load == 0 && on_complete) on_complete(url, file);
			});
	},

	loadFile: function(url, on_complete)
	{
		//if we already have it, then nothing to do
		if(LitePixel.resources[url] != null)
		{
			if(on_complete)
				on_complete(url, LitePixel.resources[url]);
			return true;
		}

		//extract the filename extension
		var extension = this.getExtension(url);
		if(!extension) //unknown file type
			return false;

		//if it is already being loaded, then add the callback and wait
		if(this._loading[url] != null)
		{
			this._loading[url].push( {callback: on_complete} );
			return;
		}

		//otherwise we have to load it
		//set the callback
		this._loading[url] = [{callback: on_complete}];

		//send an event if we are starting to load (used for loading icons)
		if(this._num_loading == 0)
			LEvent.trigger(this, "start_loading_resources", url);
		this._num_loading++;

		var ext = this.getExtension(url);

		if(ext == "jpg" || ext == "png")
		{
			//image?
			var img = new Image();
			img.src = this.path + url;
			img.onload = function(load)
			{
				var options = {};
				if(Renderer._instance.premultiply_alpha)
					options.premultiply_alpha = true;

				if( !isPowerOfTwo(this.width) || !isPowerOfTwo(this.height))
					options = { wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE, minFilter: gl.LINEAR, magFilter: gl.LINEAR };

				if(!Renderer._instance.smoothing)
					options.magFilter = gl.NEAREST;

				var resource = GL.Texture.fromImage(this, options);
				LitePixel.resources[url] = resource;
				LitePixel.ResourcesManager.triggerResourceLoaded(url, resource);
			}
			img.onerror = function(err)
			{
				console.error(err);
				LitePixel.ResourcesManager.triggerResourceLoaded(url, null);
			}
			return img;
		}

		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.path + url, true);
		xhr.onload = function(load)
		{
			var response = this.response;
			if(this.status != 200)
			{
				var err = "Error " + this.status;
				console.error(err);
			}
			else
			{
				var resource = this.response;
				LitePixel.resources[url] = resource;
			}
			
			LitePixel.ResourcesManager.triggerResourceLoaded(url, resource);
		}
		xhr.send();
		return xhr;
	},

	triggerResourceLoaded: function(url, res)
	{
		this._num_loading--;
		if(!this._loading[url]) return; //¿?

		for(var i in this._loading[url])
		{
			if(this._loading[url][i].callback != null)
				this._loading[url][i].callback(url, res);
		}

		delete this._loading[url];
		if( this._num_loading == 0)
			LEvent.trigger( this, "end_loading_resources");
	},

	getExtension: function(url)
	{
		var question = url.indexOf("?");
		if(question != -1)
			url = url.substr(0,question);

		var point = url.lastIndexOf(".");
		if(point == -1) return "";
		return url.substr(point+1).toLowerCase();
	}
}

LitePixel.ResourcesManager = ResourcesManager;

//********************************

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function hexToRgbNumber(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgb(hex) {

}



