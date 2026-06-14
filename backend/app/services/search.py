from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.document import Document
from app.models.shop import Shop
from app.models.bill import ShoppingBill
from app.models.purchase import PurchaseItem
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.models.insurance import InsurancePolicy
from app.models.loan import Loan
from app.models.family import FamilyMember
from app.schemas.dashboard import SearchResult, SearchResponse


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(self, user_id: UUID, query: str, limit: int = 30) -> SearchResponse:
        if not query or len(query) < 2:
            return SearchResponse(query=query, results=[], total=0)

        pattern = f"%{query}%"
        results: list[SearchResult] = []

        # Search family members
        family_result = await self.db.execute(
            select(FamilyMember)
            .where(FamilyMember.user_id == user_id)
            .where(FamilyMember.full_name.ilike(pattern))
            .limit(5)
        )
        for member in family_result.scalars().all():
            results.append(SearchResult(
                module="family",
                id=member.id,
                title=member.full_name,
                subtitle=member.relationship,
                match_field="name",
            ))

        # Search documents
        doc_result = await self.db.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .where(
                or_(
                    Document.document_type.ilike(pattern),
                    Document.document_number.ilike(pattern),
                    Document.notes.ilike(pattern),
                )
            )
            .limit(5)
        )
        for doc in doc_result.scalars().all():
            results.append(SearchResult(
                module="document",
                id=doc.id,
                title=doc.document_type,
                subtitle=doc.document_number,
                match_field="type/number",
            ))

        # Search shops
        shop_result = await self.db.execute(
            select(Shop)
            .where(Shop.user_id == user_id)
            .where(or_(Shop.name.ilike(pattern), Shop.category.ilike(pattern)))
            .limit(5)
        )
        for shop in shop_result.scalars().all():
            results.append(SearchResult(
                module="shop",
                id=shop.id,
                title=shop.name,
                subtitle=shop.category,
                match_field="name",
            ))

        # Search purchase items
        item_result = await self.db.execute(
            select(PurchaseItem, ShoppingBill.bill_date)
            .join(ShoppingBill, PurchaseItem.bill_id == ShoppingBill.id)
            .where(ShoppingBill.user_id == user_id)
            .where(PurchaseItem.item_name.ilike(pattern))
            .order_by(ShoppingBill.bill_date.desc())
            .limit(5)
        )
        for row in item_result.all():
            results.append(SearchResult(
                module="shop",
                id=row.PurchaseItem.bill_id,
                title=row.PurchaseItem.item_name,
                subtitle=f"₹{row.PurchaseItem.bought_price} on {row.bill_date}",
                match_field="item",
            ))

        # Search medicines
        med_result = await self.db.execute(
            select(Medicine, Prescription.diagnosis)
            .join(Prescription, Medicine.prescription_id == Prescription.id)
            .where(Prescription.user_id == user_id)
            .where(Medicine.name.ilike(pattern))
            .limit(5)
        )
        for row in med_result.all():
            results.append(SearchResult(
                module="medicine",
                id=row.Medicine.prescription_id,
                title=row.Medicine.name,
                subtitle=row.diagnosis,
                match_field="name",
            ))

        # Search prescriptions by diagnosis
        presc_result = await self.db.execute(
            select(Prescription)
            .where(Prescription.user_id == user_id)
            .where(Prescription.diagnosis.ilike(pattern))
            .limit(5)
        )
        for p in presc_result.scalars().all():
            results.append(SearchResult(
                module="prescription",
                id=p.id,
                title=p.diagnosis or "Prescription",
                subtitle=str(p.prescription_date),
                match_field="diagnosis",
            ))

        # Search insurance policies
        ins_result = await self.db.execute(
            select(InsurancePolicy)
            .where(InsurancePolicy.user_id == user_id)
            .where(
                or_(
                    InsurancePolicy.provider_name.ilike(pattern),
                    InsurancePolicy.policy_number.ilike(pattern),
                    InsurancePolicy.policy_type.ilike(pattern),
                )
            )
            .limit(5)
        )
        for ins in ins_result.scalars().all():
            results.append(SearchResult(
                module="insurance",
                id=ins.id,
                title=f"{ins.provider_name} - {ins.policy_type}",
                subtitle=ins.policy_number,
                match_field="provider/number",
            ))

        # Search loans
        loan_result = await self.db.execute(
            select(Loan)
            .where(Loan.user_id == user_id)
            .where(
                or_(
                    Loan.lender_name.ilike(pattern),
                    Loan.loan_type.ilike(pattern),
                )
            )
            .limit(5)
        )
        for loan in loan_result.scalars().all():
            results.append(SearchResult(
                module="loan",
                id=loan.id,
                title=f"{loan.lender_name} - {loan.loan_type}",
                subtitle=f"₹{loan.principal_amount}",
                match_field="lender/type",
            ))

        return SearchResponse(query=query, results=results[:limit], total=len(results))
