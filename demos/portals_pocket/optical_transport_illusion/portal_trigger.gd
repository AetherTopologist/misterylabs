extends Area3D
# Minimal portal crossing helper. The root script connects to body_entered.
# Expand this later for two-way portal logic, curved transport handoff, etc.

@export var one_shot: bool = true

func _on_body_entered(_body: Node3D) -> void:
	# Logic lives in OpticalTransportIllusion root for now (keeps demo simple).
	# This node exists so you can visually author the trigger volume in the editor.
	pass
