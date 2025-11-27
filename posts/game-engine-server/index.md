---
title: "Building a Networked Game Engine with Entity-Component Architecture"
date: "2024-12-13"
excerpt: "Implementing a RESTful game engine server using the Entity-Component-System pattern, Flask for HTTP control, and VisPy for real-time 3D rendering with thread-safe concurrent operations."
category: "Computer Science"
tags:
  [
    "Game Engine",
    "Entity-Component-System",
    "Flask",
    "3D Graphics",
    "Concurrent Programming",
    "REST API",
  ]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of a networked game engine server that exposes an Entity-Component-System (ECS) architecture through a RESTful API. This project taught me that building a game engine is fundamentally about managing state and orchestrating concurrent operations. The technical challenge lies in coordinating multiple subsystems (rendering, scripting, networking) that all operate on shared state while maintaining thread safety. I learned that the Entity-Component-System pattern elegantly separates data (components) from behavior (systems), making the codebase modular and extensible. The combination of Flask for network control and VisPy for GPU-accelerated rendering proved ideal, letting me focus on the architecture rather than low-level graphics programming. Most importantly, I discovered that thread synchronization is critical when the rendering loop runs on the main thread while HTTP requests arrive asynchronously on worker threads.

Game engines traditionally bundle everything into a monolithic application: the editor, renderer, physics engine, and asset pipeline all in one executable. I wanted to explore a different architecture where the engine core runs as a networked service that clients can control remotely via HTTP. This enables interesting use cases: multiple clients collaborating on the same scene, scripted automation of engine operations, and integration with external tools that speak HTTP. The Entity-Component-System pattern provides the foundation, allowing flexible composition of game objects from reusable components.

The challenge was to build a complete system that handles entity lifecycle management (creation, modification, deletion), component attachment with validation and type safety, 3D mesh rendering with real-time transforms, Python script execution within the engine context, and thread-safe concurrent access from HTTP handlers and the render loop. Each aspect required careful design to maintain correctness and performance.

# Entity-Component-System Architecture

The Entity-Component-System pattern separates traditional object-oriented game objects into three concepts. Entities are simply integer IDs that serve as handles to game objects. They have no data or behavior themselves, just a unique identifier. Components are pure data structures that represent specific attributes: Transform holds position and scale, Renderer references a 3D mesh file, Script points to executable Python code, and CoreProperties stores metadata like name and tags.

I implement entities using the Esper library, a lightweight Python ECS framework. Esper manages the mapping between entity IDs and their associated components, providing efficient queries and storage:

```python
import esper

@dataclass
class Transform:
    position: List[float]
    scale: List[float]

@dataclass
class Renderer:
    file_path: str

@dataclass
class Script:
    script_path: str

@dataclass
class CoreProperties:
    name: str
    tags: List[str]
    target_scene: str
```

Creating an entity is straightforward. The client sends a POST request with entity metadata, and the server creates an entity with a CoreProperties component:

```python
def create_entity(name, target_scene, tags):
    base_entity_component = CoreProperties(
        name=name,
        tags=tags,
        target_scene=target_scene,
    )
    return esper.create_entity(base_entity_component)
```

Esper returns an integer ID that the client uses for all subsequent operations. This ID is persistent until the entity is explicitly deleted. The separation between entity ID and component data means entities are lightweight. Creating thousands of entities has minimal overhead because we're just allocating integers and registering them in Esper's internal bookkeeping.

Components are added dynamically after entity creation. The client specifies the component type and provides the required data:

```python
@flask_app.route("/add_component_to_entity", methods=["POST"])
def add_component_to_entity_endpoint():
    parameters = request.json
    entity_id = parameters.get("entityId")
    component_type = parameters.get("type")
    component_data = parameters.get("data")

    component_types_association = {
        "transform": Transform,
        "script": Script,
        "renderer": Renderer,
    }

    component_class = component_types_association.get(component_type)
    component_data = convert_keys_to_snake_case(component_data)
    component = component_class(**component_data)

    add_component_to_entity(entity_id, component)
    return success_response()
```

The conversion from camelCase to snake_case handles the impedance mismatch between JavaScript naming conventions (used by clients) and Python conventions. The server validates component data before instantiation. For Transform components, I check that position and scale are three-element arrays of numbers, scale values are positive, and values are within reasonable bounds (less than $10^6$ to prevent overflow).

# Thread-Safe Rendering with VisPy

The rendering subsystem uses VisPy, a Python library for interactive scientific visualization built on OpenGL. VisPy provides scene graph management, camera controls, and mesh rendering without requiring low-level OpenGL calls. The key challenge is that VisPy's event loop must run on the main thread (OpenGL requirement), while Flask handles HTTP requests on worker threads. All operations that modify the scene graph must be synchronized.

I use a global lock to protect access to the Esper world state:

```python
world_lock = threading.Lock()
```

Every HTTP endpoint that reads or modifies entities acquires this lock:

```python
@flask_app.route("/create_entity", methods=["POST"])
def create_entity_endpoint():
    parameters = request.json
    name_data = parameters.get("name")
    target_scene_data = parameters.get("targetScene")
    tags_data = parameters.get("tags", [])

    with world_lock:
        entity_id = create_entity(name_data, target_scene_data, tags_data)
        return success_response(data={"entityId": entity_id})
```

The Renderer component handler demonstrates the complexity of cross-thread coordination. When a client attaches a Renderer component, the server must load the 3D mesh file, create a VisPy mesh visual, add it to the scene graph, and register it for updates:

```python
def handle_renderer_component(entity_id, renderer: Renderer):
    file_path = renderer.file_path

    from vispy import io, scene
    from server.configuration import view

    if not os.path.isfile(file_path):
        return error_response(
            reason="File path must point to a valid file",
            status_code=400
        )

    vertices, faces, normals, _ = io.read_mesh(file_path)
    mesh = scene.visuals.Mesh(
        vertices,
        faces,
        normals,
        shading="flat",
        color=(1, 1, 1, 1),
        parent=view.scene,
    )

    from vispy.visuals.transforms import MatrixTransform
    mesh.transform = MatrixTransform()

    with meshes_lock:
        meshes.append({
            "entityId": entity_id,
            "filePath": file_path,
            "meshObject": mesh,
            "toBeTransformed": True,
        })

    with world_lock:
        esper.add_component(entity_id, renderer)
        return success_response()
```

The `meshes` list is a global registry that maps entity IDs to their corresponding VisPy mesh objects. This enables the script system to locate and manipulate meshes at runtime. The `toBeTransformed` flag signals that the mesh needs its transform matrix updated on the next frame.

VisPy loads mesh files using the `io.read_mesh` function, which supports OBJ, FBX, DAE, GLTF, and GLB formats via the Assimp library. The function returns vertices (an $N \times 3$ array of positions), faces (an $M \times 3$ array of triangle indices), and normals (an $N \times 3$ array of surface normals). Creating a Mesh visual from this data is straightforward, but note that the mesh is immediately added to the scene graph by setting `parent=view.scene`. This operation must happen on the main thread, which is why the Flask server runs in a daemon thread while VisPy owns the main thread.

# Dynamic Script Execution

The Script component allows clients to attach executable Python code to entities. This is where the engine becomes truly flexible. Scripts can define `on_load` (called once when the script is attached) and `on_update` (called every frame at 60 FPS) functions. The server dynamically imports the script module and executes these functions in the engine context:

```python
def handle_script_component(entity_id, script: Script):
    script_path = script.script_path
    script_name = os.path.splitext(os.path.basename(script_path))[0]

    spec = importlib.util.spec_from_file_location(script_name, script_path)
    script_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(script_module)

    with world_lock:
        esper.add_component(entity_id, Script(script_path))

    script_info = {}

    if hasattr(script_module, "on_load"):
        script_module.on_load(entity_id)
        script_info = {
            "scriptPath": script_path,
            "scriptModule": script_module
        }

    if hasattr(script_module, "on_update"):
        def on_update(event):
            mesh = next(
                (m for m in meshes if m["entityId"] == entity_id),
                None
            )
            if mesh and mesh["toBeTransformed"]:
                transform = esper.component_for_entity(entity_id, Transform)
                mesh["meshObject"].transform.translate(
                    tuple(transform.position)
                )
                mesh["meshObject"].transform.scale(
                    tuple(transform.scale)
                )
                mesh["toBeTransformed"] = False

            script_module.on_update(event)

        timer = vispy.app.Timer(interval=1/60, connect=on_update, start=True)
        script_info["timer"] = timer
        script_info["entityIds"] = [entity_id]

    with scripts_lock:
        scripts.append(script_info)

    return success_response()
```

The `on_update` wrapper handles transform application before delegating to the script's update function. This ensures that Transform components are synchronized with mesh visuals every frame. The transform application uses VisPy's matrix transform API: `translate` shifts the mesh by the position vector, and `scale` multiplies vertices by the scale vector.

A sample script demonstrates the pattern. This script creates a rotating cube by attaching Transform and Renderer components in `on_load`, then continuously rotating the mesh in `on_update`:

```python
import logging
logger = logging.getLogger(__name__)

import server.api as api
from server.entity_components import *
from server.api import meshes

local_entity_id = None

def on_load(entity_id):
    logger.critical("My custom script has loaded!")
    global local_entity_id
    local_entity_id = entity_id

    transform = Transform(
        position=[1, 2, 0],
        scale=[0.5, 1, 1.5]
    )
    api.add_component_to_entity(entity_id, transform)

    renderer = Renderer(
        file_path="/path/to/cube.obj"
    )
    api.add_component_to_entity(entity_id, renderer)

def on_update(event):
    mesh = next(
        (m for m in meshes if m["entityId"] == local_entity_id),
        None
    )
    if mesh:
        mesh["meshObject"].transform.rotate(0.1, [0, 1, 0])
    else:
        raise Exception(f"Mesh {local_entity_id} not found")
```

The `rotate` method applies a rotation matrix: $0.1$ radians around the $[0, 1, 0]$ axis (Y-axis in VisPy's coordinate system). Since `on_update` is called 60 times per second, this produces smooth rotation at $6$ radians per second, or approximately one full rotation per second.

Scripts have full access to the engine's internals. They can import `server.api` to call functions like `add_component_to_entity`, access global state like the `meshes` registry, and use Esper directly to query components. This power comes with responsibility: poorly written scripts can deadlock the engine or corrupt state. In a production engine, I would sandbox script execution using restricted imports or a separate interpreter instance.

# RESTful API Design

The HTTP API exposes six primary endpoints for engine control. The `/create_entity` endpoint accepts a JSON payload with entity metadata and returns the created entity ID:

```bash
curl -X POST http://localhost:5001/create_entity \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CubeEntity",
    "targetScene": "MainScene",
    "tags": ["cube"]
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "entityId": 1
  },
  "timestamp": "2024-12-13T10:30:00Z"
}
```

The `/add_component_to_entity` endpoint attaches a component to an existing entity. The component type determines the required data fields:

```bash
curl -X POST http://localhost:5001/add_component_to_entity \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": 1,
    "type": "transform",
    "data": {
      "position": [1.0, 2.0, 0.0],
      "scale": [0.5, 1.0, 1.5]
    }
  }'
```

The `/get_entity_components` endpoint retrieves all components for a given entity:

```bash
curl -X GET http://localhost:5001/get_entity_components \
  -H "Content-Type: application/json" \
  -d '{"entityId": 1}'
```

Response:
```json
{
  "status": "success",
  "data": {
    "components": {
      "Transform": {
        "position": [1.0, 2.0, 0.0],
        "scale": [0.5, 1.0, 1.5]
      },
      "Renderer": {
        "filePath": "/path/to/cube.obj"
      },
      "CoreProperties": {
        "name": "CubeEntity",
        "tags": ["cube"],
        "targetScene": "MainScene"
      }
    }
  },
  "timestamp": "2024-12-13T10:31:00Z"
}
```

The `/remove_entity` endpoint deletes an entity and cleans up its associated resources:

```bash
curl -X DELETE http://localhost:5001/remove_entity \
  -H "Content-Type: application/json" \
  -d '{"entityId": 1}'
```

Removal is complex because it must clean up multiple subsystems. The entity is deleted from Esper, meshes are removed from the scene graph and the global registry, script timers are stopped and disconnected, and entity IDs are removed from script tracking lists:

```python
def remove_entity(entity_id):
    global meshes, scripts

    with world_lock:
        if not esper.entity_exists(entity_id):
            raise ValueError(f"Entity {entity_id} not found")
        esper.delete_entity(entity_id)

        with meshes_lock:
            meshes_to_remove = [
                m for m in meshes if m["entityId"] == entity_id
            ]
            for mesh in meshes_to_remove:
                mesh["meshObject"].parent = None
                mesh["meshObject"].transform = MatrixTransform()
            meshes = [
                m for m in meshes if m["entityId"] != entity_id
            ]

        with scripts_lock:
            scripts_to_remove = [
                s for s in scripts if entity_id in s["entityIds"]
            ]
            for script in scripts_to_remove:
                script["timer"].stop()
                script["timer"].disconnect()
                script["entityIds"].remove(entity_id)
            scripts = [
                s for s in scripts if entity_id not in s["entityIds"]
            ]
```

Setting `mesh["meshObject"].parent = None` detaches the mesh from the scene graph, making it invisible and eligible for garbage collection. Resetting the transform to a fresh `MatrixTransform()` ensures no residual state affects future entities.

The `/status` and `/reset` endpoints provide operational control. Status simply confirms the server is responsive, while reset clears all entities and reinitializes the engine state.

# Request Validation and Error Handling

Robust input validation prevents client errors from corrupting engine state. Each component type has a dedicated validation function that checks data types, required fields, and value constraints:

```python
def validate_transform_data(component_data):
    if not isinstance(component_data, dict):
        return False, "Transform data must be an object"

    allowed_fields = {"position", "scale"}
    unexpected_fields = set(component_data.keys()) - allowed_fields
    if unexpected_fields:
        return (
            False,
            f"Unexpected fields: {', '.join(unexpected_fields)}"
        )

    required_fields = ["position", "scale"]
    for field in required_fields:
        if field not in component_data:
            return False, f"Missing required field: {field}"

        value = component_data[field]
        if not isinstance(value, list):
            return False, f"{field} must be an array"
        if len(value) != 3:
            return False, f"{field} must contain exactly 3 values"

        if not all(isinstance(x, (int, float)) for x in value):
            return False, f"All {field} values must be numbers"

        if field == "scale" and any(x <= 0 for x in value):
            return False, "Scale values must be positive"
        if any(abs(x) > 1e6 for x in value):
            return (
                False,
                f"{field} values must be within reasonable range"
            )

    return True, None
```

The validation enforces that transforms are well-formed: position and scale are $3$-element numeric arrays, scale components are strictly positive (negative scale inverts geometry), and all values are less than $10^6$ in magnitude (prevents numerical instability).

Script validation ensures the provided path points to a valid Python file:

```python
def validate_script_data(component_data):
    script_path = component_data.get("scriptPath")
    if not script_path:
        return False, "Script path is required"
    if not isinstance(script_path, str):
        return False, "Script path must be a string"
    if not os.path.isfile(script_path):
        return False, "Script path must point to a valid file"
    if not script_path.endswith(".py"):
        return False, "Script path must have a .py extension"
    return True, None
```

Renderer validation checks that the mesh file exists and has a supported extension:

```python
def validate_renderer_data(component_data):
    file_path = component_data.get("filePath")
    if not file_path:
        return False, "File path is required"
    if not isinstance(file_path, str):
        return False, "File path must be a string"
    if not os.path.isfile(file_path):
        return False, "File path must point to a valid file"

    supported_extensions = [".obj", ".fbx", ".dae", ".gltf", ".glb"]
    if not any(file_path.endswith(ext) for ext in supported_extensions):
        return (
            False,
            f"File must have supported extension: {', '.join(supported_extensions)}"
        )
    return True, None
```

Error responses follow a consistent JSON format with status code, reason, and timestamp:

```python
def error_response(reason, status_code=400):
    response = {
        "status": "error",
        "reason": reason,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    return jsonify(response), status_code
```

The timestamp uses UTC with ISO 8601 formatting, making logs unambiguous across time zones. Success responses mirror this structure:

```python
def success_response(data=None):
    response = {
        "status": "success",
        "data": data or {},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    return jsonify(response), 200
```

# Testing and Automation

I implemented comprehensive tests using Python's unittest framework to verify API correctness. The tests cover invalid input handling, entity lifecycle operations, and concurrent access patterns:

```python
class APITestCase(unittest.TestCase):
    def setUp(self):
        self.app = flask_app.test_client()
        self.app.testing = True
        self.reset_server()

    def test_full_entity_lifecycle(self):
        create_response = self.app.post(
            "/create_entity",
            json={
                "name": "Lifecycle Test",
                "targetScene": "Test Scene",
                "tags": ["test", "lifecycle"],
            },
        )
        self.assertEqual(create_response.status_code, 200)
        entity_id = create_response.get_json()["data"]["entityId"]

        add_component_response = self.app.post(
            "/add_component_to_entity",
            json={
                "entityId": entity_id,
                "type": "transform",
                "data": {
                    "position": [1.0, 2.0, 3.0],
                    "scale": [1.0, 1.0, 1.0],
                },
            },
        )
        self.assertEqual(add_component_response.status_code, 200)

        get_response = self.app.get(
            "/get_entity_components",
            json={"entityId": entity_id}
        )
        self.assertEqual(get_response.status_code, 200)
        entity_data = get_response.get_json()["data"]
        self.assertEqual(
            entity_data["components"]["Transform"]["position"],
            [1.0, 2.0, 3.0]
        )

        remove_response = self.app.delete(
            "/remove_entity",
            json={"entityId": entity_id}
        )
        self.assertEqual(remove_response.status_code, 200)

        get_response_after = self.app.get(
            "/get_entity_components",
            json={"entityId": entity_id}
        )
        self.assertEqual(get_response_after.status_code, 404)
```

This test verifies the complete lifecycle: create an entity, add a transform component, retrieve and verify component data, remove the entity, and confirm it no longer exists.

The Makefile includes a demonstration target that scripts a complete scenario using curl:

```makefile
rotating_cube:
	python -m server.main &
	sleep 2
	curl -X POST http://localhost:5001/create_entity \
	  -H "Content-Type: application/json" \
	  -d '{"name": "CubeEntity", "targetScene": "MainScene", "tags": ["cube"]}'

	curl -X POST http://localhost:5001/add_component_to_entity \
	  -H "Content-Type: application/json" \
	  -d '{"entityId": 1, "type": "script", "data": {"scriptPath": "/path/to/script.py"}}'

	sleep 5
	curl -X DELETE http://localhost:5001/remove_entity \
	  -H "Content-Type: application/json" \
	  -d '{"entityId": 1}'
```

This creates an entity, attaches a script that sets up a rotating cube, waits 5 seconds to observe the rotation, then cleans up by removing the entity. The script remains running in the background throughout.

# Architecture Decisions and Trade-offs

Several design decisions shaped the final architecture. Running Flask in a daemon thread while VisPy owns the main thread is necessary because OpenGL requires main-thread execution on macOS and some Linux configurations. This complicates shutdown: the Flask thread must be daemonized so it terminates when the main thread exits, otherwise the process hangs.

Using global locks for world state is simple but coarse-grained. A more sophisticated approach would use finer-grained locks (per-entity or per-component-type) to allow concurrent operations on different entities. However, this introduces complexity and potential deadlocks if not carefully designed. For this project, the coarse lock is acceptable because HTTP requests are relatively infrequent compared to render frame time.

The script execution model is powerful but unsafe. Scripts run in the same Python interpreter as the engine, with full access to internals. A malicious or buggy script can crash the entire server. Production engines typically sandbox scripts using a restricted API surface, separate process execution, or embedding a sandboxed scripting language (Lua, JavaScript). I accepted this risk for development flexibility.

Storing meshes and scripts in global lists indexed by entity ID is simple but inefficient. Querying requires linear search through the list. A dictionary keyed by entity ID would provide $O(1)$ lookup. I kept the list approach because the number of entities in my test scenarios is small (less than 100), making the linear search negligible. Scaling to thousands of entities would require the dictionary optimization.

The `toBeTransformed` flag is a workaround for coordinating transform updates between HTTP handlers and the render loop. When a Transform component is added or modified, the flag is set. On the next frame, the script's `on_update` wrapper applies the transform and clears the flag. This works but requires careful ordering: the transform must be applied before the script's update logic runs. A more robust solution would use a command queue where HTTP handlers post transform commands, and the render loop consumes them each frame.

# Performance and Scalability

The system achieves acceptable performance for interactive use. Entity creation and component addition take less than $10$ milliseconds on a modern CPU. Mesh rendering performance depends on polygon count: a cube with $12$ triangles renders at 60 FPS trivially, while a model with $100,000$ triangles may drop to $30$-$40$ FPS on integrated graphics. VisPy uses OpenGL for rendering, so performance scales with GPU capability.

The main bottleneck is script execution. Each script with `on_update` runs at 60 FPS, and if update logic is expensive (complex physics, pathfinding), frame rate suffers. I use VisPy's `Timer` class to invoke updates, which provides no CPU time budgeting or prioritization. A production engine would implement frame budget management: allocate a fixed time slice per frame for scripts, and if updates exceed budget, defer them to the next frame or run them at lower frequency.

Memory usage is modest. Esper stores components as Python objects, which have overhead (object header, attribute dictionary). A $10,000$ entity scene with Transform and Renderer components uses approximately $50$ MB of RAM. Mesh data dominates memory: a model with $100,000$ vertices (each $3 \times 4 = 12$ bytes for position) requires $1.2$ MB. Storing $100$ such models would use $120$ MB just for geometry.

Network latency affects interactivity. Each HTTP request incurs round-trip time, which on localhost is sub-millisecond but over LAN or WAN can be tens or hundreds of milliseconds. For real-time control, WebSockets would provide lower latency through persistent connections and bidirectional messaging. I implemented basic WebSocket support using Flask-SocketIO for status queries, demonstrating the pattern:

```python
from flask_socketio import SocketIO, emit

socketio = SocketIO(flask_app, async_mode="eventlet")

@socketio.on("request_status")
def handle_status_request():
    response = {
        "status": "success",
        "data": {},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    emit("status_response", response)
```

Extending this to all operations would enable real-time remote control with minimal latency.

# Lessons Learned

Building this networked game engine reinforced several important lessons about system architecture. First, the Entity-Component-System pattern truly shines for managing complex state. The separation between data (components) and logic (systems/scripts) made adding new component types straightforward. I added the Renderer component late in development, and it required no changes to existing entity or transform code.

Second, thread synchronization is subtle and error-prone. Early versions had race conditions where HTTP handlers would modify the scene graph while VisPy was rendering, causing visual glitches or crashes. Adding the `world_lock` and `meshes_lock` solved this, but required careful analysis to identify all critical sections. Tools like ThreadSanitizer would help detect races automatically.

Third, API design matters for usability. The decision to use camelCase in JSON (matching JavaScript conventions) while internally using snake_case (Python conventions) created translation overhead but improved client experience. The validation layer catches errors early with clear messages, making debugging client code much easier.

Finally, visualization is crucial for debugging game engines. Seeing the 3D scene update in real-time as I issue HTTP commands immediately reveals when transforms are incorrect or meshes fail to load. Without the VisPy visualization, I would be debugging blind, relying solely on logs and API responses.

---

Implementing a networked game engine with Entity-Component-System architecture demonstrates how powerful separation of concerns can be. The ECS pattern provides a flexible foundation for composing game objects, while the RESTful API enables remote control and automation. Bridging these two worlds requires careful attention to threading, state management, and API design, but the result is a satisfying system that can be controlled programmatically and extended with custom scripts. The project serves as a foundation for more complex game engine features, from physics simulation to multi-client synchronization. Understanding how each layer works, from HTTP request handling to OpenGL rendering, provides deep appreciation for the engineering complexity that modern game engines manage.
