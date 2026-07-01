import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from src.schemas.user import UserMeResponse


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
    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(min_length=2, max_length=150, alias="fullName")
    email: EmailStr
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128, alias="confirmPassword")

    @model_validator(mode="after")
    def validate_password_confirmation(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Mat khau xac nhan khong khop.")
        return self

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_phone_number(value)


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    identifier: str = Field(description="Email hoặc số điện thoại")
    password: str
    device_name: str | None = Field(default=None, alias="deviceName")


class TokenPairResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="Bearer", serialization_alias="tokenType")
    expires_in: int = Field(serialization_alias="expiresIn")


class AuthSessionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: UserMeResponse
    token_type: str = Field(default="Bearer", serialization_alias="tokenType")
    expires_in: int = Field(serialization_alias="expiresIn")


class AuthVerificationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    user: UserMeResponse


class RegistrationStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    registration_id: str | None = Field(default=None, serialization_alias="registrationId")
    email: str
    phone: str
    email_verified: bool = Field(serialization_alias="emailVerified")
    phone_verified: bool = Field(serialization_alias="phoneVerified")
    completed: bool


class MessageResponse(BaseModel):
    message: str


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(alias="refreshToken")


class LogoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(alias="refreshToken")


class VerifyEmailRequest(BaseModel):
    token: str


class VerifyPhoneRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    registration_id: str | None = Field(default=None, alias="registrationId")
    phone: str
    otp: str

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return validate_phone_number(value)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, value: str) -> str:
        otp = value.strip()
        if not OTP_RE.fullmatch(otp):
            raise ValueError("OTP phai gom 6 chu so.")
        return otp


class ResendEmailVerificationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    registration_id: str | None = Field(default=None, alias="registrationId")
    email: EmailStr | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else None


class ResendPhoneVerificationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    registration_id: str | None = Field(default=None, alias="registrationId")
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        return validate_phone_number(value) if value else None


class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(description="Email hoặc số điện thoại")


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    token: str
    new_password: str = Field(min_length=8, max_length=128, alias="newPassword")


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(min_length=8, max_length=128, alias="newPassword")
