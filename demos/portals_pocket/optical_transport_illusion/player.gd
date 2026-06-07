extends CharacterBody3D
# Simple walkable / flyable camera for Optical Transport Illusion.
# Mouse look + WASD + Space/Ctrl vertical. Shift = faster.
# Toggle noclip (free bulk traversal) with N. Good for exploring the "pocket".

@export var speed: float = 6.0
@export var sprint_multiplier: float = 2.8
@export var mouse_sensitivity: float = 0.0025
@export var vertical_speed: float = 5.0

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var noclip: bool = true  # Start in free-flight mode — perfect for "entering the bulk"

@onready var camera: Camera3D = $Camera3D

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	if camera:
		camera.current = true

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		if camera:
			camera.rotate_x(-event.relative.y * mouse_sensitivity)
			camera.rotation.x = clamp(camera.rotation.x, -PI * 0.48, PI * 0.48)

	if event.is_action_pressed("ui_cancel"):
		if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		else:
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

	if event.is_action_pressed("toggle_noclip"):
		noclip = !noclip
		velocity = Vector3.ZERO
		print("Noclip: ", noclip, " (free bulk traversal)")

func _physics_process(delta: float) -> void:
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	var current_speed := speed
	if Input.is_action_pressed("sprint"):
		current_speed *= sprint_multiplier

	if noclip:
		# Free flight — ideal for walking "through" portals into nested pockets
		var move := Vector3.ZERO
		if direction:
			move += direction * current_speed
		if Input.is_action_pressed("move_up"):
			move.y += vertical_speed
		if Input.is_action_pressed("move_down"):
			move.y -= vertical_speed
		velocity = move
		move_and_slide()
	else:
		# Light grounded mode (for "surface" feel before entering)
		if not is_on_floor():
			velocity.y -= gravity * delta * 0.6
		else:
			velocity.y = 0.0

		if direction:
			velocity.x = direction.x * current_speed
			velocity.z = direction.z * current_speed
		else:
			velocity.x = move_toward(velocity.x, 0, current_speed)
			velocity.z = move_toward(velocity.z, 0, current_speed)

		move_and_slide()

# Action names expected (define in Project Settings > Input Map if you want UI hints):
# move_left, move_right, move_forward, move_back, move_up, move_down, sprint, ui_cancel, toggle_noclip (bind N)
