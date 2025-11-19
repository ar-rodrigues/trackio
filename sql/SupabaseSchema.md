## Supabase Schema

| table_name           | column_name       | data_type                | is_nullable | column_default               | is_primary_key | referenced_table_name | referenced_column_name |
| -------------------- | ----------------- | ------------------------ | ----------- | ---------------------------- | -------------- | --------------------- | ---------------------- |
| device_group_members | device_id         | uuid                     | NO          | null                         | true           | devices               | id                     |
| device_group_members | group_id          | uuid                     | NO          | null                         | true           | device_groups         | id                     |
| device_group_members | added_at          | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| device_groups        | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| device_groups        | traccar_group_id  | integer                  | YES         | null                         | false          | null                  | null                   |
| device_groups        | name              | character varying        | NO          | null                         | false          | null                  | null                   |
| device_groups        | description       | text                     | YES         | null                         | false          | null                  | null                   |
| device_groups        | is_active         | boolean                  | YES         | true                         | false          | null                  | null                   |
| device_groups        | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| device_groups        | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| devices              | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| devices              | traccar_device_id | integer                  | NO          | null                         | false          | null                  | null                   |
| devices              | name              | character varying        | NO          | null                         | false          | null                  | null                   |
| devices              | unique_id         | character varying        | NO          | null                         | false          | null                  | null                   |
| devices              | model             | character varying        | YES         | null                         | false          | null                  | null                   |
| devices              | status            | character varying        | YES         | 'offline'::character varying | false          | null                  | null                   |
| devices              | last_update       | timestamp with time zone | YES         | null                         | false          | null                  | null                   |
| devices              | latitude          | numeric                  | YES         | null                         | false          | null                  | null                   |
| devices              | longitude         | numeric                  | YES         | null                         | false          | null                  | null                   |
| devices              | speed             | numeric                  | YES         | null                         | false          | null                  | null                   |
| devices              | course            | numeric                  | YES         | null                         | false          | null                  | null                   |
| devices              | is_active         | boolean                  | YES         | true                         | false          | null                  | null                   |
| devices              | metadata          | jsonb                    | YES         | null                         | false          | null                  | null                   |
| devices              | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| devices              | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| permissions          | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| permissions          | name              | character varying        | NO          | null                         | false          | null                  | null                   |
| permissions          | description       | text                     | YES         | null                         | false          | null                  | null                   |
| permissions          | resource          | character varying        | NO          | null                         | false          | null                  | null                   |
| permissions          | action            | character varying        | NO          | null                         | false          | null                  | null                   |
| permissions          | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| permissions          | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| profiles             | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| profiles             | user_id           | uuid                     | NO          | null                         | false          | null                  | null                   |
| profiles             | first_name        | character varying        | YES         | null                         | false          | null                  | null                   |
| profiles             | last_name         | character varying        | YES         | null                         | false          | null                  | null                   |
| profiles             | phone             | character varying        | YES         | null                         | false          | null                  | null                   |
| profiles             | avatar_url        | text                     | YES         | null                         | false          | null                  | null                   |
| profiles             | is_active         | boolean                  | YES         | true                         | false          | null                  | null                   |
| profiles             | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| profiles             | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| role_permissions     | role_id           | uuid                     | NO          | null                         | true           | roles                 | id                     |
| role_permissions     | permission_id     | uuid                     | NO          | null                         | true           | permissions           | id                     |
| role_permissions     | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| roles                | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| roles                | name              | character varying        | NO          | null                         | false          | null                  | null                   |
| roles                | description       | text                     | YES         | null                         | false          | null                  | null                   |
| roles                | is_system_role    | boolean                  | YES         | false                        | false          | null                  | null                   |
| roles                | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| roles                | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| traccar_sync_log     | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| traccar_sync_log     | profile_id        | uuid                     | YES         | null                         | false          | profiles              | id                     |
| traccar_sync_log     | sync_type         | character varying        | NO          | null                         | false          | null                  | null                   |
| traccar_sync_log     | entity_type       | character varying        | NO          | null                         | false          | null                  | null                   |
| traccar_sync_log     | entity_id         | uuid                     | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | traccar_entity_id | integer                  | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | status            | character varying        | NO          | null                         | false          | null                  | null                   |
| traccar_sync_log     | request_data      | jsonb                    | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | response_data     | jsonb                    | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | error_message     | text                     | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | duration_ms       | integer                  | YES         | null                         | false          | null                  | null                   |
| traccar_sync_log     | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| traccar_users        | id                | uuid                     | NO          | gen_random_uuid()            | true           | null                  | null                   |
| traccar_users        | profile_id        | uuid                     | NO          | null                         | false          | profiles              | id                     |
| traccar_users        | traccar_user_id   | integer                  | NO          | null                         | false          | null                  | null                   |
| traccar_users        | traccar_username  | character varying        | YES         | null                         | false          | null                  | null                   |
| traccar_users        | is_synced         | boolean                  | YES         | false                        | false          | null                  | null                   |
| traccar_users        | last_sync_at      | timestamp with time zone | YES         | null                         | false          | null                  | null                   |
| traccar_users        | sync_error        | text                     | YES         | null                         | false          | null                  | null                   |
| traccar_users        | created_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| traccar_users        | updated_at        | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| traccar_users        | session_token     | text                     | YES         | null                         | false          | null                  | null                   |
| traccar_users        | token_expires_at  | timestamp with time zone | YES         | null                         | false          | null                  | null                   |
| user_device_groups   | profile_id        | uuid                     | NO          | null                         | true           | profiles              | id                     |
| user_device_groups   | group_id          | uuid                     | NO          | null                         | true           | device_groups         | id                     |
| user_device_groups   | can_read          | boolean                  | YES         | true                         | false          | null                  | null                   |
| user_device_groups   | can_write         | boolean                  | YES         | false                        | false          | null                  | null                   |
| user_device_groups   | can_manage        | boolean                  | YES         | false                        | false          | null                  | null                   |
| user_device_groups   | assigned_at       | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| user_device_groups   | assigned_by       | uuid                     | YES         | null                         | false          | profiles              | id                     |
| user_devices         | profile_id        | uuid                     | NO          | null                         | true           | profiles              | id                     |
| user_devices         | device_id         | uuid                     | NO          | null                         | true           | devices               | id                     |
| user_devices         | can_read          | boolean                  | YES         | true                         | false          | null                  | null                   |
| user_devices         | can_write         | boolean                  | YES         | false                        | false          | null                  | null                   |
| user_devices         | can_manage        | boolean                  | YES         | false                        | false          | null                  | null                   |
| user_devices         | assigned_at       | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| user_devices         | assigned_by       | uuid                     | YES         | null                         | false          | profiles              | id                     |
| user_roles           | profile_id        | uuid                     | NO          | null                         | true           | profiles              | id                     |
| user_roles           | role_id           | uuid                     | NO          | null                         | true           | roles                 | id                     |
| user_roles           | assigned_at       | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| user_roles           | assigned_by       | uuid                     | YES         | null                         | false          | profiles              | id                     |

### Database Policies

| schemaname | tablename            | policyname                              | permissive | roles    | cmd    | qual                              | with_check |
| ---------- | -------------------- | --------------------------------------- | ---------- | -------- | ------ | --------------------------------- | ---------- |
| public     | device_group_members | Admins can manage group members         | PERMISSIVE | {public} | ALL    | is_admin()                        | is_admin() |
| public     | device_group_members | Users can read accessible group members | PERMISSIVE | {public} | SELECT | (is_admin() OR (EXISTS ( SELECT 1 |

FROM (user_device_groups udg
JOIN profiles p ON ((udg.profile_id = p.id)))
WHERE ((p.user_id = auth.uid()) AND (udg.group_id = device_group_members.group_id) AND (udg.can_read = true))))) | null |
| public | device_groups | Admins can manage device_groups | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | device_groups | Users can read accessible groups | PERMISSIVE | {public} | SELECT | (is_admin() OR (EXISTS ( SELECT 1
FROM (user_device_groups udg
JOIN profiles p ON ((udg.profile_id = p.id)))
WHERE ((p.user_id = auth.uid()) AND (udg.group_id = device_groups.id) AND (udg.can_read = true))))) | null |
| public | devices | Admins can delete devices | PERMISSIVE | {public} | DELETE | is_admin() | null |
| public | devices | Admins can insert devices | PERMISSIVE | {public} | INSERT | null | is_admin() |
| public | devices | Admins can update devices | PERMISSIVE | {public} | UPDATE | is_admin() | is_admin() |
| public | devices | Users can read accessible devices | PERMISSIVE | {public} | SELECT | (is_admin() OR (EXISTS ( SELECT 1
FROM (user_devices ud
JOIN profiles p ON ((ud.profile_id = p.id)))
WHERE ((p.user_id = auth.uid()) AND (ud.device_id = devices.id) AND (ud.can_read = true))))) | null |
| public | permissions | Admins can manage permissions | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | permissions | Authenticated users can read permissions | PERMISSIVE | {public} | SELECT | (auth.uid() IS NOT NULL) | null |
| public | profiles | Admins can delete profiles | PERMISSIVE | {public} | DELETE | is_admin() | null |
| public | profiles | Admins can insert profiles | PERMISSIVE | {public} | INSERT | null | is_admin() |
| public | profiles | Admins can read all profiles | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | profiles | Admins can update all profiles | PERMISSIVE | {public} | UPDATE | is_admin() | is_admin() |
| public | profiles | Users can insert own profile | PERMISSIVE | {public} | INSERT | null | (user_id = auth.uid()) |
| public | profiles | Users can read own profile | PERMISSIVE | {public} | SELECT | (user_id = auth.uid()) | null |
| public | profiles | Users can update own profile | PERMISSIVE | {public} | UPDATE | (user_id = auth.uid()) | (user_id = auth.uid()) |
| public | role_permissions | Admins can manage role_permissions | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | role_permissions | Authenticated users can read role_permissions | PERMISSIVE | {public} | SELECT | (auth.uid() IS NOT NULL) | null |
| public | roles | Admins can manage roles | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | roles | Authenticated users can read roles | PERMISSIVE | {public} | SELECT | (auth.uid() IS NOT NULL) | null |
| public | traccar_sync_log | Admins can delete sync logs | PERMISSIVE | {public} | DELETE | is_admin() | null |
| public | traccar_sync_log | Admins can insert sync logs | PERMISSIVE | {public} | INSERT | null | is_admin() |
| public | traccar_sync_log | Admins can read all sync logs | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | traccar_sync_log | Users can read own sync logs | PERMISSIVE | {public} | SELECT | ((profile_id IN ( SELECT profiles.id
FROM profiles
WHERE (profiles.user_id = auth.uid()))) OR (profile_id IS NULL)) | null |
| public | traccar_users | Admins can manage traccar_users | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | traccar_users | Admins can read all traccar_users | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | traccar_users | Users can read own traccar_user | PERMISSIVE | {public} | SELECT | (profile_id IN ( SELECT profiles.id
FROM profiles
WHERE (profiles.user_id = auth.uid()))) | null |
| public | user_device_groups | Admins can manage group assignments | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | user_device_groups | Admins can read all group assignments | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | user_device_groups | Users can read own group assignments | PERMISSIVE | {public} | SELECT | (profile_id IN ( SELECT profiles.id
FROM profiles
WHERE (profiles.user_id = auth.uid()))) | null |
| public | user_devices | Admins can manage device assignments | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | user_devices | Admins can read all device assignments | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | user_devices | Users can read own device assignments | PERMISSIVE | {public} | SELECT | (profile_id IN ( SELECT profiles.id
FROM profiles
WHERE (profiles.user_id = auth.uid()))) | null |
| public | user_roles | Admins can manage user_roles | PERMISSIVE | {public} | ALL | is_admin() | is_admin() |
| public | user_roles | Admins can read all user_roles | PERMISSIVE | {public} | SELECT | is_admin() | null |
| public | user_roles | Users can read own roles | PERMISSIVE | {public} | SELECT | (profile_id IN ( SELECT profiles.id
FROM profiles
WHERE (profiles.user_id = auth.uid()))) | null |
