from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, SearchResponse
from app.services.dashboard import DashboardService
from app.services.search import SearchService

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DashboardService(db)
    return await service.get_dashboard(current_user.id)


@router.get("/search", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=2, max_length=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SearchService(db)
    return await service.search(current_user.id, q)
