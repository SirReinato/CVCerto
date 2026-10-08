-- ==============================================================================
-- CV CERTO - SEED.SQL
-- Dados iniciais: Template Oficial e Perfil Mestre de Renato de França Lima
-- ==============================================================================

-- 1. Inserção do Template Oficial do Sistema
insert into public.templates (code, name, config, is_active)
values (
  'OFICIAL_RENATO',
  'Template Oficial - Renato de França Lima (Padrão ATS)',
  jsonb_build_object(
    'fontFamily', 'Helvetica',
    'headerColor', '#1E1E1E',
    'textColor', '#222222',
    'marginHorizontal', 40,
    'marginVertical', 32,
    'decorations', true
  ),
  true
)
on conflict do nothing;
