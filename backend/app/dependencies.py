from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.integrations.supabase_auth import verify_supabase_jwt
from app.models.user import User


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Decode the Bearer JWT from the Authorization header, extract the
    ``sub`` claim (Supabase UID), then look up or auto-create the User
    row in the database.  Raises HTTP 401 on any auth failure.
    """
    print("Authorization header:", authorization)
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
        )

    token = authorization.removeprefix("Bearer ").strip()
    payload = await verify_supabase_jwt(token)

    supabase_uid: str | None = payload.get("sub")
    if not supabase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT payload missing 'sub' claim",
        )

    result = await db.execute(
        select(User).where(User.supabase_uid == supabase_uid)
    )
    user = result.scalars().first()

    if user is None:
        email: str | None = payload.get("email")
        user = User(supabase_uid=supabase_uid, email=email)
        db.add(user)
        await db.flush()

    return user
