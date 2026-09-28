import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import Notification

logger = logging.getLogger("scholarship.notifications")

def send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    category: str = "application",
    link: Optional[str] = None
) -> Notification:
    """
    Creates an in-app notification and logs dispatch for SMS/Email gateway mock.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    # Mock SMS/Email dispatch
    logger.info(f"[SMS/Email Dispatch] To User ID {user_id}: '{title}' - '{message}'")
    return notif
