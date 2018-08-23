var scene, camera;
var renderer;

var debugCanvas,debugCtx;

var cameraRay;
var mouse;

var cursor;
var cachedMouseObjs=null;
var whistleSphere;

var lastTime=0;

var entities=[];
var walls=[];
var floors=[];

var terrainObjs=[];

var textures=[];
var texURLs=["img/sand.png","img/grass.png","img/stone2.png","img/bridge.png","img/weakWall.png","img/onion.png"];

var graph=new MapGraph();

var keys=[keyboard(87),keyboard(83),keyboard(65),keyboard(68),keyboard(9),mouseClick(1),mouseClick(3),keyboard(16),keyboard(81),keyboard(73)];

var DEBUG_SHOW_GRAPH_NODES=false;
var DEBUG_EASY_OBSTACLES=true;

function onMouseMove(ev) {
    mouse.x=(ev.clientX/window.innerWidth)*2-1;
    mouse.y=-(ev.clientY/window.innerHeight)*2+1;
    cachedMouseObjs=null;
}

function getMouseObjects() {
    if (cachedMouseObjs) return cachedMouseObjs;
    cameraRay.setFromCamera(mouse,camera);
    return cachedMouseObjs=cameraRay.intersectObjects(terrainObjs,true);
}

function addWall(wall) {
    walls.push(wall);
    if (wall.geom) {
        terrainObjs.push(wall.geom);
        terrainObjs[terrainObjs.length-1].terrain=wall;
    }
}

function addFloor(floor) {
    floors.push(floor);
    if (floor.geom) {
        terrainObjs.push(floor.geom);
        terrainObjs[terrainObjs.length-1].terrain=floor;
    }
}

function loadJSON(filename,callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
          }
    };
    xobj.send(null);  
 }

function init() {
    window.oncontextmenu=function() {return false;}
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0xffffff);
    scene.fog=new THREE.Fog(0xffffff,30,120);
    camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    camera.followPlayer=true;
    camera.theta=0;
    camera.destTheta=0;
    camera.phi=Math.PI/4;
    camera.destPhi=Math.PI/4;
    camera.update=function(deltaTime) {
        if (this.destTheta!=this.theta) {
            this.theta=(this.destTheta>this.theta)?Math.min(this.destTheta,this.theta+7*deltaTime):Math.max(this.destTheta,this.theta-7*deltaTime);
        }
        if (this.destPhi!=this.phi) {
            this.phi=(this.destPhi>this.phi)?Math.min(this.destPhi,this.phi+7*deltaTime):Math.max(this.destPhi,this.phi-7*deltaTime);
        }
    }
    camera.setDestTheta=function(newTheta) {
        this.destTheta=newTheta;
        while (this.destTheta-Math.PI>this.theta) {this.destTheta-=Math.PI*2;}
        while (this.destTheta+Math.PI<this.theta) {this.destTheta+=Math.PI*2;}
    }
    camera.setDestPhi=function(newPhi) {
        this.destPhi=newPhi;
        while (this.destPhi-Math.PI>this.phi) {this.destPhi-=Math.PI*2;}
        while (this.destPhi+Math.PI<this.phi) {this.destPhi+=Math.PI*2;}
    }
    
    whistleSphere={};
    whistleSphere.geom=new THREE.Mesh(new THREE.CylinderBufferGeometry(1,1,1,30,1,true),new THREE.MeshBasicMaterial({color: 0xff00ff,side: THREE.DoubleSide}));
    whistleSphere.setRadius=function(r) {
        whistleSphere.geom.scale.set(r,1,r);
    }
    whistleSphere.setPosition=function(x,y,z) {
        whistleSphere.geom.position.set(x,y,z);
    }
    whistleSphere.geom.visible=false;
    scene.add(whistleSphere.geom);
    
    cameraRay=new THREE.Raycaster();
    mouse=new THREE.Vector2();
    window.addEventListener("mousemove",onMouseMove,false);
    
    cursor={};
    let tex=new THREE.TextureLoader().load("img/cursor.png");
    tex.minFilter=THREE.NearestMipMapNearestFilter;
    cursor.geom=new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2),new THREE.MeshBasicMaterial({transparent: true, alphaTest: 0.5,map: tex}));
    scene.add(cursor.geom);
    cursor.update=function() {
        let objs=getMouseObjects();
        this.geom.visible=false;
        if (objs.length>0) {
            if (objs[0].object.terrain&&objs[0].object.terrain.getNormal) {
                this.geom.position.set(0,0,0);
                let norm=objs[0].object.terrain.getNormal(objs[0].point)
                this.geom.lookAt(norm);
                this.geom.position.set(objs[0].point.x,objs[0].point.y,objs[0].point.z);
                this.geom.position.x+=norm.x*0.01;
                this.geom.position.y+=norm.y*0.01;
                this.geom.position.z+=norm.z*0.01;
                this.geom.visible=true;
            } else {
                this.geom.position.set(objs[0].point.x,objs[0].point.y+0.01,objs[0].point.z);
                this.geom.lookAt(new THREE.Vector3(objs[0].point.x,objs[0].point.y+1,objs[0].point.z));
                this.geom.visible=true;
            }
        }
    }
    
    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    
    let light=new THREE.DirectionalLight(0xffffff,0.5);
    light.position.set(2,10,3);
    scene.add(light);
    
    renderer=new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    debugCanvas=document.createElement("canvas");
    debugCanvas.style.width="200px";
    debugCanvas.style.height="200px";
    debugCanvas.width=200;
    debugCanvas.height=200;
    debugCanvas.style.position="absolute";
    debugCanvas.style.left="0px";
    debugCanvas.style.top="0px";
    document.body.appendChild(debugCanvas);
    debugCtx=debugCanvas.getContext("2d");
    
    loadLevel("test.json",function() {
        requestAnimationFrame(animate);
    })
}

function clearLevel() {
    for (let i=0; i<floors.length; i++) {
        if (floors[i].geom) {
            scene.remove(floors[i].geom);
        }
    }
    for (let i=0; i<walls.length; i++) {
        if (walls[i].geom) {
            scene.remove(walls[i].geom);
        }
    }
    for (let i=0; i<entities.length; i++) {
        if (entities[i].geom) {
            scene.remove(entities[i].geom);
        }
    }
    terrainObjs=[];
    entities=[];
    floors=[];
    walls=[];
    graph=new MapGraph();
}

function loadLevel(url,callback) {
    clearLevel();
    loadJSON("levels/"+url,function(result) {
        for (let i=0; i<result.floors.length; i++) {
            switch(result.floors[i].type) {
                case "rect":
                    addFloor(new RectFloor(result.floors[i].x,result.floors[i].y,result.floors[i].z,result.floors[i].w,result.floors[i].d,result.floors[i].tex));
                    break;
                case "poly":
                    addFloor(new PolygonFloor(result.floors[i].points.map(pt => pt[0]),result.floors[i].points.map(pt => pt[1]),result.floors[i].y,result.floors[i].tex));
                    break;
                case "triangleStrip":
                    addFloor(new TriangleStripFloor(result.floors[i].points.map(pt => new THREE.Vector3(pt[0],pt[1],pt[2])),result.floors[i].tex));
                    break;
                case "ramp":
                    addFloor(new RampFloor(new THREE.Vector3(result.floors[i].p1.x,result.floors[i].p1.y,result.floors[i].p1.z),new THREE.Vector3(result.floors[i].p2.x,result.floors[i].p2.y,result.floors[i].p2.z),result.floors[i].w,result.floors[i].tex));
                    break;
            }
        }
        for (let i=0; i<result.entities.length; i++) {
            switch(result.entities[i].type) {
                case "player":
                    entities.push(new Player(result.entities[i].x,result.entities[i].y,result.entities[i].z));
                    break;
                case "onePellet":
                    entities.push(new OnePellet(result.entities[i].x,result.entities[i].y,result.entities[i].z));
                    break;
                case "pikmin":
                    entities.push(new Pikmin(result.entities[i].x,result.entities[i].y,result.entities[i].z));
                    break;
                case "bridge":
                    entities.push(new Bridge(new THREE.Vector2(result.entities[i].p1.x,result.entities[i].p1.z),new THREE.Vector2(result.entities[i].p2.x,result.entities[i].p2.z),result.entities[i].y,result.entities[i].id));
                    break;
                case "fallBridge":
                    entities.push(new FallBridge(new THREE.Vector2(result.entities[i].p1.x,result.entities[i].p1.z),new THREE.Vector2(result.entities[i].p2.x,result.entities[i].p2.z),result.entities[i].y,result.entities[i].yFinal,result.entities[i].id));
                    break;
                case "wall":
                    entities.push(new BreakableWall(new THREE.Vector2(result.entities[i].p1.x,result.entities[i].p1.z),new THREE.Vector2(result.entities[i].p2.x,result.entities[i].p2.z),result.entities[i].yMin,result.entities[i].yMax,result.entities[i].id));
                    break;
                case "onion":
                    let o=new Onion(result.graph[result.entities[i].node].x,result.graph[result.entities[i].node].y,result.graph[result.entities[i].node].z,result.entities[i].node);
                    entities.push(o);
                    graph.onion=o;
                    break;
                case "spring":
                    entities.push(new Spring(result.entities[i].x,result.entities[i].y,result.entities[i].z,result.entities[i].dx,result.entities[i].dy,result.entities[i].dz));
                    break;
            }
        }
        for (let i=0; i<result.walls.length; i++) {
            switch(result.walls[i].type) {
                case "wall":
                    addWall(new Wall(result.walls[i].tex,result.walls[i].points.map(pt => new THREE.Vector2(pt[0],pt[1])),result.walls[i].yMin,result.walls[i].yMax));
                    break;
                case "slope":
                    addWall(new SlopeWall(result.walls[i].tex,result.walls[i].points.map(pt => new THREE.Vector2(pt[0],pt[1])),result.walls[i].yMin,result.walls[i].yMax));
                    break;
            }
        }
        for (let i=0; i<result.graph.length; i++) {
            graph.addNode(new MapGraphNode(result.graph[i].x,result.graph[i].y,result.graph[i].z,result.graph[i].from,result.graph[i].obstacle));
        }
        graph.calculateDistances();
        if (DEBUG_SHOW_GRAPH_NODES) graph.render();
        callback();
    })
}

function getTexture(id) {
    if (!textures[id]) {
        textures[id]=new THREE.TextureLoader().load(texURLs[id]);
        textures[id].wrapS=THREE.RepeatWrapping;
        textures[id].wrapT=THREE.RepeatWrapping;
    }
    return textures[id];
}

function animate(currentTime) {
    let deltaTime=Math.min((currentTime-lastTime)/1000,0.024);
    if (lastTime==0) deltaTime=0.016;
    lastTime=currentTime;
    for (let i=0; i<entities.length; i++) {
        entities[i].update(deltaTime);
        if (entities[i].toRemove) {
            entities.splice(i,1);
            i--;
        }
    }
    if (mouse.x<-0.9) {
        camera.destTheta+=deltaTime;
    } else if (mouse.x>0.9) {
        camera.destTheta-=deltaTime;
    }
    cachedMouseObjs=null;
    cursor.update();
    renderer.render(scene,camera);
    debugCtx.fillStyle="#fff";
    debugCtx.clearRect(0,0,200,200);
    debugCtx.fillText(`${cursor.geom.position.x.toFixed(1)}, ${cursor.geom.position.y.toFixed(1)}, ${cursor.geom.position.z.toFixed(1)}`,5,20);
    requestAnimationFrame(animate);
}

init();