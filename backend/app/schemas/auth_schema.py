import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

PHONE_RE = re.compile(r"^0(3|5|7|8|9)\d{8}$")
OTP_RE = re.compile(r"^\d{6}$")


def normalize_phone_number(value: str) -> str:
    phone = re.sub(r"[\s.\-()]", "", value.strip())
    if phone.startswith("+84"):
        phone = f"0{phone[3:]}"
    elif phone.startswith("84") and len(phone) == 11:
        phone = f"0{phone[2:]}"
    return phone


def validate_phone_number(value: str) -> str:
    phone = normalize_phone_number(value)
    if not PHONE_RE.fullmatch(phone):
        raise ValueError("So dien thoai khong hop le.")
    return phone


class RegisterRequest(BaseModel):
    fullname: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=2, max_length=40)
    email: EmailStr = Field()
    phone: str = Field(min_length=8, max_length=12)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_phone_number(value)

    @model_validator(mode="after")
    def validate_confirm_password(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Mật khẩu xác nhận không khớp.")
        return self


class RegisterResponse(BaseModel):
    fullname: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=2, max_length=40)
    email: EmailStr = Field()
    phone: str = Field(min_length=8, max_length=12)


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=2, description="Username hoặc Email/Số điện thoại"
    )
    password: str = Field(min_length=8, max_length=128)


class LoginReponse(BaseModel):
    access_token: str
    refresh_token: str


class RouterStatusResponse(BaseModel):
    completed: bool


class MessageResponse(BaseModel):
    message: str
