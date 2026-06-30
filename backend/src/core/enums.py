from enum import StrEnum

class UserStatus(StrEnum):
    ACTIVE = "ACTIVE"
    LOCKED = "LOCKED"
    DELETED = "DELETED"
    
class RoleName(StrEnum):
    CUSTOMER = "CUSTOMER"
    SELLER = "SELLER"
    ADMIN = "ADMIN"
    SUPPORTER = "SUPPORTER"