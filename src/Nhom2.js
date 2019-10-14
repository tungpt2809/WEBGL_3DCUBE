// LightedTranslatedRotatedCube.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
    'uniform vec3 u_LightColor;\n' +     // Light color
    'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
    'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'varying vec4 v_Color;\n' +

    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +

    'varying float v_nDotL;\n' +
    'varying vec3 v_LightColor;\n' +
    'varying vec3 v_AmbientLight;\n' +

    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    // Recalculate the normal based on the model matrix and make its length 1.
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // Calculate the dot product of the light direction and the orientation of a surface (the normal)
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    '  v_nDotL = nDotL;' +
    // Calculate the color due to diffuse reflection
    '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
    '  v_LightColor = u_LightColor;' +
    // Calculate the color due to ambient reflection
    '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
    '  v_AmbientLight = u_AmbientLight;' +
    // Add the surface colors due to diffuse reflection and ambient reflection
    '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +

    '  v_TexCoord = a_TexCoord;\n' +

    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +

    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'varying float v_nDotL;\n' +
    'varying vec3 v_LightColor;\n' +
    'varying vec3 v_AmbientLight;\n' +

    'void main() {\n' +
    '  vec4 tmp = texture2D(u_Sampler, v_TexCoord);' +
    '  vec3 diffuse1 = v_LightColor * tmp.rgb * v_nDotL;\n' +
    '  vec3 ambient1 = v_AmbientLight * tmp.rgb;\n' +
    // '  gl_FragColor = v_Color;\n' +
    '  gl_FragColor = vec4(diffuse1 + ambient1, tmp.a);\n' +
    '}\n';


var ANGLE_STEP = 0;
var ANGLE_STEPX = 0;
var eyeX = 3, eyeY = 3, eyeZ = 7;

var u_MvpMatrix;
var u_NormalMatrix;
var u_LightColor;
var u_LightDirection;
var u_AmbientLight;

var modelMatrix = new Matrix4();  // Model matrix
var mvpMatrix = new Matrix4();    // Model view projection matrix
var normalMatrix = new Matrix4(); // Transformation matrix for normals
var gl;
var n;

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // 
    n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightDirection || !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }
    // LIGHT THINGS
    // Set the light color (white)
    gl.uniform3f(u_LightColor, 2.0, 2.0, 2.0);
    // Set the light direction (in the world coordinate)
    var lightDirection = new Vector3([5.0, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    // Calculate the model matrix
    initTextures(gl, 36);
    document.onkeydown = function (ev) { keydown(ev, gl, n); };
}

function changeView(event, t) {
    switch (t) {
        case 'x':
            if (event.ctrlKey) eyeX--;
            else eyeX++;
            break;
        case 'y':
            if (event.ctrlKey) eyeY--;
            else eyeY++;
            break;
        case 'z':
            if (event.ctrlKey) eyeZ--;
            else eyeZ++;
            break;
    };
    console.log(eyeX, eyeY, eyeZ);
    draw(gl, n);
}

function keydown(ev, gl, n) {
    console.log(ev.keyCode);
    switch (ev.keyCode) {
        case 39: {
            ANGLE_STEP += 10;
            draw(gl, n, 0, 1, 0);
            break;
        }
        case 37: {
            ANGLE_STEP -= 10;
            draw(gl, n, 0, 1, 0);
            break;
        }
        case 38: {
            ANGLE_STEPX += 10;
            draw(gl, n, 1, 0, 0);
            break;
        }
        case 40: {
            ANGLE_STEPX -= 10;
            draw(gl, n, 1, 0, 0);
            break;
        }
    }
}

function draw(gl, n) {
    modelMatrix.setTranslate(0, 0.0, 0);
    modelMatrix.rotate(ANGLE_STEP, 0, 1, 0);
    modelMatrix.rotate(ANGLE_STEPX, 1, 0, 0);
    // Calculate the view projection matrix
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);

    mvpMatrix.multiply(modelMatrix);
    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Calculate the matrix to transform the normal based on the model matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normals to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // Coordinates
    var vertices = new Float32Array([
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0  // v4-v7-v6-v5 back
    ]);

    // Colors
    var colors = new Float32Array([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v1-v2-v3 front
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v3-v4-v5 right
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v0-v5-v6-v1 up
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v3-v4-v5 right
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v3-v4-v5 right
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v3-v4-v5 right
    ]);

    // Normal
    var normals = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    var texcoords = new Float32Array([
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v1-v2-v3 front        Z
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v3-v4-v5 right        X 
        1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, // v0-v5-v6-v1 up           Y
        1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, // v1-v6-v7-v2 left         X
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, // v7-v4-v3-v2 down         Y
        1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0  // v4-v7-v6-v5 back         Z
    ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoord', texcoords, 2)) return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function initTextures(gl, n) {
    var texture = gl.createTexture();
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    var image = new Image();
    image.onload = function () { loadTexture(gl, n, texture, u_Sampler, image); };
    image.src = '../resources/eiffel.jpg';
}

function loadTexture(gl, n, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw(gl, n)
}