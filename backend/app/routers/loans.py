from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.loan import LoanCreate, LoanUpdate, LoanResponse, EMIPaymentResponse, EMIPaymentUpdate
from app.services.loan import LoanService

router = APIRouter(prefix="/api/v1/loans", tags=["loans"])


@router.get("", response_model=list[LoanResponse])
async def list_loans(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    return await service.list_loans(current_user.id, status_filter)


@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    data: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    return await service.create_loan(current_user.id, data)


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    loan = await service.get_loan(current_user.id, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.put("/{loan_id}", response_model=LoanResponse)
async def update_loan(
    loan_id: UUID,
    data: LoanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    loan = await service.get_loan(current_user.id, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return await service.update_loan(loan, data)


@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan(
    loan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    loan = await service.get_loan(current_user.id, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    await service.delete_loan(loan)


@router.get("/{loan_id}/emis", response_model=list[EMIPaymentResponse])
async def get_emi_payments(
    loan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    loan = await service.get_loan(current_user.id, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return await service.get_emi_payments(loan_id)


@router.put("/{loan_id}/emis/{emi_id}", response_model=EMIPaymentResponse)
async def update_emi_payment(
    loan_id: UUID,
    emi_id: UUID,
    data: EMIPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoanService(db)
    emi = await service.update_emi_payment(current_user.id, loan_id, emi_id, data)
    if not emi:
        raise HTTPException(status_code=404, detail="EMI payment not found")
    return emi
