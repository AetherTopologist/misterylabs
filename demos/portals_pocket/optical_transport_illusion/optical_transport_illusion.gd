extends Node3D
# Optical Transport Illusion — Root controller (v0.1+ with real SubViewport recursion)
#
# Features:
# - Wires the optical portal shader
# - Sets up SubViewport + screen_texture for true nested camera rendering
# - Drives the pocket camera transform for "looking through the portal"
# - Wires the GRIN field sampler texture into the shader (grin_field uniform)
# - Bulk reveal + simple crossing nudge (expand with real portal math later)
# - Clear hooks for RK4 / curved-ray integrator integration

@export var portal_path: NodePath = ^"PortalFrame"
@export var inner_pocket_path: NodePath = ^"InnerPocket"
@export var portal_area_path: NodePath = ^"PortalArea"
@export var player_path: NodePath = ^"Player"
@export var sub_viewport_path: NodePath = ^"PortalFrame/SubViewport"
@export var pocket_camera_path: NodePath = ^"PortalFrame/SubViewport/InnerPocketViewportRoot/PocketCamera"

# Optional: path to the standalone inner pocket scene (instanced inside the SubViewport)
@export_file("*.tscn") var inner_pocket_scene: String = "res://inner_pocket_viewport.tscn"

var shader_mat: ShaderMaterial
var crossed: bool = false
var sub_viewport: SubViewport
var pocket_camera: Camera3D
var player: CharacterBody3D
var player_camera: Camera3D

# GRIN sampler (visual stub — replace with real FieldSystem/RK4 data)
var grin_sampler: Node

func _ready() -> void:
	_setup_portal_material()
	_setup_grin_field()
	_setup_sub_viewport()
	_setup_portal_trigger()

	print("Optical Transport Illusion v0.1+ ready.")
	print("Noclip (N) starts enabled — fly straight through the frame to experience the bulk.")
	print("SubViewport recursion + GRIN field + live RK4 orbs are active.")
	print("Call create_optical_dolly_animation() from the console or a button to generate the 20s export path.")

func _setup_portal_material() -> void:
	var portal := get_node_or_null(portal_path) as MeshInstance3D
	if portal == null:
		push_warning("PortalFrame not found")
		return

	var shader := load("res://shaders/optical_transport_portal.gdshader") as Shader
	if shader == null:
		shader = load("res://shaders/optical_transport_portal.gdshader") as Shader
		if shader == null:
			push_warning("Could not load optical_transport_portal.gdshader")
			return

	shader_mat = ShaderMaterial.new()
	shader_mat.shader = shader

	# Base params (tweak in real time via Remote tab or add UI)
	shader_mat.set_shader_parameter("recursion_depth", 3.8)
	shader_mat.set_shader_parameter("grin_index", 1.65)
	shader_mat.set_shader_parameter("bee_blue", Color(0.10, 0.38, 0.92))
	shader_mat.set_shader_parameter("shimmer_strength", 0.82)
	shader_mat.set_shader_parameter("pocket_scale", 1.618)

	portal.material_override = shader_mat

func _setup_grin_field() -> void:
	# Instantiate the sampler (it generates the texture in its _ready)
	grin_sampler = load("res://grin_field_sampler.gd").new()
	add_child(grin_sampler)
	grin_sampler.add_to_group("grin_sampler")   # so RK4 orbs can auto-discover it

	# After one frame the texture will be ready — we wire it in _process the first time
	# or we can call a deferred setup.
	call_deferred("_wire_grin_texture")

func _wire_grin_texture() -> void:
	if grin_sampler and grin_sampler.has_method("get") and shader_mat:
		var tex = grin_sampler.grin_texture
		if tex:
			shader_mat.set_shader_parameter("grin_field", tex)
			print("GRIN field texture wired to portal shader.")

func _setup_sub_viewport() -> void:
	var portal := get_node_or_null(portal_path) as MeshInstance3D
	sub_viewport = get_node_or_null(sub_viewport_path) as SubViewport

	if sub_viewport == null:
		# Create on the fly if the scene wasn't authored with it (fallback for editor paste)
		sub_viewport = SubViewport.new()
		sub_viewport.name = "SubViewport"
		sub_viewport.size = Vector2i(640, 640)
		sub_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		sub_viewport.handle_input_locally = false
		sub_viewport.transparent_bg = true
		portal.add_child(sub_viewport)
		print("SubViewport created dynamically under PortalFrame.")

	# Try to find or create the pocket camera and world
	pocket_camera = get_node_or_null(pocket_camera_path) as Camera3D
	if pocket_camera == null and sub_viewport:
		# Try to instance the richer pocket scene
		if ResourceLoader.exists(inner_pocket_scene):
			var pocket_world := load(inner_pocket_scene).instantiate()
			sub_viewport.add_child(pocket_world)
			pocket_camera = pocket_world.find_child("PocketCamera", true, false) as Camera3D
			print("Instanced inner_pocket_viewport.tscn inside SubViewport.")
		else:
			# Minimal fallback camera + geometry
			var world := Node3D.new()
			world.name = "PocketWorldFallback"
			sub_viewport.add_child(world)

			pocket_camera = Camera3D.new()
			pocket_camera.name = "PocketCamera"
			pocket_camera.transform.origin = Vector3(0, 2.0, 2.5)
			world.add_child(pocket_camera)

			var pillar := MeshInstance3D.new()
			pillar.mesh = BoxMesh.new()
			pillar.mesh.size = Vector3(0.3, 3.5, 0.3)
			pillar.position = Vector3(0, 1.7, -2.8)
			world.add_child(pillar)

			print("Created minimal fallback pocket camera + geometry.")

	player = get_node_or_null(player_path) as CharacterBody3D
	if player:
		player_camera = player.find_child("Camera3D", true, false) as Camera3D

	# Assign the viewport texture to the shader (this is the real recursive view)
	if sub_viewport and shader_mat:
		var vp_tex := sub_viewport.get_texture()
		shader_mat.set_shader_parameter("screen_texture", vp_tex)
		print("screen_texture wired from live SubViewport (true nested rendering active).")

func _setup_portal_trigger() -> void:
	var area := get_node_or_null(portal_area_path) as Area3D
	if area:
		if not area.body_entered.is_connected(_on_portal_crossed):
			area.body_entered.connect(_on_portal_crossed)

func _process(_delta: float) -> void:
	_update_pocket_camera()

func _update_pocket_camera() -> void:
	if not sub_viewport or not pocket_camera or not player_camera:
		return

	var portal := get_node_or_null(portal_path) as MeshInstance3D
	if portal == null:
		return

	var dist := player.global_position.distance_to(portal.global_position)

	# When the player is close to the portal, sync the pocket camera so the
	# viewport texture shows the "view from inside the bulk".
	# This is the classic portal camera trick (simplified for the illusion).
	if dist < 4.5:
		# Compute a transform that makes the pocket camera "see what you would
		# see if you were standing on the other side of the portal plane".
		# For a strong "enter the bulk" feeling we offset it deeper.
		var portal_xform := portal.global_transform
		var player_xform := player_camera.global_transform

		# Relative player pose from the portal
		var local_player := portal_xform.affine_inverse() * player_xform

		# Place the pocket camera on the "far" side, looking back toward the entrance
		# (flip Z so it looks into the pocket instead of back at the player)
		var pocket_offset := Transform3D(
			local_player.basis.rotated(Vector3(0, 1, 0), PI),   # 180° yaw flip for "through the glass"
			Vector3(0, 1.6, -3.8)                               # deeper inside the pocket
		)

		var target_xform := portal_xform * pocket_offset
		pocket_camera.global_transform = target_xform

		# Gentle pulse on the visible InnerPocket (the "real" geometry after crossing)
		var pocket := get_node_or_null(inner_pocket_path) as Node3D
		if pocket and pocket.visible:
			var pulse := 1.0 + sin(Time.get_ticks_msec() / 420.0) * 0.065
			pocket.scale = Vector3.ONE * pulse

	# Optional: very close → stronger recursion feel (increase shader depth)
	if shader_mat and dist < 2.2:
		shader_mat.set_shader_parameter("recursion_depth", 5.0)
	elif shader_mat:
		shader_mat.set_shader_parameter("recursion_depth", 3.8)

func _on_portal_crossed(body: Node3D) -> void:
	if crossed or not (body is CharacterBody3D):
		return
	crossed = true

	var pocket := get_node_or_null(inner_pocket_path) as Node3D
	if pocket:
		pocket.visible = true
		var tween := create_tween()
		tween.tween_property(pocket, "scale", Vector3.ONE * 1.12, 0.55).set_trans(Tween.TRANS_SINE)
		tween.tween_property(pocket, "scale", Vector3.ONE, 1.6).set_trans(Tween.TRANS_SINE)

	# "Teleport" the player a bit deeper into the pocket space.
	# In a real portal system you would maintain velocity continuity and
	# possibly switch which world the player physically inhabits.
	if body.has_method("set_global_position"):
		var forward := -body.global_transform.basis.z
		body.global_position += forward * 2.4 + Vector3(0, 0.4, 0)

	print("Crossed the optical boundary into the bulk. (SubViewport recursion + GRIN active)")
	# === RK4 / GRIN INTEGRATOR HOOK ===
	# Here you would:
	#   - Take the player's velocity
	#   - Feed it into your MetricHeuristicIntegrator / RK4 stepper with the current GRIN field
	#   - Drive secondary visual elements (orbs, particles, a "photon" trail) using the real curved geodesics
	#   - Optionally update the grin_field texture from live field data
	#
	# Example future call:
	#   curved_ray_system.integrate_path(player.global_position, player_velocity, grin_field_sampler)

	# Sync RK4 orbs (they live inside the SubViewport world)
	_sync_rk4_orbs(dist)

func _sync_rk4_orbs(dist_to_portal: float) -> void:
	# Find orbs inside the inner pocket viewport world and modulate their "trap feel"
	if not sub_viewport:
		return

	var orbs := sub_viewport.find_children("*", "MeshInstance3D", true, false)
	var intensity := clamp(1.0 - (dist_to_portal / 5.0), 0.0, 1.0)

	for node in orbs:
		if node.has_method("set_trap_intensity"):
			node.set_trap_intensity(intensity * 0.7 + (0.3 if crossed else 0.0))

# === Camera Dolly + Export Helper ============================================
@onready var anim_player: AnimationPlayer = $AnimationPlayer

func _ensure_animation_player() -> void:
	if not has_node("AnimationPlayer"):
		var ap := AnimationPlayer.new()
		ap.name = "AnimationPlayer"
		add_child(ap)
		anim_player = ap

func create_optical_dolly_animation() -> void:
	"""Creates a 20-second cinematic approach → cross → deep bulk orbit animation.
	Attach this to a dedicated DollyCamera or animate the Player transform for export.
	Call once (or from an editor tool button) then save the resulting .tres."""
	_ensure_animation_player()

	var anim := Animation.new()
	anim.length = 20.0
	anim.step = 0.05

	# Example tracks for the main Player (or create a separate DollyCamera3D)
	# In practice it's often cleaner to drive a Path3D + PathFollow3D in the editor,
	# then use this as a starting point or reference.
	var track_idx := anim.add_track(Animation.TYPE_VALUE)
	anim.track_set_path(track_idx, "Player:global_position")

	# Keyframes: outside → approach → threshold → deep into bulk → slow orbit + bloom
	anim.track_insert_key(track_idx, 0.0,  Vector3(0, 1.7, 7.5))
	anim.track_insert_key(track_idx, 4.5,  Vector3(0.2, 1.9, 1.8))
	anim.track_insert_key(track_idx, 7.0,  Vector3(0.1, 2.1, -0.6))   # crossing
	anim.track_insert_key(track_idx, 10.5, Vector3(-1.2, 2.8, -4.8))
	anim.track_insert_key(track_idx, 15.0, Vector3(2.4, 3.6, -7.5))
	anim.track_insert_key(track_idx, 19.0, Vector3(0.8, 2.4, -6.2))

	# Rotation track (look toward the portal then arc inside)
	var rot_track := anim.add_track(Animation.TYPE_VALUE)
	anim.track_set_path(rot_track, "Player/Camera3D:rotation")
	anim.track_insert_key(rot_track, 0.0,  Vector3(-0.12, 0.0, 0.0))
	anim.track_insert_key(rot_track, 6.0,  Vector3(-0.08, 0.0, 0.0))
	anim.track_insert_key(rot_track, 9.0,  Vector3(0.15, 2.8, 0.0))
	anim.track_insert_key(rot_track, 14.0, Vector3(0.35, -1.9, 0.0))
	anim.track_insert_key(rot_track, 19.0, Vector3(0.22, 0.6, 0.0))

	# Optional: drive recursion_depth on the shader for a "deeper bloom" moment
	if shader_mat:
		var depth_track := anim.add_track(Animation.TYPE_VALUE)
		anim.track_set_path(depth_track, ".:shader_mat:shader_parameter/recursion_depth") # pseudo-track, real version uses set_shader_parameter via method track
		# For a real export you would use a method call track or AnimationPlayer calling a function on the root.

	anim_player.add_animation("optical_dolly_20s", anim)
	print("Created 'optical_dolly_20s' animation (20s approach → cross → bulk orbit).")
	print("Save it: ResourceSaver.save(anim_player.get_animation('optical_dolly_20s'), 'res://optical_dolly.tres')")

	# For headless / Movie Maker export instructions see the README.
