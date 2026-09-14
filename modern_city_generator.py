"""
Procedural modern city generator for Blender 3.6+ / 4.x.

Run from Blender's Scripting workspace or with:
    blender --background --python modern_city_generator.py
"""

import bpy
import math
import random
from mathutils import Vector

random.seed(22)

# ---------- scene helpers ----------
def mat(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        emission_input = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        strength_input = bsdf.inputs.get("Emission Strength")
        if emission_input:
            emission_input.default_value = (*emission, 1)
        if strength_input:
            strength_input.default_value = strength
    return m


def cube(name, loc, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new("Soft architectural edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    o.data.materials.append(material)
    return o


def cyl(name, loc, radius, depth, material, vertices=16, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.data.materials.append(material)
    return o


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.data.materials.append(material)
    return o


def emission_light(loc, color, energy, size=2.0):
    data = bpy.data.lights.new("City glow", "AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new("City glow", data)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    return obj


def text_label(body, loc, size=4.0, color=(0.1, 0.8, 1.0)):
    curve = bpy.data.curves.new("District label", "FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.size = size
    curve.extrude = 0.04
    obj = bpy.data.objects.new(body, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (math.radians(72), 0, 0)
    curve.materials.append(mat("Label", color, emission=color, strength=3.0))
    return obj


# ---------- materials ----------
ASPHALT = mat("Asphalt", (0.018, 0.025, 0.032), roughness=0.82)
SIDEWALK = mat("Sidewalk", (0.28, 0.33, 0.37), roughness=0.78)
CONCRETE = mat("Concrete", (0.36, 0.42, 0.45), metallic=0.15, roughness=0.5)
GLASS = mat("Blue glass", (0.02, 0.22, 0.34), metallic=0.72, roughness=0.12)
WINDOW = mat("Warm windows", (1.0, 0.34, 0.05), emission=(1.0, 0.12, 0.02), strength=4.0)
CYAN = mat("Cyan neon", (0.01, 0.8, 1.0), emission=(0.0, 0.75, 1.0), strength=6.0)
MAGENTA = mat("Magenta neon", (0.95, 0.02, 0.38), emission=(0.95, 0.01, 0.22), strength=5.0)
GREEN = mat("Park grass", (0.04, 0.22, 0.12), roughness=0.95)
TREE = mat("Tree foliage", (0.03, 0.32, 0.15), roughness=0.9)
TRUNK = mat("Tree trunk", (0.16, 0.07, 0.025), roughness=0.95)
WATER = mat("Reflective water", (0.01, 0.2, 0.28), metallic=0.7, roughness=0.08)
WHITE = mat("White", (0.8, 0.9, 0.95), metallic=0.4, roughness=0.25)
RED = mat("Traffic red", (0.7, 0.01, 0.02), emission=(0.5, 0, 0), strength=2.0)
YELLOW = mat("Street lamps", (1.0, 0.55, 0.03), emission=(1.0, 0.3, 0.01), strength=7.0)


# ---------- city elements ----------
def road_network():
    cube("City ground", (0, -0.7, 0), (720, 1, 720), GREEN)
    for x in (-210, -70, 70, 210):
        cube("North-south boulevard", (x, 0, 0), (24, 0.8, 690), ASPHALT)
        for z in range(-320, 321, 28):
            cube("Lane marking", (x, 0.43, z), (0.7, 0.04, 11), WHITE)
    for z in (-210, -70, 70, 210):
        cube("East-west boulevard", (0, 0, z), (690, 0.8, 24), ASPHALT)
        for x in range(-320, 321, 28):
            cube("Lane marking", (x, 0.43, z), (11, 0.04, 0.7), WHITE)
    for x in range(-330, 331, 30):
        cube("Sidewalk", (x, 0.5, 222), (24, 0.45, 4), SIDEWALK, 0.3)
        cube("Sidewalk", (x, 0.5, -222), (24, 0.45, 4), SIDEWALK, 0.3)
    for z in range(-210, 211, 30):
        cube("Sidewalk", (222, 0.5, z), (4, 0.45, 24), SIDEWALK, 0.3)
        cube("Sidewalk", (-222, 0.5, z), (4, 0.45, 24), SIDEWALK, 0.3)


def windows(x, y, z, width, height, depth, rows, cols):
    for r in range(rows):
        for c in range(cols):
            px = x + (c - (cols - 1) / 2) * width / cols
            pz = z + depth / 2 + 0.08
            py = y + 2.0 + r * (height - 4) / max(rows - 1, 1)
            cube("Window", (px, py, pz), (width / cols * 0.58, 1.5, 0.08), WINDOW)


def tower(name, loc, width, depth, height, material=GLASS, floors=16):
    x, _, z = loc
    cube(name, (x, height / 2, z), (width, height, depth), material, 1.2)
    for floor in range(floors):
        y = 3 + floor * (height - 6) / max(floors - 1, 1)
        cube("Tower light band", (x, y, z + depth / 2 + 0.12), (width * 0.92, 0.22, 0.1), CYAN)
    windows(x, 0, z, width, height, depth, max(4, floors // 2), 5)
    return x, height, z


def landmark_cluster():
    tower("Apex Tower", (0, 0, 0), 42, 34, 190, GLASS, 32)
    cyl("Apex spire", (0, 214, 0), 3.0, 48, CYAN, 12)
    tower("Twin tower east", (58, 0, 8), 30, 28, 132, WHITE, 22)
    tower("Twin tower west", (92, 0, 8), 30, 28, 132, WHITE, 22)
    cube("Sky bridge", (75, 72, 8), (48, 5, 8), CYAN, 1.0)
    tower("Financial tower", (-62, 0, 25), 32, 32, 155, CONCRETE, 25)
    tower("Aurora tower", (130, 0, -35), 34, 34, 175, GLASS, 28)
    cyl("Aurora crown", (130, 188, -35), 15, 18, MAGENTA, 6, (1, 0.35, 1))
    tower("Harbor tower", (-125, 0, -110), 38, 38, 110, CONCRETE, 18)


def park_and_lake():
    cube("Central botanical park", (-115, 0.05, 125), (105, 0.25, 82), GREEN)
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=28, depth=0.4, location=(-115, 0.3, 125))
    bpy.context.object.data.materials.append(WATER)
    for i in range(45):
        x = -160 + random.random() * 90
        z = 90 + random.random() * 70
        cyl("Park tree trunk", (x, 4, z), 0.7, 8, TRUNK, 10)
        sphere("Park tree crown", (x, 10, z), 4.5, TREE, (1.2, 0.8, 1.2))
    for a in range(0, 360, 30):
        rad = math.radians(a)
        emission_light((-115 + math.cos(rad) * 31, 3, 125 + math.sin(rad) * 31), (0.1, 0.7, 1), 280, 2)
    text_label("BOTANICAL PARK", (-115, 4, 165), 3.5, (0.2, 1, 0.7))


def street_furniture():
    for x in range(-300, 301, 60):
        for z in (-230, 230):
            cyl("Street lamp", (x, 7, z), 0.35, 14, CONCRETE, 10)
            sphere("Lamp glow", (x, 14.5, z), 0.8, YELLOW)
            emission_light((x, 14.5, z), (1.0, 0.3, 0.03), 160, 4)
    for z in range(-170, 171, 68):
        for x in (-230, 230):
            cyl("Street lamp", (x, 7, z), 0.35, 14, CONCRETE, 10)
            sphere("Lamp glow", (x, 14.5, z), 0.8, YELLOW)


def cars():
    colors = [RED, CYAN, WHITE, MAGENTA, YELLOW]
    for i in range(24):
        x = random.choice([-210, -70, 70, 210])
        z = random.uniform(-320, 320)
        cube("Autonomous car", (x + random.choice([-4, 4]), 1.1, z), (3.4, 1.4, 7), colors[i % len(colors)], 0.35)
        cube("Car glass", (x + random.choice([-4, 4]), 2.0, z - 0.2), (2.5, 0.8, 2.7), GLASS, 0.2)
        for side in (-1, 1):
            cube("Headlight", (x + random.choice([-4, 4]) + side * 1.1, 1.2, z + 3.55), (0.35, 0.25, 0.12), WHITE)


def sky_and_camera():
    world = bpy.context.scene.world or bpy.data.worlds.new("Night city world")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.008, 0.025, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18
    emission_light((0, 260, 80), (0.1, 0.25, 1.0), 2600, 180)
    bpy.ops.object.camera_add(location=(390, 285, 430))
    cam = bpy.context.object
    bpy.context.scene.camera = cam
    direction = Vector((0, 65, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 48


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {
        item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
    } else "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 820
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = "//modern_city.png"
    scene.render.film_transparent = False
    available_looks = {item.name for item in scene.view_settings.bl_rna.properties["look"].enum_items}
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        if look in available_looks:
            scene.view_settings.look = look
            break


def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    road_network()
    landmark_cluster()
    park_and_lake()
    street_furniture()
    cars()
    sky_and_camera()
    configure_render()
    bpy.ops.wm.save_as_mainfile(filepath="//modern_city.blend")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    build()
