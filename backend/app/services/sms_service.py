import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("scholarship.sms")

class SMSService:
    """
    Real SMS Gateway Integration Service for DigiLocker / Aadhaar OTP.
    Supports Fast2SMS (Indian Gateway) and Twilio (Global Gateway).
    """

    @classmethod
    def clean_indian_phone(cls, phone: str) -> str:
        """
        Strips non-digits and returns 10-digit Indian mobile number.
        """
        digits = "".join(ch for ch in str(phone) if ch.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            return digits[2:]
        if len(digits) == 11 and digits.startswith("0"):
            return digits[1:]
        return digits[-10:] if len(digits) >= 10 else digits

    @classmethod
    def send_otp_sms(cls, phone_number: str, otp: str) -> Dict[str, Any]:
        """
        Sends genuine OTP SMS to user's physical mobile phone.
        """
        clean_phone = cls.clean_indian_phone(phone_number)
        if len(clean_phone) != 10:
            return {
                "success": False,
                "error": "Invalid Indian mobile number. Must be 10 digits."
            }

        message_text = f"Your DigiLocker / MoTA ST Scholarship verification OTP is {otp}. Valid for 10 minutes. Do not share with anyone."

        if settings.FAST2SMS_API_KEY and settings.FAST2SMS_API_KEY.strip():
            try:
                logger.info(f"Dispatching real SMS to +91 {clean_phone} via Fast2SMS...")
                url = "https://www.fast2sms.com/dev/bulkV2"
                
                payload = json.dumps({
                    "variables_values": otp,
                    "route": "otp",
                    "numbers": clean_phone
                }).encode("utf-8")

                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={
                        "authorization": settings.FAST2SMS_API_KEY.strip(),
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    data = json.loads(res_body)
                    logger.info(f"Fast2SMS OTP API Response: {data}")
                    if data.get("return") is True:
                        return {
                            "success": True,
                            "provider": "fast2sms",
                            "message": f"Real SMS OTP dispatched to +91 ******{clean_phone[-4:]}.",
                            "request_id": data.get("request_id")
                        }

                logger.info("Attempting fallback to Fast2SMS Quick Route 'q'...")
                quick_payload = json.dumps({
                    "route": "q",
                    "message": f"Your MoTA Scholarship DigiLocker OTP is {otp}. Valid for 10 mins.",
                    "language": "english",
                    "flash": 0,
                    "numbers": clean_phone
                }).encode("utf-8")

                quick_req = urllib.request.Request(
                    url,
                    data=quick_payload,
                    headers={
                        "authorization": settings.FAST2SMS_API_KEY.strip(),
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(quick_req, timeout=10) as quick_res:
                    q_body = quick_res.read().decode("utf-8")
                    q_data = json.loads(q_body)
                    logger.info(f"Fast2SMS Quick API Response: {q_data}")
                    if q_data.get("return") is True:
                        return {
                            "success": True,
                            "provider": "fast2sms-quick",
                            "message": f"Real SMS OTP dispatched to +91 ******{clean_phone[-4:]}.",
                            "request_id": q_data.get("request_id")
                        }
                    else:
                        error_msg = q_data.get("message", ["SMS failed"])[0] if isinstance(q_data.get("message"), list) else str(q_data.get("message"))
                        return {"success": False, "provider": "fast2sms", "error": error_msg}

            except urllib.error.HTTPError as e:
                err_resp = e.read().decode("utf-8")
                logger.error(f"Fast2SMS HTTP Error: {err_resp}")
                return {"success": False, "provider": "fast2sms", "error": f"HTTP Error {e.code}: {err_resp}"}
            except Exception as e:
                logger.error(f"Failed to send SMS via Fast2SMS: {e}")
                return {"success": False, "provider": "fast2sms", "error": str(e)}

        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
            try:
                import base64
                logger.info(f"Dispatching real SMS to +91 {clean_phone} via Twilio...")
                account_sid = settings.TWILIO_ACCOUNT_SID.strip()
                auth_token = settings.TWILIO_AUTH_TOKEN.strip()
                from_num = settings.TWILIO_FROM_NUMBER.strip()

                url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                data = urllib.parse.urlencode({
                    "To": f"+91{clean_phone}",
                    "From": from_num,
                    "Body": message_text
                }).encode("utf-8")

                auth_header = base64.b64encode(f"{account_sid}:{auth_token}".encode("ascii")).decode("ascii")

                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={
                        "Authorization": f"Basic {auth_header}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    data = json.loads(res_body)
                    return {
                        "success": True,
                        "provider": "twilio",
                        "message": f"Real SMS OTP dispatched to +91 ******{clean_phone[-4:]}.",
                        "sid": data.get("sid")
                    }

            except Exception as e:
                logger.error(f"Failed to send SMS via Twilio: {e}")
                return {"success": False, "provider": "twilio", "error": str(e)}

        logger.warning(f"No SMS gateway credentials configured in .env. Generated OTP for +91 {clean_phone}: {otp}")
        return {
            "success": False,
            "provider": "none",
            "error": "NO_SMS_KEY_CONFIGURED",
            "message": "Real SMS gateway API key not set in .env. Configure FAST2SMS_API_KEY to send live carrier SMS.",
            "demo_otp": otp
        }
