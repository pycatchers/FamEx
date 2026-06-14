from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_documents(
        self,
        user_id: UUID,
        family_member_id: Optional[UUID] = None,
        document_type: Optional[str] = None,
    ) -> list[Document]:
        query = select(Document).where(Document.user_id == user_id)
        if family_member_id:
            query = query.where(Document.family_member_id == family_member_id)
        if document_type:
            query = query.where(Document.document_type == document_type)
        query = query.order_by(Document.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_document(self, user_id: UUID, document_id: UUID) -> Document | None:
        result = await self.db.execute(
            select(Document)
            .where(Document.id == document_id, Document.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_document(self, user_id: UUID, data: DocumentCreate) -> Document:
        doc = Document(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def update_document(self, doc: Document, data: DocumentUpdate) -> Document:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(doc, field, value)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def delete_document(self, doc: Document) -> None:
        await self.db.delete(doc)
        await self.db.flush()
