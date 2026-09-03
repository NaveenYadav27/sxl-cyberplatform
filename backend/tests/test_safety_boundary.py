import pytest
from app.execution.authorization_gate import red_gate, SecurityBoundaryViolation

def test_safety_boundary_allowed_ip():
    # 10.10.10.21 is inside 10.10.10.0/24
    assert red_gate.validate_target_safety("10.10.10.21") is True

def test_safety_boundary_blocked_external_ip():
    # 8.8.8.8 or 192.168.1.1 should raise violation
    with pytest.raises(SecurityBoundaryViolation):
        red_gate.validate_target_safety("8.8.8.8")

def test_safety_boundary_blocked_mgmt_ip():
    # Management subnet (192.168.1.50) must not be targetable by Red execution
    with pytest.raises(SecurityBoundaryViolation):
        red_gate.validate_target_safety("192.168.1.50")
