from enum import Enum
from typing import List, Set
from fastapi import HTTPException, status

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    RED_OPERATOR = "RED_OPERATOR"
    BLUE_ANALYST = "BLUE_ANALYST"
    STUDENT = "STUDENT"
    VIEWER = "VIEWER"

# Permission matrices
PERMISSIONS = {
    UserRole.ADMIN: {"read", "write", "execute_red", "configure_connectors", "configure_network", "manage_users", "purge_data"},
    UserRole.INSTRUCTOR: {"read", "write", "execute_red", "configure_connectors", "manage_cases"},
    UserRole.RED_OPERATOR: {"read", "execute_red", "view_purple"},
    UserRole.BLUE_ANALYST: {"read", "write_cases", "manage_detections", "view_purple"},
    UserRole.STUDENT: {"read", "write_cases", "view_purple"},
    UserRole.VIEWER: {"read"},
}

def verify_permission(user_role: str, required_permission: str) -> bool:
    try:
        role = UserRole(user_role)
        perms = PERMISSIONS.get(role, set())
        return required_permission in perms
    except Exception:
        return False

def require_permission(required_permission: str):
    def dependency(user_role: str):
        if not verify_permission(user_role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: '{required_permission}' required for role '{user_role}'"
            )
        return True
    return dependency
