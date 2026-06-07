extends MeshInstance3D
# rk4_witness_orb.gd
# Live curved-geodesic witness orb for the Optical Transport Illusion.
# Uses the GRINFieldSampler's sample_grin_accel() to integrate real(ish) transport.
#
# Drop multiple instances inside inner_pocket_viewport.tscn (or the main InnerPocket).
# They demonstrate light-like particles following GRIN-curved paths inside the pocket.
# Near the "throat" they brighten; when they would be trapped they dim toward black.
#
# TODO (real xPRIMEray integration):
#   - Replace grin_sampler.sample_grin_accel with a call into your MetricHeuristicIntegrator
#     or IMetricField.AccelAt using the live field + proper step policy.
#   - Feed the integrated path into a trail (ImmediateMesh or MultiMesh) for beautiful null geodesics.
#   - Vary mass/charge or use full 4-velocity for null geodesics (light).

@export var grin_sampler: Node
@export var center: Vector3 = Vector3.ZERO
@export var initial_velocity: Vector3 = Vector3(0.6, 0.15, -1.15)
@export var step_size: float = 0.018
@export var max_speed: float = 12.0
@export var trap_distance: float = 0.9

var pos: Vector3
var vel: Vector3
var base_color: Color = Color(0.35, 0.75, 1.0, 1.0)

func _ready() -> void:
	pos = global_position
	vel = initial_velocity

	# Ensure we have a visible emissive material we can modulate
	if material_override == null:
		var mat := StandardMaterial3D.new()
		mat.emission_enabled = true
		mat.emission = base_color
		mat.albedo_color = Color(0.15, 0.4, 0.7)
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material_override = mat

	# Auto-find the GRIN sampler if not wired in the editor
	if grin_sampler == null:
		# Try group first (main scene adds the sampler to "grin_sampler")
		grin_sampler = get_tree().get_first_node_in_group("grin_sampler")
		if grin_sampler == null:
			# Fallback for when the demo is opened standalone
			grin_sampler = get_node_or_null("/root/OpticalTransportIllusion/GRINFieldSampler")
			if grin_sampler == null:
				grin_sampler = get_tree().root.find_child("GRINFieldSampler", true, false)

	if grin_sampler == null:
		push_warning("rk4_witness_orb: No GRINFieldSampler found. Orbs will use straight-line fallback.")

func _process(delta: float) -> void:
	if grin_sampler and grin_sampler.has_method("sample_grin_accel"):
		# Proper 4th-order Runge-Kutta for the system:
		#   dp/dt = v
		#   dv/dt = a(p)   (from GRIN field)
		var dt := step_size

		var k1_v := _get_accel(pos)
		var k1_p := vel

		var k2_v := _get_accel(pos + k1_p * dt * 0.5)
		var k2_p := vel + k1_v * dt * 0.5

		var k3_v := _get_accel(pos + k2_p * dt * 0.5)
		var k3_p := vel + k2_v * dt * 0.5

		var k4_v := _get_accel(pos + k3_p * dt)
		var k4_p := vel + k3_v * dt

		# Weighted average
		var dv := (k1_v + 2.0 * k2_v + 2.0 * k3_v + k4_v) / 6.0 * dt
		var dp := (k1_p + 2.0 * k2_p + 2.0 * k3_p + k4_p) / 6.0 * dt

		vel += dv
		pos += dp
	else:
		# Straight-line fallback so the orb is still visible during development
		pos += vel * delta * 0.6

	# Clamp speed (prevents explosion in strong wells)
	if vel.length() > max_speed:
		vel = vel.normalized() * max_speed

	global_position = pos

	# Visual feedback: brightness + color based on "trapping" vs "bulk bloom"
	_update_visuals()

func _get_accel(p: Vector3) -> Vector3:
	if grin_sampler and grin_sampler.has_method("sample_grin_accel"):
		return grin_sampler.sample_grin_accel(p, center, 1.0)
	return Vector3.ZERO

func _update_visuals() -> void:
	var to_center := pos - center
	var depth := to_center.length()

	# Distance to trap surface (smaller = more trapped)
	var trap_factor := clamp((depth - trap_distance) / 1.8, 0.0, 1.0)

	# Near throat / center we get a bright cyan-blue "photon" look
	# As we approach trap zones we go dark (event horizon analog)
	var brightness := lerp(0.15, 1.1, trap_factor)
	var c := base_color * brightness

	if material_override is StandardMaterial3D:
		var mat := material_override as StandardMaterial3D
		mat.emission = c
		mat.albedo_color = Color(c.r * 0.4, c.g * 0.4, c.b * 0.55, 1.0)

	# Optional: slow spin for visual interest
	rotation.y += 0.8 * get_process_delta_time()

# Helper for the main controller to tell us the current "recursion depth" feel
func set_trap_intensity(intensity: float) -> void:
	trap_distance = lerp(0.6, 1.4, clamp(intensity, 0.0, 1.0))
