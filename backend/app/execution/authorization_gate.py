import ipaddress
from typing import Dict, Any
from fastapi import HTTPException, status
from app.config import settings

class SecurityBoundaryViolation(Exception):
    pass

class RedAuthorizationGate:
    """
    6-Stage Red Team Execution Authorization Gate:
    1. User Request
    2. RBAC check (ADMIN, INSTRUCTOR, RED_OPERATOR)
    3. Target asset presence
    4. Lab Network CIDR safety boundary check
    5. Explicit operator confirmation
    6. Dispatch with immutable action_id
    """
    
    @staticmethod
    def validate_target_safety(target_ip: str) -> bool:
        """Enforce strict isolation to the configured eth1 Lab CIDR."""
        try:
            target_addr = ipaddress.ip_address(target_ip)
            lab_network = ipaddress.ip_network(settings.LAB_CIDR, strict=False)
            if target_addr not in lab_network:
                raise SecurityBoundaryViolation(
                    f"SAFETY BOUNDARY VIOLATION: Target IP {target_ip} is outside authorized Lab CIDR {settings.LAB_CIDR} on {settings.LAB_INTERFACE}"
                )
            return True
        except ValueError as e:
            raise SecurityBoundaryViolation(f"Invalid target IP address: {target_ip}") from e

    @staticmethod
    def authorize_execution(user_role: str, target_ip: str, operator_confirmed: bool) -> bool:
        # RBAC Check
        if user_role not in ["ADMIN", "INSTRUCTOR", "RED_OPERATOR"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorized to execute Red Team exercises."
            )
            
        # Target Safety Boundary Check
        RedAuthorizationGate.validate_target_safety(target_ip)
        
        # Explicit Operator Confirmation Check
        if not operator_confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Explicit operator confirmation is required prior to executing Red actions on the target VM."
            )
            
        return True

red_gate = RedAuthorizationGate()
