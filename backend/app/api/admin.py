from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument
from app.models.audit import AuditLog
from app.schemas.scheme import ScholarshipSchemeUpdate, ScholarshipSchemeResponse
from app.schemas.verification import AuditLogResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Administrator & Governance"])

@router.get("/schemes", response_model=List[ScholarshipSchemeResponse])
def get_all_schemes_admin(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    schemes = db.query(ScholarshipScheme).all()
    return [ScholarshipSchemeResponse.model_validate(s) for s in schemes]

@router.put("/schemes/{scheme_id}", response_model=ScholarshipSchemeResponse)
def update_scheme_configuration(
    scheme_id: int,
    update_in: ScholarshipSchemeUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    data = update_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(scheme, field, val)

    # Sync rule table if income ceiling or percentage changed
    if update_in.income_ceiling_inr is not None:
        rule = db.query(SchemeRule).filter(
            SchemeRule.scheme_id == scheme.id,
            SchemeRule.rule_code == "INCOME_CEILING_REQ"
        ).first()
        if rule:
            rule.expected_value = str(update_in.income_ceiling_inr)

    if update_in.min_academic_percentage is not None:
        rule = db.query(SchemeRule).filter(
            SchemeRule.scheme_id == scheme.id,
            SchemeRule.rule_code == "ACADEMIC_MIN_SCORE"
        ).first()
        if rule:
            rule.expected_value = str(update_in.min_academic_percentage)

    db.commit()
    db.refresh(scheme)

    log_audit_event(
        db=db,
        action="SCHEME_CONFIG_UPDATED",
        actor_role="admin",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="ScholarshipScheme",
        entity_id=scheme.scheme_code,
        details=data
    )

    return ScholarshipSchemeResponse.model_validate(scheme)

@router.get("/users")
def list_system_users(
    role: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.id.asc()).limit(100).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
            "student_id": u.student_profile.student_id if u.student_profile else None
        } for u in users
    ]

@router.put("/users/{user_id}/toggle-active")
def toggle_user_active_status(
    user_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate own administrator account.")

    user.is_active = not user.is_active
    db.commit()

    log_audit_event(
        db=db,
        action="USER_STATUS_TOGGLED",
        actor_role="admin",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="User",
        entity_id=str(user.id),
        details={"is_active": user.is_active}
    )

    return {"status": "SUCCESS", "is_active": user.is_active}

@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_trail(
    action: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if role:
        query = query.filter(AuditLog.actor_role == role)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]
