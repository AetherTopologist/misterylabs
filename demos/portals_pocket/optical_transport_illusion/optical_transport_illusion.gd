extends Node3D
# Optical Transport Illusion — Root script (v0.1)
# Wires the custom portal shader, handles simple "cross into bulk" reveal,
# and provides hooks for later RK4/GRIN integrator integration.

@export var portal_path: NodePath = ^"PortalFrame"
@export var inner_pocket_path: NodePath = ^"InnerPocket"
@export var portal_area_path: NodePath = ^"PortalArea"

var shader_mat: ShaderMaterial
var crossed: bool = false

func _ready() -> void:
	_setup_portal_material()
	_setup_portal_trigger()
	print("Optical Transport Illusion ready. Noclip starts ON (N to toggle). Walk/fly into the portal frame.")

func _setup_portal_material() -> void:
	var portal := get_node_or_null(portal_path) as MeshInstance3D
	if portal == null:
		push_warning("PortalFrame not found — assign a MeshInstance3D and give it a PlaneMesh or Quad.")
		return

	var shader := load("res://shaders/optical_transport_portal.gdshader") as Shader
	if shader == null:
		# Fallback: try local copy if opened as standalone project
		shader = load("res://shaders/optical_transport_portal.gdshader") as Shader
		if shader == null:
			push_warning("Could not load optical_transport_portal.gdshader")
			return

	shader_mat = ShaderMaterial.new()
	shader_mat.shader = shader

	# Sensible starting parameters (tweak live in inspector or add UI later)
	shader_mat.set_shader_parameter("recursion_depth", 3.5)
	shader_mat.set_shader_parameter("grin_index", 1.72)
	shader_mat.set_shader_parameter("wormhole_color", Color(0.08, 0.24, 0.92))
	shader_mat.set_shader_parameter("shimmer_strength", 0.85)
	shader_mat.set_shader_parameter("pocket_scale", 1.58)
	shader_mat.set_shader_parameter("trap_radius_base", 0.095)

	portal.material_override = shader_mat
	print("Portal shader material applied. (bee B/q + peacock recursion)")

func _setup_portal_trigger() -> void:
	var area := get_node_or_null(portal_area_path) as Area3D
	if area:
		if not area.body_entered.is_connected(_on_portal_crossed):
			area.body_entered.connect(_on_portal_crossed)

func _on_portal_crossed(body: Node3D) -> void:
	if crossed or not (body is CharacterBody3D):
		return
	crossed = true

	var pocket := get_node_or_null(inner_pocket_path) as Node3D
	if pocket:
		# "Bulk reveal": make the nested pocket geometry visible / bloom
		pocket.visible = true
		# Gentle scale pulse to sell the "deeper structure emerges"
		var tween := create_tween()
		tween.tween_property(pocket, "scale", Vector3(1.0, 1.0, 1.0) * 1.08, 0.6).set_trans(Tween.TRANS_SINE)
		tween.tween_property(pocket, "scale", Vector3.ONE, 1.4).set_trans(Tween.TRANS_SINE)

	# Optional: light "teleport nudge" into the pocket feel
	# (Real version would maintain continuity or use proper portal math)
	if body.has_method("set_global_position"):
		var forward := -body.global_transform.basis.z
		body.global_position += forward * 1.8 + Vector3(0, 0.3, 0)

	print("Crossed the optical boundary. Bulk structure emerging. (AdS/CFT toy moment)")
	# Hook for future: feed player velocity into a GRIN/RK4 integrator here
	# and drive secondary camera or SDF inside the pocket.
