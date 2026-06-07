extends Node
# GRIN Field Sampler — xPRIMEray Optical Transport Illusion
#
# Generates a simple 2D gradient-index (GRIN) field texture at runtime.
# This is a VISUAL / INTUITION stub.
#
# Real integration path:
#   - Replace generate_grin_texture() with a render of your actual FieldSystem / eigenmode / Gordon metric.
#   - Or sample your RK4 / MetricHeuristicIntegrator live for probe rays and bake a low-res field.
#   - Feed the result into the portal shader's "grin_field" uniform.
#
# The current implementation creates a pleasing radial + throat profile reminiscent of
# Maxwell fish-eye, wormhole AdS-like, or atomic-orbital GRIN wells.

@export var texture_size: int = 512
@export var throat_strength: float = 0.85
@export var radial_falloff: float = 1.6

var grin_texture: ImageTexture

func _ready() -> void:
	grin_texture = generate_grin_texture()
	print("GRIN field texture generated (", texture_size, "x", texture_size, ").",
		" Hook this into your real curved-ray modules for authentic transport.")

func generate_grin_texture() -> ImageTexture:
	var img := Image.create(texture_size, texture_size, false, Image.FORMAT_RGBA8)
	var half := texture_size * 0.5

	for y in texture_size:
		for x in texture_size:
			var uv := Vector2(x, y) / float(texture_size)
			var centered := (Vector2(x, y) - Vector2(half, half)) / half

			# Radial GRIN well (higher index near center = stronger bending)
			var r := centered.length()
			var radial := 1.0 - pow(clamp(r * radial_falloff, 0.0, 1.0), 1.8)

			# Wormhole throat / ring structure (extra curvature band)
			var throat := exp(-pow((r - 0.45) / 0.22, 2.0)) * throat_strength

			# Combine + slight asymmetry for "bulk" feel
			var field_val := clamp(radial * 0.65 + throat * 0.9, 0.0, 1.0)

			# Encode as RG (you can use more channels for full metric later)
			var r_enc := field_val
			var g_enc := clamp(throat * 1.2 - radial * 0.3, 0.0, 1.0)  # throat emphasis

			img.set_pixel(x, y, Color(r_enc, g_enc, 0.0, 1.0))

	var tex := ImageTexture.create_from_image(img)
	return tex

# Math-only sampler you can call from GDScript for a few probe rays
# (useful for future RK4-driven orb movement or debug rays).
func sample_grin_accel(world_pos: Vector3, center: Vector3, strength: float = 1.0) -> Vector3:
	var delta := (world_pos - center)
	var r := delta.length()
	if r < 0.0001:
		return Vector3.ZERO

	var radial := 1.0 - pow(clamp(r * radial_falloff * 0.6, 0.0, 1.0), 1.7)
	var throat := exp(-pow((r - 0.9) / 0.6, 2.0)) * throat_strength * 0.7

	var accel_mag := (radial * 0.6 + throat) * strength * 0.8
	return -delta.normalized() * accel_mag   # inward pull (attractive GRIN well)

# TODO for real xPRIMEray integration:
#   - Accept a FieldSource3D / FieldSystem reference.
#   - Call AccelAt() from your IMetricField / MetricHeuristicIntegrator.
#   - Bake or update the texture every N frames from the live field state.
#   - Drive secondary camera rays or particle "photons" with the true RK4 stepper.
