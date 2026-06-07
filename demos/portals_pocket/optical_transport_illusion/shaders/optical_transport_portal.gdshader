shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_opaque, cull_back;

// Holographic Portals & Optical Transport — xPRIMEray v0.1
// (Local copy for self-contained demo project. See top-level shaders/ for canonical.)

uniform sampler2D screen_texture : hint_screen_texture;
uniform float recursion_depth = 4.0;
uniform vec3 wormhole_color : source_color = vec3(0.08, 0.22, 0.95);
uniform float grin_index = 1.65;
uniform float time_scale = 0.8;
uniform float trap_radius_base = 0.09;
uniform float pocket_scale = 1.65;
uniform float shimmer_strength = 0.7;
uniform float alpha_edge = 0.88;

uniform vec3 peacock_a : source_color = vec3(0.05, 0.65, 0.55);
uniform vec3 peacock_b : source_color = vec3(0.55, 0.15, 0.75);

float bee_sigil(vec2 p, float t) {
    vec2 q = abs(p) - vec2(0.22, 0.12);
    float hex = max(q.x, q.y * 0.866 + q.x * 0.5) - 0.18;
    float center = length(p) - 0.055;
    float wing = length(p - vec2(0.0, 0.18 * sin(t * 3.0))) - 0.07;
    float body = max(hex, -center * 0.6);
    float sig = min(min(body, wing), center);
    return sig;
}

void fragment() {
    vec2 uv = SCREEN_UV;
    vec3 view_dir = normalize(vec3(uv - 0.5, -1.0));
    float t = TIME * time_scale;

    float depth = 0.0;
    vec3 color_acc = vec3(0.0);
    float trap_factor = 0.0;

    for (int i = 0; i < int(recursion_depth); i++) {
        float fi = float(i);
        uv = fract(uv * pocket_scale + vec2(sin(t * 0.7 + fi) * 0.06, cos(t * 0.5 + fi * 1.3) * 0.04));
        depth += 0.18;

        float trap_r = trap_radius_base * (1.0 + fi * 0.6);
        float d_to_center = length(uv - 0.5);
        if (d_to_center < trap_r) {
            trap_factor = 1.0 - (d_to_center / trap_r);
            ALBEDO = vec3(0.0);
            ALPHA = 1.0;
            return;
        }

        float pocket_contrib = (1.0 - depth * 0.22) * (0.35 + 0.2 * sin(t + fi * 2.0));
        color_acc += pocket_contrib * 0.25;
    }

    vec3 base = texture(screen_texture, uv).rgb;

    vec2 grin_warp = sin(view_dir.xy * grin_index + t * 0.6) * 0.035;
    uv += grin_warp;

    vec3 color = base * (1.0 - depth * 0.28) + color_acc;

    float core_shimmer = pow(max(0.0, sin(t * 1.8 + depth * 4.0)), 3.0);
    color += wormhole_color * core_shimmer * shimmer_strength;

    float peacock_phase = t * 0.9 + depth * 3.2;
    vec3 peacock = mix(peacock_a, peacock_b, 0.5 + 0.5 * sin(peacock_phase));
    color += peacock * pow(max(0.0, sin(peacock_phase * 1.3)), 5.0) * 0.12 * (1.0 - depth * 0.4);

    float sig = bee_sigil((uv - 0.5) * 2.8, t);
    float sig_mask = 1.0 - smoothstep(-0.01, 0.025, sig);
    color = mix(color, wormhole_color * 1.1, sig_mask * 0.65 * (0.6 + 0.4 * sin(t * 4.0)));

    color = mix(color, color * (0.6 + 0.4 * sin(view_dir.x * 6.0 + t)), 0.08);

    float edge = 1.0 - smoothstep(0.0, 0.35, length(SCREEN_UV - 0.5));
    ALBEDO = color;
    ALPHA = mix(alpha_edge, 0.96, edge * 0.6);
}
