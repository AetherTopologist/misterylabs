shader_type spatial;
render_mode blend_mix, unshaded, depth_draw_opaque, cull_back;

// Holographic Portals & Optical Transport — xPRIMEray (holographic-portals-v0.1+)
// True recursive viewport + shader fractal nesting + GRIN curved transport illusion.
// Public UAP / bulk-boundary / AdS-CFT toy model visual.

uniform sampler2D screen_texture : hint_screen_texture, repeat_enable;

// Recursion & trapping
uniform float recursion_depth : hint_range(1.0, 8.0) = 4.0;
uniform float pocket_scale = 1.618;           // golden ratio for pleasing recursive drift
uniform float trap_radius_base = 0.085;

// GRIN / curved transport (hook for your real modules)
uniform float grin_index : hint_range(1.0, 3.0) = 1.618;
uniform sampler2D grin_field : hint_default_black;  // optional 2D field texture (radial GRIN, wormhole metric, etc.)

// Timing & mythos
uniform float time_scale = 1.0;
uniform vec3 bee_blue : source_color = vec3(0.10, 0.38, 0.92);
uniform float shimmer_strength = 0.75;

// Peacock queen iridescence
uniform vec3 peacock_a : source_color = vec3(0.05, 0.68, 0.58);
uniform vec3 peacock_b : source_color = vec3(0.58, 0.12, 0.78);

// Procedural bee B/q sigil (hex lattice + q-body + wing flutter)
float bee_sigil(vec2 p, float t) {
    vec2 q = abs(p) - vec2(0.22, 0.115);
    float hex = max(q.x, q.y * 0.866 + q.x * 0.5) - 0.175;
    float center = length(p) - 0.052;
    float wing = length(p - vec2(0.0, 0.175 * sin(t * 2.8))) - 0.065;
    float body = max(hex, -center * 0.55);
    return min(min(body, wing), center);
}

// Simple analytic GRIN-style warp (fallback when no grin_field texture is bound)
// Later: replace with real RK4 geodesic step sampled from your curved-ray / FieldSystem.
vec2 apply_grin_warp(vec2 uv, vec3 view_dir, float t, float strength) {
    // Basic gradient-index curvature (Maxwell fish-eye / Gordon metric inspired)
    vec2 warp = sin(uv * strength * 6.28318 + t * 0.7) * 0.028;
    warp += sin(view_dir.xy * strength * 1.3 + t * 1.1) * 0.018;
    return uv + warp;
}

void fragment() {
    vec2 uv = SCREEN_UV;
    vec3 view_dir = normalize(vec3(uv - 0.5, -1.0));
    float t = TIME * time_scale;

    float depth = 0.0;
    bool trapped = false;

    // === Nested recursion (fractal pocket scaling) ===
    // Each iteration simulates one more layer of "deeper bulk".
    // Combined with a real SubViewport texture this gives cheap extra recursion levels.
    for (int i = 0; i < int(recursion_depth); i++) {
        float fi = float(i);
        // Golden-ratio recursive drift (stable, aesthetically pleasing)
        uv = fract(uv * pocket_scale + vec2(
            sin(t + fi * 1.7) * 0.048,
            cos(t * 0.85 + fi) * 0.042
        ));
        depth += 0.22;

        // Ray trapping → event-horizon darkness
        // Rays that remain near center across multiple pocket scales are "lost to the bulk"
        float trap_r = trap_radius_base * (1.0 + fi * 0.65);
        if (length(uv - 0.5) < trap_r) {
            trapped = true;
            break;
        }
    }

    vec3 color;

    if (trapped) {
        // Pure darkness — the visual signature of trapped light (no escape from the bulk)
        color = vec3(0.0);
    } else {
        // Sample the "screen" — this can be a real SubViewport texture (true nested camera view)
        // or the previous frame for pure shader recursion.
        color = texture(screen_texture, uv).rgb;

        // Peacock + bee shimmer on the sampled content
        float sigil = bee_sigil((uv - 0.5) * 2.9, t) * 0.9;
        float sig_mask = 1.0 - smoothstep(-0.008, 0.022, sigil);
        color = mix(color, bee_blue * 1.15, sig_mask * (0.55 + 0.35 * sin(t * 3.6)));

        // Subtle peacock iridescence (only on outer layers)
        float peacock_phase = t * 0.95 + depth * 2.8;
        vec3 peacock = mix(peacock_a, peacock_b, 0.5 + 0.5 * sin(peacock_phase));
        color += peacock * pow(max(0.0, sin(peacock_phase * 1.25)), 4.5) * 0.09 * (1.0 - depth * 0.35);
    }

    // === GRIN curved transport warp ===
    // 1. Try texture-based field if provided (recommended path for real data)
    // 2. Fall back to analytic warp (easy to replace with RK4 samples)
    vec2 grin_uv = uv;
    if (grin_field != null) {
        // Sample a precomputed or live GRIN field (e.g. radial index, wormhole throat, eigenmode)
        vec2 field = texture(grin_field, uv * 0.5 + 0.5).rg * 2.0 - 1.0;
        grin_uv += field * grin_index * 0.035;
    } else {
        grin_uv = apply_grin_warp(uv, view_dir, t, grin_index);
    }
    uv = grin_uv;

    // Re-sample after warp for final transport look (cheap extra depth)
    if (!trapped) {
        color = mix(color, texture(screen_texture, uv).rgb, 0.35);
    }

    // Final micro-curvature + edge fade (ethereal "window into bulk")
    float edge = 1.0 - smoothstep(0.0, 0.38, length(SCREEN_UV - 0.5));
    ALBEDO = color;
    ALPHA = mix(0.88, 0.97, edge * 0.55) - depth * 0.11;
}
