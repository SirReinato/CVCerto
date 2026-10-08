-- ==============================================================================
-- CV CERTO - MIGRATION 002_STORAGE_SETUP.SQL
-- Criação dos buckets e políticas de segurança para arquivos PDF
-- ==============================================================================

-- 1. Criação dos Buckets no schema storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('curriculos_originais', 'curriculos_originais', false, 10485760, array['application/pdf']),
  ('curriculos_gerados', 'curriculos_gerados', false, 10485760, array['application/pdf']),
  ('templates_pdf', 'templates_pdf', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Habilitação de RLS no Storage
-- Observação: a tabela storage.objects já possui RLS nativo no Supabase

-- Policy para curriculos_originais: o usuário só manipula a pasta com seu próprio ID
drop policy if exists "originais_owner_access" on storage.objects;
create policy "originais_owner_access" on storage.objects
for all using (
  bucket_id = 'curriculos_originais' 
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'curriculos_originais' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para curriculos_gerados: o usuário só manipula seus PDFs gerados
drop policy if exists "gerados_owner_access" on storage.objects;
create policy "gerados_owner_access" on storage.objects
for all using (
  bucket_id = 'curriculos_gerados' 
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'curriculos_gerados' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para templates_pdf: leitura para autenticados
drop policy if exists "templates_pdf_read" on storage.objects;
create policy "templates_pdf_read" on storage.objects
for select using (
  bucket_id = 'templates_pdf' 
  and auth.role() = 'authenticated'
);
