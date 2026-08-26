"""Build the RaptorVR OpenVR render model and 32 px SteamVR status icons.

Run with Blender, for example:
  blender --background --factory-startup --python tools/build-steamvr-model.py -- \
    RaptorVR_1_0_chassis_assembled.glb assets/steamvr-driver/resources
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


def material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    result = bpy.data.materials.new(name)
    result.diffuse_color = color
    result.use_nodes = True
    result.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = color
    result.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.68
    result.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.04
    return result


def set_color(target: bpy.types.Material, color: tuple[float, float, float, float]) -> None:
    target.diffuse_color = color
    target.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = color


def look_at(obj: bpy.types.Object, point: Vector) -> None:
    obj.rotation_euler = (point - obj.location).to_track_quat("-Z", "Y").to_euler()


def main() -> None:
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) < 2:
        raise SystemExit("Expected source GLB and output resources directory")

    source = Path(args[0]).resolve()
    resources = Path(args[1]).resolve()
    font_path = Path(args[2]).resolve() if len(args) > 2 else None
    model_dir = resources / "rendermodels" / "raptorvr_tracker"
    icon_dir = resources / "icons"
    model_dir.mkdir(parents=True, exist_ok=True)
    icon_dir.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))

    model_objects = [
        obj
        for obj in bpy.context.scene.objects
        if obj.type == "MESH" and obj.name in {"case", "separator", "logo_lid"}
    ]
    if {obj.name for obj in model_objects} != {"case", "separator", "logo_lid"}:
        raise RuntimeError("RaptorVR enclosure GLB did not contain the expected meshes")

    bounds = [obj.matrix_world @ Vector(corner) for obj in model_objects for corner in obj.bound_box]
    lower = Vector(min(point[index] for point in bounds) for index in range(3))
    upper = Vector(max(point[index] for point in bounds) for index in range(3))
    center = (lower + upper) / 2
    orient = Matrix.Rotation(math.pi, 4, "X") @ Matrix.Translation(-center)
    for obj in model_objects:
        obj.matrix_world = orient @ obj.matrix_world

    shell = material("RaptorVR_Shell", (0.88, 0.90, 0.92, 1.0))
    lid = material("RaptorVR_Lid", (0.97, 0.98, 0.99, 1.0))
    accent = material("RaptorVR_Accent", (0.035, 0.045, 0.055, 1.0))
    wordmark = material("RaptorVR_Wordmark", (0.015, 0.020, 0.025, 1.0))

    for obj in model_objects:
        obj.data.materials.clear()
        obj.data.materials.append(
            accent if obj.name == "separator" else lid if obj.name == "logo_lid" else shell
        )

    bpy.context.view_layer.update()
    top_y = max(
        (obj.matrix_world @ Vector(corner)).y
        for obj in model_objects
        for corner in obj.bound_box
    )

    text_curve = bpy.data.curves.new("RaptorVR_Wordmark", type="FONT")
    text_curve.body = "RAPTOR VR"
    text_curve.align_x = "CENTER"
    text_curve.align_y = "CENTER"
    text_curve.size = 0.012
    text_curve.extrude = 0.00035
    text_curve.bevel_depth = 0.00006
    text_curve.bevel_resolution = 2
    text_curve.resolution_u = 8
    if font_path and font_path.is_file():
        text_curve.font = bpy.data.fonts.load(str(font_path))

    label = bpy.data.objects.new("RaptorVR_Wordmark", text_curve)
    bpy.context.collection.objects.link(label)
    label.rotation_euler = (math.radians(-90), 0.0, 0.0)
    label.location = (0.0, top_y + 0.0001, 0.0)
    label.data.materials.append(wordmark)
    bpy.context.view_layer.update()
    if label.dimensions.x > 0.065:
        label.scale *= 0.065 / label.dimensions.x

    bpy.ops.object.select_all(action="DESELECT")
    for obj in [*model_objects, label]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = label
    bpy.ops.object.convert(target="MESH")
    label = bpy.context.view_layer.objects.active
    model_objects.append(label)

    bpy.ops.wm.obj_export(
        filepath=str(model_dir / "raptorvr_tracker.obj"),
        export_selected_objects=True,
        export_materials=True,
        export_normals=True,
        export_uv=True,
        apply_modifiers=True,
        apply_transform=True,
        forward_axis="NEGATIVE_Z",
        up_axis="Y",
        path_mode="RELATIVE",
    )

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_percentage = 100
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.025,
        0.030,
        0.040,
        1.0,
    )
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.22

    camera_data = bpy.data.cameras.new("RaptorVR_Icon_Camera")
    camera = bpy.data.objects.new("RaptorVR_Icon_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.115, 0.165, 0.115)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 0.135
    look_at(camera, Vector((0.0, 0.0, 0.0)))
    scene.camera = camera

    key_data = bpy.data.lights.new("RaptorVR_Key", type="AREA")
    key_data.energy = 28
    key_data.shape = "DISK"
    key_data.size = 0.10
    key = bpy.data.objects.new("RaptorVR_Key", key_data)
    bpy.context.collection.objects.link(key)
    key.location = (0.05, 0.16, 0.08)
    look_at(key, Vector((0.0, 0.0, 0.0)))

    fill_data = bpy.data.lights.new("RaptorVR_Fill", type="AREA")
    fill_data.energy = 12
    fill_data.size = 0.12
    fill = bpy.data.objects.new("RaptorVR_Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-0.10, 0.06, -0.05)
    look_at(fill, Vector((0.0, 0.0, 0.0)))

    scene.render.filepath = str(model_dir / "raptorvr_tracker_thumbnail.png")
    bpy.ops.render.render(write_still=True)

    states = {
        "tracker_status_ready.png": (
            (0.88, 0.90, 0.92, 1.0),
            (0.97, 0.98, 0.99, 1.0),
            (0.015, 0.020, 0.025, 1.0),
        ),
        "tracker_status_off.png": (
            (0.15, 0.17, 0.19, 1.0),
            (0.19, 0.21, 0.23, 1.0),
            (0.07, 0.08, 0.09, 1.0),
        ),
        "tracker_status_standby.png": (
            (0.34, 0.37, 0.40, 1.0),
            (0.43, 0.46, 0.49, 1.0),
            (0.12, 0.13, 0.14, 1.0),
        ),
        "tracker_status_standby_alert.png": (
            (0.50, 0.30, 0.07, 1.0),
            (0.72, 0.43, 0.09, 1.0),
            (0.12, 0.07, 0.02, 1.0),
        ),
        "tracker_status_ready_low.png": (
            (0.74, 0.43, 0.07, 1.0),
            (0.98, 0.65, 0.13, 1.0),
            (0.16, 0.09, 0.02, 1.0),
        ),
        "tracker_status_ready_alert.png": (
            (0.62, 0.06, 0.08, 1.0),
            (0.92, 0.12, 0.14, 1.0),
            (0.18, 0.01, 0.02, 1.0),
        ),
        "tracker_status_error.png": (
            (0.62, 0.06, 0.08, 1.0),
            (0.92, 0.12, 0.14, 1.0),
            (0.18, 0.01, 0.02, 1.0),
        ),
    }
    scene.render.resolution_x = 32
    scene.render.resolution_y = 32
    for filename, (shell_color, lid_color, wordmark_color) in states.items():
        set_color(shell, shell_color)
        set_color(lid, lid_color)
        set_color(wordmark, wordmark_color)
        scene.render.filepath = str(icon_dir / filename)
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
