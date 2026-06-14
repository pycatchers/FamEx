class SupabaseStorage:
    """
    Thin wrapper around Supabase Storage.
    Methods are placeholders to be wired up once Supabase credentials
    are available at runtime.
    """

    async def get_upload_url(self, bucket: str, path: str) -> str:
        """
        Return a pre-signed upload URL for the given bucket + path.
        Placeholder implementation — returns an empty string.
        """
        return ""

    async def get_public_url(self, bucket: str, path: str) -> str:
        """
        Return the public URL for an already-uploaded object.
        Placeholder implementation — returns an empty string.
        """
        return ""


supabase_storage = SupabaseStorage()
